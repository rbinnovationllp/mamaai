import { store } from "@/lib/repositories/in-memory-store";
import type { FamilyMealPlan } from "@/lib/shared/contracts";

export const DETAILED_MEAL_PLAN_RETENTION_DAYS = 15;

export const MEAL_PLAN_RETENTION_MESSAGE =
  "Your detailed meal-plan history is retained for up to 15 days. Meal plans older than 15 days may be automatically removed. Please download or save any meal plan you wish to keep for future reference.";

const retainedLongTermSignals = [
  "Family member profiles",
  "Allergies and dietary restrictions",
  "Food dislikes and preferences",
  "Fasting preferences",
  "Favourite and rejected meals",
  "Feedback and lightweight meal preference patterns",
  "Subscription and account information"
];

export function detailedMealPlanExpiresAt(createdAt: string, days = DETAILED_MEAL_PLAN_RETENTION_DAYS) {
  const expiresAt = new Date(createdAt);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + days);
  return expiresAt.toISOString();
}

export function retentionPolicy() {
  return {
    detailedHistoryDays: DETAILED_MEAL_PLAN_RETENTION_DAYS,
    userMessage: MEAL_PLAN_RETENTION_MESSAGE,
    retainedLongTermSignals
  };
}

export class MealRetentionService {
  applyRetentionMetadata<T extends Omit<FamilyMealPlan, "expiresAt" | "retentionPolicy">>(mealPlan: T): T & Pick<FamilyMealPlan, "expiresAt" | "retentionPolicy"> {
    return {
      ...mealPlan,
      expiresAt: detailedMealPlanExpiresAt(mealPlan.createdAt),
      retentionPolicy: retentionPolicy()
    };
  }

  removeExpiredDetailedMealPlans(referenceDate = new Date()) {
    const beforeCount = store.mealPlans.length;
    store.mealPlans = store.mealPlans.filter((plan) => new Date(plan.expiresAt).getTime() > referenceDate.getTime());
    return {
      removed: beforeCount - store.mealPlans.length,
      remaining: store.mealPlans.length
    };
  }
}
