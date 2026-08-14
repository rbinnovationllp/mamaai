import type {
  SubscriptionEntitlement,
  SubscriptionPlan,
  SubscriptionPlanDefinition,
} from "@/lib/shared/contracts";

export const subscriptionLimits: Record<SubscriptionPlan, number> = {
  // Standardized Tiers
  starter: 4,
  premium: 6,
  family_plus: 10,

  // Legacy Aliases for Backward Compatibility
  family_starter: 4,
  family_premium: 6,
};

export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    plan: "starter",
    displayName: "Family Standard",
    priceMonthlyInr: 399,
    priceMonthlyUsd: 4.99,
    memberLimit: 4,
    revenueCatEntitlementId: "starter_access",
    revenueCatProductId: "mamaai_starter_monthly",
    googlePlayProductId: "mamaai_starter_monthly",
    fairUseLimits: {
      mealPlansPerDay: 10,
      mealReplacementsPerDay: 10,
      askMamaQuestionsPerDay: 20,
      recipeVideoSearchesPerDay: 20,
    },
    razorpayPlanIdEnv: "RAZORPAY_PLAN_STARTER_MONTHLY",
    razorpayPlanId: process.env.RAZORPAY_PLAN_STARTER_MONTHLY,
  },
  {
    plan: "premium",
    displayName: "Family Premium",
    priceMonthlyInr: 599,
    priceMonthlyUsd: 7.99,
    memberLimit: 6,
    revenueCatEntitlementId: "premium_access",
    revenueCatProductId: "mamaai_premium_monthly",
    googlePlayProductId: "mamaai_premium_monthly",
    fairUseLimits: {
      mealPlansPerDay: 30,
      mealReplacementsPerDay: 30,
      askMamaQuestionsPerDay: 100,
      recipeVideoSearchesPerDay: 100,
    },
    razorpayPlanIdEnv: "RAZORPAY_PLAN_PREMIUM_MONTHLY",
    razorpayPlanId: process.env.RAZORPAY_PLAN_PREMIUM_MONTHLY,
  },
  {
    plan: "family_plus",
    displayName: "Family Plus",
    priceMonthlyInr: 999,
    priceMonthlyUsd: 12.99,
    memberLimit: 10,
    revenueCatEntitlementId: "plus_access",
    revenueCatProductId: "mamaai_plus_monthly",
    googlePlayProductId: "mamaai_plus_monthly",
    fairUseLimits: {
      mealPlansPerDay: 100,
      mealReplacementsPerDay: 100,
      askMamaQuestionsPerDay: 500,
      recipeVideoSearchesPerDay: 500,
    },
    razorpayPlanIdEnv: "RAZORPAY_PLAN_PLUS_MONTHLY",
    razorpayPlanId: process.env.RAZORPAY_PLAN_PLUS_MONTHLY,
  },
];

export class SubscriptionService {
  getPlans(): SubscriptionPlanDefinition[] {
    return subscriptionPlans;
  }

  getPlan(plan: SubscriptionPlan): SubscriptionPlanDefinition {
    const canonicalPlan =
      plan === "family_starter"
        ? "starter"
        : plan === "family_premium"
        ? "premium"
        : plan;

    return (
      subscriptionPlans.find((item) => item.plan === canonicalPlan) ??
      subscriptionPlans[0]
    );
  }

  assertMemberLimit(plan: SubscriptionPlan, memberCount: number): void {
    const limit = subscriptionLimits[plan] ?? 4;
    if (memberCount > limit) {
      throw new Error(
        `Your current plan (${plan}) supports up to ${limit} family members. You tried to register ${memberCount}. Please upgrade your subscription.`
      );
    }
  }

  getPlanFeatures(plan: SubscriptionPlan): string[] {
    const canonical =
      plan === "family_starter"
        ? "starter"
        : plan === "family_premium"
        ? "premium"
        : plan;

    switch (canonical) {
      case "family_plus":
        return [
          "Up to 10 family profiles",
          "Unlimited AI meal plan revisions",
          "Advanced nutrient & allergy balancing",
          "Automated smart grocery list",
          "YouTube cooking tutorial recommendations",
          "Extended four-paw family member meal planning",
          "Separate pet-appropriate food guidance",
          "Priority nutrition expert support",
        ];
      case "premium":
        return [
          "Up to 6 family profiles",
          "AI meal plan customization",
          "Doctor restriction adherence",
          "Weekly grocery compilation",
          "Recipe video links",
        ];
      case "starter":
      default:
        return [
          "Up to 4 family profiles",
          "Standard daily meal planning",
          "Basic dietary preferences & allergy filters",
          "Single-day grocery summary",
        ];
    }
  }

  getDemoEntitlement(
    userId: string,
    plan: SubscriptionPlan = "family_plus"
  ): SubscriptionEntitlement {
    return {
      userId,
      plan,
      memberLimit: subscriptionLimits[plan] ?? 10,
      source: "demo_judge_access",
      status: "active",
      paymentChannel: "demo",
      paymentStatus: "paid",
      isActive: true,
      bypassPaymentForDemo: true,
      features: this.getPlanFeatures(plan),
      checkedAt: new Date().toISOString(),
    };
  }

  getJudgeDemoEntitlement(
    userId: string,
    plan: SubscriptionPlan = "family_plus"
  ): SubscriptionEntitlement {
    return this.getDemoEntitlement(userId, plan);
  }

  resolveLocalEntitlement(
    userId: string,
    defaultPlan: SubscriptionPlan = "starter"
  ): SubscriptionEntitlement {
    return {
      userId,
      plan: defaultPlan,
      memberLimit: subscriptionLimits[defaultPlan] ?? 4,
      source: "local_demo",
      status: "active",
      paymentChannel: "demo",
      paymentStatus: "not_required",
      isActive: true,
      bypassPaymentForDemo: true,
      features: this.getPlanFeatures(defaultPlan),
      checkedAt: new Date().toISOString(),
    };
  }
}
