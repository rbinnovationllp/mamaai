import { store } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { AIService } from "@/lib/ai/ai-service";
import { SafetyValidationService } from "@/lib/ai/safety-validation-service";
import type {
  CreateMealPlanRequest,
  ReplaceMealRequest,
  MealAttendanceEntry,
  MealTime,
  FamilyMember,
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

  /**
   * Translates incoming slot/todayAttendance into structured MealAttendanceEntry objects
   * so portions and dietary constraints only apply to active home/tiffin members.
   */
  private buildEffectiveAttendance(
    request: CreateMealPlanRequest,
    allMembers: FamilyMember[]
  ): MealAttendanceEntry[] {
    if (request.mealAttendance && request.mealAttendance.length > 0) {
      return request.mealAttendance;
    }

    const targetSlot = (request.mealSlot || request.mealTime || "lunch") as MealTime;
    const allMemberIds = allMembers.map((m) => m.memberId);

    // 1. Check if slot-level attendance matrix is provided
    if (request.dayAttendancePlan) {
      const slotMap: Record<string, "breakfast" | "lunch" | "snacks" | "dinner"> = {
        breakfast: "breakfast",
        lunch: "lunch",
        dinner: "dinner",
        snack: "snacks",
        evening_snack: "snacks",
        high_tea: "snacks",
      };
      const key = slotMap[targetSlot] || "lunch";
      const slotAttendance = request.dayAttendancePlan[key] || {};

      const participatingMemberIds = allMemberIds.filter(
        (id) => slotAttendance[id] === "home" || slotAttendance[id] === "tiffin" || !slotAttendance[id]
      );
      const absentMemberIds = allMemberIds.filter((id) => slotAttendance[id] === "skip");
      const fastingMemberIds = allMemberIds.filter((id) => slotAttendance[id] === "fasting");

      return [
        {
          mealTime: targetSlot,
          participatingMemberIds,
          absentMemberIds,
          fastingMemberIds,
          guestCount: request.dayAttendancePlan.guestCountBySlot?.[key] || 0,
          enabled: true,
        },
      ];
    }

    // 2. Check if today's quick attendance list is provided
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
          participatingMemberIds,
          absentMemberIds,
          fastingMemberIds,
          guestCount: 0,
          enabled: true,
        },
      ];
    }

    // Default: Everyone is present and dining
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

  async generate(request: CreateMealPlanRequest) {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    const familyContext = await this.familyService.getFamilyWithMembers(request.familyId);
    if (!familyContext) {
      throw new Error("Family not found.");
    }

    // Compute effective attendance based on meal-wise inputs
    const mealAttendance = this.buildEffectiveAttendance(request, familyContext.members);

    // Active members are those participating or fasting (food is prepared for them)
    const activeMemberIds = new Set(
      mealAttendance.flatMap((a) => [...a.participatingMemberIds, ...a.fastingMemberIds])
    );
    const activeMembers = familyContext.members.filter((m) => activeMemberIds.has(m.memberId));

    // Target active member nutrition guidance
    const nutritionContexts = this.nutritionContextService.analyze(
      activeMembers.length > 0 ? activeMembers : familyContext.members
    );

    // AI Generation with exact active roster and timings
    const generatedMealPlan = this.aiService.generateFamilyMealPlan({
      family: {
        ...familyContext.family,
        mealTimings: request.customMealTimings || familyContext.family.mealTimings,
      },
      members: familyContext.members,
      planType: request.planType,
      mealTime: (request.mealSlot || request.mealTime || "lunch") as MealTime,
      mealTimeContext: request.mealTimeContext,
      mealAttendance,
      highTeaPreference: request.highTeaPreference,
      userPlanningMode: request.userPlanningMode,
      previousMeals: request.previousMeals,
      targetDate: request.targetDate ?? new Date().toISOString().slice(0, 10),
    });

    // Safety validation across members
    const safety = this.safetyValidationService.validateMealPlan(generatedMealPlan, familyContext.members);
    if (!safety.ok) {
      throw new Error(`Meal plan failed safety validation: ${safety.errors.join(" ")}`);
    }

    const mealPlan = this.aiService.localizeFamilyMealPlan(generatedMealPlan, request.mealTimeContext?.locale);

    // Save to in-memory fallback and persist to DynamoDB
    store.mealPlans.push(mealPlan);
    try {
      await this.repository.saveMealPlan(mealPlan);
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Meal plan DynamoDB save failed; using in-memory fallback:", error);
    }

    return { nutritionContexts, mealPlan };
  }

  async replace(mealPlanId: string, request: ReplaceMealRequest) {
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
      replacement: true,
      replacementReason: request.reason,
      excludedMealNames: [
        existing.commonMeal.name,
        ...(request.dislikedFoods ?? []),
        ...(request.previousMeals ?? []),
      ],
      previousMeals: [existing.commonMeal.name, ...(request.previousMeals ?? [])],
    });

    const mealPlan = {
      ...this.aiService.localizeFamilyMealPlan(replacement, request.preferredLanguage),
      mealPlanId: existing.mealPlanId,
      createdAt: existing.createdAt,
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
