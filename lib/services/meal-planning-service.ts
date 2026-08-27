import { store } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
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
  private readonly repository = new FamilyMealRepository();

  async generate(request: CreateMealPlanRequest) {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    const familyContext = await this.familyService.getFamilyWithMembers(request.familyId);
    if (!familyContext) {
      throw new Error("Family not found.");
    }

    const nutritionContexts = this.nutritionContextService.analyze(familyContext.members);
    const generatedMealPlan = this.aiService.generateFamilyMealPlan({
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

    const safety = this.safetyValidationService.validateMealPlan(generatedMealPlan, familyContext.members);
    if (!safety.ok) {
      throw new Error(`Meal plan failed safety validation: ${safety.errors.join(" ")}`);
    }

    const mealPlan = this.aiService.localizeFamilyMealPlan(generatedMealPlan, request.mealTimeContext?.locale);

    store.mealPlans.push(mealPlan);
    try {
      await this.repository.saveMealPlan(mealPlan);
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Meal plan DynamoDB save failed; using in-memory fallback:", error);
    }

    return { nutritionContexts, mealPlan };
  }

  async replace(mealPlanId: string, _request: ReplaceMealRequest) {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    let existing = await this.repository.getMealPlan(mealPlanId).catch((error) => {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Meal plan DynamoDB read failed; using in-memory fallback:", error);
      return undefined;
    });

    existing = existing ?? store.mealPlans.find((plan) => plan.mealPlanId === mealPlanId);
    if (!existing) {
      throw new Error("Meal plan not found.");
    }

    const familyContext = await this.familyService.getFamilyWithMembers(existing.familyId);
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
    if (index >= 0) store.mealPlans[index] = mealPlan;
    else store.mealPlans.push(mealPlan);

    try {
      await this.repository.saveMealPlan(mealPlan);
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Replacement DynamoDB save failed; using in-memory fallback:", error);
    }

    return { mealPlan };
  }
}
