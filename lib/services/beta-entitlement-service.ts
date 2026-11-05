import { isIsolatedRuntime } from "@/lib/server/isolated-runtime-safety";
import type { SubscriptionPlan, SubscriptionRecord } from "@/lib/shared/contracts";
import { subscriptionLimits } from "./subscription-service";
import { randomUUID } from "crypto";

export class BetaEntitlementConfigurationError extends Error {}

const betaPlans = new Set<SubscriptionPlan>(["starter", "premium"]);

function configured(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();
  return value || undefined;
}

export function betaEntitlementConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const tableName = configured(env, "MAMA_AI_DYNAMODB_TABLE_NAME");
  const endAt = configured(env, "MAMA_AI_BETA_END_AT");
  const plan = configured(env, "MAMA_AI_BETA_PLAN") ?? "premium";
  const parsedEnd = endAt ? Date.parse(endAt) : NaN;

  if (
    !isIsolatedRuntime(env) ||
    env.MAMA_AI_ISOLATED_PREVIEW !== "true" ||
    env.MAMA_AI_AWS_IDENTITY_SCOPE !== "preview-isolated" ||
    !tableName?.startsWith("mamaai-preview-beta-") ||
    env.MAMA_AI_BETA_ACCESS_ENABLED !== "true"
  ) {
    throw new BetaEntitlementConfigurationError("Beta access is available only in the approved isolated beta runtime.");
  }
  if (!endAt || !Number.isFinite(parsedEnd) || parsedEnd <= Date.now()) {
    throw new BetaEntitlementConfigurationError("A future MAMA_AI_BETA_END_AT is required for beta access.");
  }
  if (!betaPlans.has(plan as SubscriptionPlan)) {
    throw new BetaEntitlementConfigurationError("MAMA_AI_BETA_PLAN must be starter or premium.");
  }
  return { endAt: new Date(parsedEnd).toISOString(), plan: plan as "starter" | "premium" };
}

export function buildBetaEntitlement(userId: string, configuration = betaEntitlementConfiguration(), now = new Date()): SubscriptionRecord {
  const startsAt = now.toISOString();
  return {
    subscriptionRecordId: `beta_${randomUUID()}`,
    userId,
    plan: configuration.plan,
    status: "trialing",
    paymentChannel: "manual",
    paymentStatus: "not_required",
    source: "beta_operator",
    memberLimit: subscriptionLimits[configuration.plan],
    startsAt,
    expiresAt: configuration.endAt,
    createdAt: startsAt,
    updatedAt: startsAt,
  };
}
