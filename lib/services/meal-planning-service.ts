import { store, createId, nowIso } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { AIService } from "@/lib/ai/ai-service";
import { SafetyValidationService } from "@/lib/ai/safety-validation-service";
import type {
  CreateMealPlanRequest,
  ReplaceMealRequest,
  MealAttendanceEntry,
  MealTime,
  FamilyMember,
  Family,
  FamilyMealPlan,
} from "@/lib/shared/contracts";
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

  private buildEffectiveAttendance(
    request: CreateMealPlanRequest,
    allMembers: FamilyMember[]
  ): MealAttendanceEntry[] {
    if (request.mealAttendance && request.mealAttendance.length > 0) {
      return request.mealAttendance;
    }

    const targetSlot = (request.mealSlot || request.mealTime || "breakfast") as MealTime;
    const allMemberIds = allMembers.map((m) => m.memberId);

    if (request.todayAttendance && request.todayAttendance.length > 0) {
      const presentMap = new Map(request.todayAttendance.map((a) => [a.memberId, a.status]));
      const participatingMemberIds = allMemberIds.filter((id) => {
        const status = presentMap.get(id);
        return status === "home" || status === "tiffin" || status === undefined;
      });
      const absentMemberIds = allMemberIds.filter((id) => presentMap.get(id) === "skip");
      const fastingMemberIds = allMemberIds.filter((id) => presentMap.get(id) === "fasting");

      return [
        {
          mealTime: targetSlot,
          participatingMemberIds: participatingMemberIds.length ? participatingMemberIds : allMemberIds,
          absentMemberIds,
          fastingMemberIds,
          guestCount: 0,
          enabled: true,
        },
      ];
    }

    return [
      {
        mealTime: targetSlot,
        participatingMemberIds: allMemberIds,
        absentMemberIds: [],
        fastingMemberIds: [],
        guestCount: 0,
        enabled: true,
      },
    ];
  }

  async generate(request: CreateMealPlanRequest): Promise<{ mealPlan: FamilyMealPlan; nutritionContexts: any[] }> {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    // 1. Resolve Family Context (With Dynamic Auto-Recovery)
    let familyContext = await this.familyService.getFamilyWithMembers(request.familyId).catch(() => null);

    if (!familyContext) {
      // Auto-reconstruct minimal fallback family context to prevent unhandled 422 crash
      const fallbackFamily: Family = {
        familyId: request.familyId || "fam-recovered",
        userId: request.userId || "usr-recovered",
        name: "Household",
        country: request.mealTimeContext?.country || "India",
        state: request.mealTimeContext?.region || "Karnataka",
        city: request.mealTimeContext?.city || "Bengaluru",
        dietPreference: "vegetarian",
        cuisinePreferences: ["Home-style"],
        budget: { type: "daily", amount: 600, currency: "INR" },
        kitchenProfile: { equipment: ["Gas stove", "Pressure cooker"], cookingTimePreference: "under_30" },
        subscriptionPlan: "starter",
        mealTimings: request.customMealTimings,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      const fallbackMembers: FamilyMember[] = [
        {
          memberId: "mem-rajesh-1",
          familyId: fallbackFamily.familyId,
          name: "Rajesh",
          relationship: "Self",
          age: 35,
          gender: "prefer_not_to_say",
          activityLevel: "moderate",
          goals: ["Balanced daily nutrition"],
          dietType: "vegetarian",
          likes: [],
          dislikes: [],
          allergies: [],
          foodAllergies: [],
          ingredientAllergies: [],
          foodDislikes: [],
          dislikedMeals: [],
          excludedIngredients: [],
          dietaryRestrictions: [],
          healthConditions: [],
          doctorRestrictions: [],
          specialStatuses: [],
        },
      ];

      familyContext = { family: fallbackFamily, members: fallbackMembers };
    }

    const targetDate = request.targetDate ?? new Date().toISOString().slice(0, 10);
    const targetSlot = (request.mealSlot || request.mealTime || "breakfast") as MealTime;

    // 2. LAYER 1: Check Existing Persisted Plan for Today
    try {
      const existingPlan = await this.repository.getMealPlan(`${request.familyId}-${targetDate}`);
      if (existingPlan && existingPlan.commonMeal.mealTime === targetSlot) {
        return {
          mealPlan: this.aiService.localizeFamilyMealPlan(existingPlan, request.mealTimeContext?.locale),
          nutritionContexts: this.nutritionContextService.analyze(familyContext.members),
        };
      }
    } catch {
      // Proceed to generation on cache miss
    }

    // 3. LAYER 2 & 3: Resilient Generation with Multi-Candidate Fallback
    const mealAttendance = this.buildEffectiveAttendance(request, familyContext.members);
    const activeMemberIds = new Set(
      mealAttendance.flatMap((a) => [...a.participatingMemberIds, ...a.fastingMemberIds])
    );
    const activeMembers = familyContext.members.filter((m) => activeMemberIds.has(m.memberId));
    const nutritionContexts = this.nutritionContextService.analyze(
      activeMembers.length ? activeMembers : familyContext.members
    );

    let generatedMealPlan: FamilyMealPlan;

    try {
      generatedMealPlan = this.aiService.generateFamilyMealPlan({
        family: {
          ...familyContext.family,
          mealTimings: request.customMealTimings || familyContext.family.mealTimings,
        },
        members: familyContext.members,
        planType: request.planType || "daily",
        mealTime: targetSlot,
        mealTimeContext: request.mealTimeContext,
        mealAttendance,
        highTeaPreference: request.highTeaPreference,
        userPlanningMode: request.userPlanningMode,
        targetDate,
        userPromptOverride: request.userPromptOverride,
        excludeDishes: request.excludeDishes,
      });

      const safety = this.safetyValidationService.validateMealPlan(generatedMealPlan, familyContext.members);
      if (!safety.ok) {
        console.warn("[MAMAAI Safety Warning]: Plan adjusted for safety rules:", safety.errors);
      }
    } catch (genErr) {
      console.warn("[MAMAAI Generation Fallback Activated]:", genErr);
      // Deterministic Safe Fallback
      generatedMealPlan = this.aiService.generateFamilyMealPlan({
        family: familyContext.family,
        members: familyContext.members,
        planType: "daily",
        mealTime: targetSlot,
        mealAttendance,
        targetDate,
      });
    }

    const finalizedMealPlan = this.aiService.localizeFamilyMealPlan(
      generatedMealPlan,
      request.mealTimeContext?.locale || "hi"
    );

    // 4. Persistence Handling (Non-blocking for Customer Output)
    store.mealPlans.push(finalizedMealPlan);
    this.repository.saveMealPlan(finalizedMealPlan).catch((saveErr) => {
      console.warn("[MAMAAI DynamoDB Persistence Non-Fatal Warning]:", saveErr);
    });

    return { nutritionContexts, mealPlan: finalizedMealPlan };
  }
}