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
    priceMonthlyInr: 399,
    priceMonthlyUsd: 4.99,
    memberLimit: 4,
    revenueCatEntitlementId: "family_starter",
    revenueCatProductId: "mamaai_family_starter_monthly_in",
    revenueCatInternationalProductId: "mamaai_family_starter_monthly_usd",
    googlePlayProductId: "mamaai_family_starter_monthly_in",
    googlePlayInternationalProductId: "mamaai_family_starter_monthly_usd",
    fairUseLimits: {
      mealPlansPerDay: 3,
      mealReplacementsPerDay: 5,
      askMamaQuestionsPerDay: 30,
      recipeVideoSearchesPerDay: 10
    }
  },
  {
    plan: "family_premium",
    displayName: "Family Premium",
    priceMonthlyInr: 599,
    priceMonthlyUsd: 6.99,
    memberLimit: 6,
    revenueCatEntitlementId: "family_premium",
    revenueCatProductId: "mamaai_family_premium_monthly_in",
    revenueCatInternationalProductId: "mamaai_family_premium_monthly_usd",
    googlePlayProductId: "mamaai_family_premium_monthly_in",
    googlePlayInternationalProductId: "mamaai_family_premium_monthly_usd",
    fairUseLimits: {
      mealPlansPerDay: 5,
      mealReplacementsPerDay: 8,
      askMamaQuestionsPerDay: 60,
      recipeVideoSearchesPerDay: 20
    }
  },
  {
    plan: "family_plus",
    displayName: "Family Plus",
    priceMonthlyInr: 799,
    priceMonthlyUsd: 8.99,
    memberLimit: 10,
    revenueCatEntitlementId: "family_plus",
    revenueCatProductId: "mamaai_family_plus_monthly_in",
    revenueCatInternationalProductId: "mamaai_family_plus_monthly_usd",
    googlePlayProductId: "mamaai_family_plus_monthly_in",
    googlePlayInternationalProductId: "mamaai_family_plus_monthly_usd",
    fairUseLimits: {
      mealPlansPerDay: 8,
      mealReplacementsPerDay: 12,
      askMamaQuestionsPerDay: 100,
      recipeVideoSearchesPerDay: 30
    }
  }
];

export class SubscriptionService {
  getPlans() {
    return subscriptionPlans;
  }

  getRegionalPrice(plan: SubscriptionPlan, billingMarket: "india" | "international") {
    const definition = subscriptionPlans.find((item) => item.plan === plan);
    if (!definition) {
      throw new Error("Unknown subscription plan.");
    }

    return billingMarket === "india"
      ? { amount: definition.priceMonthlyInr, currency: "INR", display: `INR ${definition.priceMonthlyInr}/month` }
      : { amount: definition.priceMonthlyUsd, currency: "USD", display: `US$${definition.priceMonthlyUsd}/month` };
  }

  getPlanFeatures(plan: SubscriptionPlan) {
    const shared = [
      "Family profile and member-specific preferences",
      "One common family meal with personalized portions",
      "Written recipe, ingredients, and grocery list",
      "Fruit and hydration recommendations",
      "Meal replacement in the current planning flow"
    ];

    if (plan === "family_plus") {
      return [...shared, "Up to 10 family members", "Highest fair-use allowance planned for production"];
    }

    if (plan === "family_premium") {
      return [...shared, "Up to 6 family members", "Balanced fair-use allowance planned for production"];
    }

    return [...shared, "Up to 4 family members", "Starter fair-use allowance planned for production"];
  }

  getJudgeDemoEntitlement(userId: string): SubscriptionEntitlement {
    return {
      userId,
      plan: "family_premium",
      memberLimit: subscriptionLimits.family_premium,
      source: "demo_judge_access",
      status: "free_demo",
      paymentChannel: "demo",
      paymentStatus: "not_required",
      isActive: true,
      bypassPaymentForDemo: true,
      startsAt: new Date().toISOString(),
      features: this.getPlanFeatures("family_premium"),
      checkedAt: new Date().toISOString()
    };
  }

  resolveLocalEntitlement(userId: string, plan: SubscriptionPlan = "family_premium"): SubscriptionEntitlement {
    return {
      userId,
      plan,
      memberLimit: subscriptionLimits[plan],
      source: "local_demo",
      status: "free_demo",
      paymentChannel: "demo",
      paymentStatus: "not_required",
      isActive: true,
      bypassPaymentForDemo: false,
      startsAt: new Date().toISOString(),
      features: this.getPlanFeatures(plan),
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
