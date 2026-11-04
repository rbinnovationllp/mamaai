import { createHash, createHmac } from "crypto";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "@/lib/repositories/dynamodb-client";

export type RateLimitScope = "ask_mama_ip" | "ask_mama_user" | "profile_write_ip" | "feedback_user" | "auth_login_ip" | "auth_login_mobile" | "auth_register_ip" | "auth_recovery_ip" | "auth_recovery_mobile" | "auth_password_user" | "household_replace_user" | "household_replace_ip";

export class RateLimitExceededError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Request limit reached.");
  }
}

export class RateLimitStorageError extends Error {
  constructor() {
    super("Request limiting is temporarily unavailable.");
  }
}

export function stableRateLimitKey(value: string): string {
  const secret = process.env.MAMA_AI_RATE_LIMIT_SALT || process.env.AUTH_SECRET;
  if (secret) return createHmac("sha256", secret).update(value).digest("hex");
  // This is only a non-reversible identifier; production must configure a secret salt.
  return createHash("sha256").update(value).digest("hex");
}

export function requestIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown-client";
}

export async function enforceDurableRateLimit(input: {
  scope: RateLimitScope;
  key: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const windowSeconds = Math.max(1, Math.floor(input.windowSeconds));
  const limit = Math.max(1, Math.floor(input.limit));
  const windowStart = Math.floor(now.getTime() / 1000 / windowSeconds) * windowSeconds;
  const expiresAt = windowStart + windowSeconds + 300;
  const keyHash = stableRateLimitKey(input.key);

  try {
    await mamaAiDynamoDb.send(new UpdateCommand({
      TableName: getMamaAiTableName(),
      Key: { PK: `RATE_LIMIT#${input.scope}#${keyHash}`, SK: `WINDOW#${windowStart}` },
      UpdateExpression: "SET #count = if_not_exists(#count, :zero) + :one, #expiresAt = :expiresAt, #entityType = :entityType",
      ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
      ExpressionAttributeNames: { "#count": "count", "#expiresAt": "expiresAt", "#entityType": "entityType" },
      ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":limit": limit, ":expiresAt": expiresAt, ":entityType": "rate_limit_window" },
    }));
  } catch (error) {
    if ((error as { name?: string })?.name === "ConditionalCheckFailedException") {
      const retryAfterSeconds = Math.max(1, windowStart + windowSeconds - Math.floor(now.getTime() / 1000));
      throw new RateLimitExceededError(retryAfterSeconds);
    }
    // Fail closed: accepting unlimited AI/auth traffic during a repository outage is unsafe.
    throw new RateLimitStorageError();
  }
}

export function configuredPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
