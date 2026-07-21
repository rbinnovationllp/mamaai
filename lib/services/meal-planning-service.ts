import { store } from "@/lib/repositories/in-memory-store";
import { AIService } from "@/lib/ai/ai-service";
import { SafetyValidationService } from "@/lib/ai/safety-validation-service";
import type { CreateMealPlanRequest, ReplaceMealRequest } from "@/lib/shared/contracts";
import { NutritionContextService } from "./nutrition-context-service";
import { FamilyService } from "./family-service";
import { MealRetentionService } from "./meal-retention-service";

export class MealPlanningService {
  private readonly familyService = new FamilyService();
  private readonly nutritionContextService = new NutritionContextService();
  private readonly aiService = new AIService();
  private readonly safetyValidationService = new SafetyValidationService();
  private readonly mealRetentionService = new MealRetentionService();

  generate(request: CreateMealPlanRequest) {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    const familyContext = this.familyService.getFamilyWithMembers(request.familyId);
    if (!familyContext) {
      throw new Error("Family not found.");
    }

    const nutritionContexts = this.nutritionContextService.analyze(familyContext.members);
    const mealPlan = this.aiService.generateFamilyMealPlan({
      family: familyContext.family,
      members: familyContext.members,
      planType: request.planType,
      mealTime: request.mealTime,
      mealTimeContext: request.mealTimeContext,
      mealAttendance: request.mealAttendance,
      highTeaPreference: request.highTeaPreference,
      userPlanningMode: request.userPlanningMode,
      targetDate: request.targetDate ?? new Date().toISOString().slice(0, 10)
    });

    const safety = this.safetyValidationService.validateMealPlan(mealPlan, familyContext.members);
    if (!safety.ok) {
      throw new Error(`Meal plan failed safety validation: ${safety.errors.join(" ")}`);
    }

    store.mealPlans.push(mealPlan);
    return { nutritionContexts, mealPlan };
  }

  replace(mealPlanId: string, _request: ReplaceMealRequest) {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    const existing = store.mealPlans.find((plan) => plan.mealPlanId === mealPlanId);
    if (!existing) {
      throw new Error("Meal plan not found.");
    }

    const familyContext = this.familyService.getFamilyWithMembers(existing.familyId);
    if (!familyContext) {
      throw new Error("Family not found.");
    }

    const replacement = this.aiService.generateFamilyMealPlan({
      family: familyContext.family,
      members: familyContext.members,
      planType: existing.planType,
      mealTime: existing.commonMeal.mealTime,
      mealAttendance: existing.mealAttendance,
      targetDate: existing.targetDate,
      replacement: true
    });

    const mealPlan = {
      ...replacement,
      mealPlanId: existing.mealPlanId,
      createdAt: existing.createdAt
    };

    const safety = this.safetyValidationService.validateMealPlan(mealPlan, familyContext.members);
    if (!safety.ok) {
      throw new Error(`Replacement failed safety validation: ${safety.errors.join(" ")}`);
    }

    const index = store.mealPlans.findIndex((plan) => plan.mealPlanId === mealPlanId);
    store.mealPlans[index] = mealPlan;

    return { mealPlan };
  }
}
