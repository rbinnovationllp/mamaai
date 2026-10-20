import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getMamaAiTableName, mamaAiDynamoDb } from "@/lib/repositories/dynamodb-client";
import { stableRateLimitKey } from "@/lib/server/durable-rate-limit";

export type AiOperation = "ask_mama" | "meal_generation" | "meal_regeneration";
export type AiPlan = "starter" | "premium" | "family_plus";
export interface AiQuota { dailyRequests: number; dailyEstimatedCostPaise: number; }
export class AiQuotaConfigurationError extends Error {}
export class AiQuotaExceededError extends Error {}
export class AiQuotaStorageError extends Error {}

function positive(value: string | undefined): number | undefined { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined; }
export function approvedQuotaForPlan(plan: AiPlan): AiQuota | undefined {
  if (process.env.MAMA_AI_QUOTAS_ENABLED !== "true") return undefined;
  const prefix = `MAMA_AI_${plan.toUpperCase()}_`;
  const dailyRequests = positive(process.env[`${prefix}DAILY_AI_REQUESTS`]);
  const dailyEstimatedCostPaise = positive(process.env[`${prefix}DAILY_AI_COST_PAISE`]);
  if (!dailyRequests || !dailyEstimatedCostPaise) throw new AiQuotaConfigurationError("Approved plan quotas are required before enabling quota enforcement.");
  return { dailyRequests, dailyEstimatedCostPaise };
}

export async function reserveApprovedAiQuota(input: { userId: string; plan: AiPlan; operation: AiOperation; estimatedCostPaise: number; now?: Date }): Promise<void> {
  const quota = approvedQuotaForPlan(input.plan);
  if (!quota) return;
  const day = (input.now ?? new Date()).toISOString().slice(0, 10);
  const key = stableRateLimitKey(input.userId);
  try {
    await mamaAiDynamoDb.send(new UpdateCommand({
      TableName: getMamaAiTableName(), Key: { PK: `AI_USAGE#${key}`, SK: `DAY#${day}` },
      UpdateExpression: "SET #requests = if_not_exists(#requests, :zero) + :one, #cost = if_not_exists(#cost, :zero) + :cost, #expiresAt = :expiresAt, #operation = :operation",
      ConditionExpression: "(attribute_not_exists(#requests) OR #requests < :requestLimit) AND (attribute_not_exists(#cost) OR #cost <= :costLimitMinusRequest)",
      ExpressionAttributeNames: { "#requests": "requests", "#cost": "estimatedCostPaise", "#expiresAt": "expiresAt", "#operation": "lastOperation" },
      ExpressionAttributeValues: { ":zero": 0, ":one": 1, ":cost": Math.max(0, Math.floor(input.estimatedCostPaise)), ":requestLimit": quota.dailyRequests, ":costLimitMinusRequest": quota.dailyEstimatedCostPaise - Math.max(0, Math.floor(input.estimatedCostPaise)), ":expiresAt": Math.floor(Date.parse(`${day}T00:00:00.000Z`) / 1000) + 3 * 86400, ":operation": input.operation },
    }));
  } catch (error) {
    if ((error as { name?: string }).name === "ConditionalCheckFailedException") throw new AiQuotaExceededError("Approved daily AI quota reached.");
    throw new AiQuotaStorageError("AI usage could not be verified.");
  }
}
