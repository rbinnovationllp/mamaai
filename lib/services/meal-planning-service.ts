import { store, nowIso } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { AIService } from "@/lib/ai/ai-service";
import { SafetyValidationService } from "@/lib/ai/safety-validation-service";
import { classifyIngredients } from "@/lib/ai/nutrition-validator";
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
import { resolvePlanningHousehold } from "./planning-household";
import { demoFamily, demoMembers } from "@/lib/shared/demo-data";
import { MealRetentionService } from "./meal-retention-service";

function canonicalMealTime(request: Pick<CreateMealPlanRequest, "mealTime" | "mealSlot">): MealTime {
  if (request.mealTime === "snack" || request.mealTime === "evening_snack" || request.mealTime === "high_tea") {
    return "high_tea";
  }
  if (request.mealTime === "office_tiffin" || request.mealTime === "school_tiffin") return request.mealTime;
  if (request.mealTime === "breakfast" || request.mealTime === "lunch" || request.mealTime === "dinner") {
    return request.mealTime;
  }
  if (request.mealSlot === "snacks") return "high_tea";
  if (request.mealSlot === "breakfast" || request.mealSlot === "lunch" || request.mealSlot === "dinner") {
    return request.mealSlot;
  }
  return "breakfast";
}

function uniqueMembersById(members: FamilyMember[]): FamilyMember[] {
  const seen = new Set<string>();
  return members.filter((member) => {
    const key = member.memberId || `${member.name}:${member.relationship}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueCustomizationsByMember(plan: FamilyMealPlan): FamilyMealPlan {
  const seen = new Set<string>();
  const duplicateMemberIds = plan.memberCustomizations
    .map((item) => item.memberId || item.memberName)
    .filter((key, index, keys) => keys.indexOf(key) !== index);
  if (duplicateMemberIds.length) {
    console.warn("DUPLICATE_MEMBER_GUIDANCE_DETECTED", {
      mealId: plan.commonMeal.mealId,
      mealType: plan.commonMeal.mealTime,
      selectedOptionId: plan.commonMeal.mealId,
      guidanceEntryCount: plan.memberCustomizations.length,
      uniqueGuidanceMemberCount: new Set(plan.memberCustomizations.map((item) => item.memberId || item.memberName)).size,
      duplicateMemberIds: Array.from(new Set(duplicateMemberIds)),
    });
  }
  return {
    ...plan,
    memberCustomizations: plan.memberCustomizations.filter((item) => {
      const key = item.memberId || item.memberName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    fruits: plan.fruits.filter((item) => {
      const key = item.memberId || item.memberName;
      if (seen.has(`fruit:${key}`)) return false;
      seen.add(`fruit:${key}`);
      return true;
    }),
    hydration: plan.hydration.filter((item) => {
      const key = item.memberId || item.memberName;
      if (seen.has(`hydration:${key}`)) return false;
      seen.add(`hydration:${key}`);
      return true;
    }),
  };
}

export class MealPlanningService {
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

    const targetSlot = canonicalMealTime(request);
    const allMemberIds = allMembers.map((m) => m.memberId);

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
      const slotGuestCount = request.dayAttendancePlan.guestCountBySlot?.[key] || 0;

      const participatingMemberIds = allMemberIds.filter(
        (id) => slotAttendance[id] === "home" || slotAttendance[id] === "tiffin" || !slotAttendance[id]
      );
      const absentMemberIds = allMemberIds.filter((id) => slotAttendance[id] === "skip");
      const fastingMemberIds = allMemberIds.filter((id) => slotAttendance[id] === "fasting");

      return [
        {
          mealTime: targetSlot,
          participatingMemberIds: participatingMemberIds.length ? participatingMemberIds : allMemberIds,
          absentMemberIds,
          fastingMemberIds,
          guestCount: slotGuestCount,
          enabled: true,
        },
      ];
    }

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

  private extractRecentPulses(family: Family): string[] {
    const history = family.recentMealHistory || [];
    const pastDishNames = history.flatMap((h) => [h.breakfast, h.lunch, h.snacks, h.dinner]).filter(Boolean) as string[];

    const pastPulses = pastDishNames.map((dish) => {
      const classified = classifyIngredients([{ name: dish, quantity: "1 cup", category: "pulses", estimatedCost: { amount: 0, currency: "INR" } }]);
      return classified.detectedPulse;
    }).filter(Boolean) as string[];

    return [...new Set(pastPulses)];
  }

  async generate(request: CreateMealPlanRequest, demo = false): Promise<{ mealPlan: FamilyMealPlan; nutritionContexts: any[] }> {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    let familyContext = demo
      ? { family: demoFamily, members: demoMembers }
      : await resolvePlanningHousehold(request);

    const targetDate = request.targetDate ?? new Date().toISOString().slice(0, 10);
    const targetSlot = canonicalMealTime(request);
    familyContext = { ...familyContext, members: uniqueMembersById(familyContext.members) };

    try {
      const existingPlan = demo || request.excludeDishes?.length ? undefined : await this.repository.getMealPlan(`${request.familyId}-${targetDate}`);
      if (existingPlan && existingPlan.commonMeal.mealTime === targetSlot) {
        const existingSafety = this.safetyValidationService.validateMealPlan(existingPlan, familyContext.members);
        if (!existingSafety.ok) throw new Error(`Existing meal plan failed safety validation: ${[...existingSafety.errors, ...existingSafety.warnings].join(" ")}`);
        return {
          mealPlan: uniqueCustomizationsByMember(this.aiService.localizeFamilyMealPlan(existingPlan, request.preferredLanguage || request.mealTimeContext?.locale)),
          nutritionContexts: this.nutritionContextService.analyze(familyContext.members),
        };
      }
    } catch {
      // Proceed to generation on cache miss
    }

    const mealAttendance = this.buildEffectiveAttendance(request, familyContext.members);
    const activeMemberIds = new Set(
      mealAttendance.flatMap((a) => [...a.participatingMemberIds, ...a.fastingMemberIds])
    );
    const activeMembers = familyContext.members.filter((m) => activeMemberIds.has(m.memberId));
    const nutritionContexts = this.nutritionContextService.analyze(
      activeMembers.length ? activeMembers : familyContext.members
    );

    const finalizedMealPlan = this.safeCandidate({
      family: { ...familyContext.family, mealTimings: request.customMealTimings || familyContext.family.mealTimings, mealSchedule: request.mealSchedule || familyContext.family.mealSchedule },
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
    }, request.preferredLanguage || request.mealTimeContext?.locale || "hi");

    if (!demo && !(request.planType === "weekly" && request.excludeDishes?.length)) {
      await this.repository.saveMealPlan(finalizedMealPlan);
      store.mealPlans = store.mealPlans.filter((plan) => plan.mealPlanId !== finalizedMealPlan.mealPlanId);
      store.mealPlans.push(finalizedMealPlan);
    }

    return { nutritionContexts, mealPlan: finalizedMealPlan };
  }

  private safeCandidate(input: Parameters<AIService["generateFamilyMealPlan"]>[0], language?: string) {
    const excludeDishes = [...(input.excludeDishes ?? [])];
    for (let attempt = 0; attempt < 6; attempt++) {
      let candidate: FamilyMealPlan;
      try {
        candidate = this.aiService.generateFamilyMealPlan({ ...input, excludeDishes });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("No compatible replacement candidate")) throw error;
        break;
      }
      if (this.safetyValidationService.validateMealPlan(candidate, input.members).ok) {
        const localized = uniqueCustomizationsByMember(this.aiService.localizeFamilyMealPlan(candidate, language));
        const alreadyExcluded = excludeDishes.some((name) => name.trim().toLowerCase() === localized.commonMeal.name.trim().toLowerCase());
        if (!alreadyExcluded && this.safetyValidationService.validateMealPlan(localized, input.members).ok) return localized;
      }
      excludeDishes.push(candidate.commonMeal.name);
    }
    throw new Error("No safe alternative fits this slot and the saved household restrictions. Keep the current meal or try a different dish that fits those restrictions.");
  }

  async replace(mealPlanId: string, request: ReplaceMealRequest, userId: string): Promise<{ mealPlan: FamilyMealPlan }> {
    const existingPlan = await this.repository.getMealPlan(mealPlanId);
    if (!existingPlan) throw new Error("Meal plan not found.");

    const familyContext = await resolvePlanningHousehold({ familyId: existingPlan.familyId, userId, planType: existingPlan.planType });

    const targetSlot = existingPlan.commonMeal.mealTime;
    const excludedDishes = Array.from(
      new Set([
        existingPlan.commonMeal.name,
        ...(request.excludeDishes ?? []),
      ].filter(Boolean))
    );

    const localizedPlan = this.safeCandidate({
      family: familyContext.family,
      members: familyContext.members,
      planType: existingPlan.planType,
      mealTime: targetSlot,
      targetDate: existingPlan.targetDate,
      mealAttendance: existingPlan.mealAttendance,
      previousMeals: request.previousMeals,
      excludeDishes: excludedDishes,
      userPromptOverride: [
        request.userPromptOverride,
        `The user rejected "${existingPlan.commonMeal.name}" because: ${request.reason}.`,
        request.unavailableIngredients?.length
          ? `Unavailable ingredients: ${request.unavailableIngredients.join(", ")}.`
          : "",
        request.dislikedFoods?.length ? `Avoid disliked foods: ${request.dislikedFoods.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    }, request.preferredLanguage);
    const replacementPlan: FamilyMealPlan = {
      ...localizedPlan,
      familyId: existingPlan.familyId,
      targetDate: existingPlan.targetDate,
      planType: existingPlan.planType,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await this.repository.saveMealPlan(replacementPlan);

    return { mealPlan: replacementPlan };
  }
}



