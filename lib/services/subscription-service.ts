import type { SubscriptionEntitlement, SubscriptionPlan, SubscriptionPlanDefinition } from "@/lib/shared/contracts";

export const subscriptionLimits: Record<SubscriptionPlan, number> = {
  family_starter: 4,
  family_premium: 6,
  family_plus: 10
};

export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    plan: "family_starter",
    displayName: "Family Starter",
    priceMonthlyInr: 199,
    memberLimit: 4,
    revenueCatEntitlementId: "family_starter",
    revenueCatProductId: "mamaai_family_starter_monthly",
    googlePlayProductId: "mamaai_family_starter_monthly"
  },
  {
    plan: "family_premium",
    displayName: "Family Premium",
    priceMonthlyInr: 399,
    memberLimit: 6,
    revenueCatEntitlementId: "family_premium",
    revenueCatProductId: "mamaai_family_premium_monthly",
    googlePlayProductId: "mamaai_family_premium_monthly"
  },
  {
    plan: "family_plus",
    displayName: "Family Plus",
    priceMonthlyInr: 599,
    memberLimit: 10,
    revenueCatEntitlementId: "family_plus",
    revenueCatProductId: "mamaai_family_plus_monthly",
    googlePlayProductId: "mamaai_family_plus_monthly"
  }
];

export class SubscriptionService {
  getPlans() {
    return subscriptionPlans;
  }

  getJudgeDemoEntitlement(userId: string): SubscriptionEntitlement {
    return {
      userId,
      plan: "family_premium",
      memberLimit: subscriptionLimits.family_premium,
      source: "demo_judge_access",
      isActive: true,
      bypassPaymentForDemo: true,
      checkedAt: new Date().toISOString()
    };
  }

  resolveLocalEntitlement(userId: string, plan: SubscriptionPlan = "family_premium"): SubscriptionEntitlement {
    return {
      userId,
      plan,
      memberLimit: subscriptionLimits[plan],
      source: "local_demo",
      isActive: true,
      bypassPaymentForDemo: false,
      checkedAt: new Date().toISOString()
    };
  }

  assertMemberLimit(plan: SubscriptionPlan, memberCount: number) {
    const limit = subscriptionLimits[plan];
    if (memberCount > limit) {
      throw new Error(`The selected plan supports up to ${limit} family members.`);
    }
  }

  assertEntitlementMemberLimit(entitlement: SubscriptionEntitlement, memberCount: number) {
    if (!entitlement.isActive) {
      throw new Error("Subscription entitlement is not active.");
    }

    if (memberCount > entitlement.memberLimit) {
      throw new Error(`Your current entitlement supports up to ${entitlement.memberLimit} family members.`);
    }
  }
}
