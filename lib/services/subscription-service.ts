import type { SubscriptionPlan } from "@/lib/shared/contracts";

export const subscriptionLimits: Record<SubscriptionPlan, number> = {
  family_starter: 4,
  family_premium: 6,
  family_plus: 10
};

export class SubscriptionService {
  assertMemberLimit(plan: SubscriptionPlan, memberCount: number) {
    const limit = subscriptionLimits[plan];
    if (memberCount > limit) {
      throw new Error(`The selected plan supports up to ${limit} family members.`);
    }
  }
}
