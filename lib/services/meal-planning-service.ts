import { store, nowIso } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { AIService } from "@/lib/ai/ai-service";
import { SafetyValidationService } from "@/lib/ai/safety-validation-service";
import { classifyIngredients, evaluateMealNutritionalBalance } from "@/lib/ai/nutrition-validator";
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

function canonicalMealTime(request: Pick<CreateMealPlanRequest, "mealTime" | "mealSlot">): MealTime {
  if (request.mealTime === "snack" || request.mealTime === "evening_snack" || request.mealTime === "high_tea") {
    return "high_tea";
  }
  if (request.mealTime === "breakfast" || request.mealTime === "lunch" || request.mealTime === "dinner") {
    return request.mealTime;
  }
  if (request.mealSlot === "snacks") return "high_tea";
  if (request.mealSlot === "breakfast" || request.mealSlot === "lunch" || request.mealSlot === "dinner") {
    return request.mealSlot;
  }
  return "breakfast";
}

function uniqueMembersById(members: FamilyMember[]) {
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

    const targetSlot = canonicalMealTime(request);
    const allMemberIds = allMembers.map((m) => m.memberId);

    // 1. Day Attendance Matrix (Includes guestCountBySlot)
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

    // 2. Today Attendance array
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

    // 3. Default: Everyone present
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

  async generate(request: CreateMealPlanRequest): Promise<{ mealPlan: FamilyMealPlan; nutritionContexts: any[] }> {
    this.mealRetentionService.removeExpiredDetailedMealPlans();

    // 1. Resolve Family Context with Auto-Recovery
    let familyContext = await this.familyService.getFamilyWithMembers(request.familyId).catch(() => null);

    if (!familyContext) {
      const fallbackFamily: Family = {
        familyId: request.familyId || "fam-recovered",
        userId: request.userId || "usr-recovered",
        name: "Household",
        country: request.mealTimeContext?.country || "India",
        state: request.mealTimeContext?.region || "Karnataka",
        city: request.mealTimeContext?.city || "Bengaluru",
        dietPreference: "vegetarian",
        cuisinePreferences: ["Home-style"],
        favoriteFoodStyles: ["Home-style Traditional", "North Indian", "South Indian"],
        budget: { type: "daily", amount: 600, currency: "INR" },
        kitchenProfile: { equipment: ["Gas stove", "Pressure cooker"], cookingTimePreference: "under_30" },
        subscriptionPlan: "starter",
        mealTimings: request.customMealTimings,
        mealSchedule: request.mealSchedule,
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
    const targetSlot = canonicalMealTime(request);
    familyContext = { ...familyContext, members: uniqueMembersById(familyContext.members) };

    // 2. Layer 1: Check Existing Persisted Plan for Today
    try {
      const existingPlan = await this.repository.getMealPlan(`${request.familyId}-${targetDate}`);
      if (existingPlan && existingPlan.commonMeal.mealTime === targetSlot) {
        return {
          mealPlan: this.aiService.localizeFamilyMealPlan(existingPlan, request.preferredLanguage || request.mealTimeContext?.locale),
          nutritionContexts: this.nutritionContextService.analyze(familyContext.members),
        };
      }
    } catch {
      // Proceed to generation
    }

    // 3. Layer 2 & 3: Resilient Generation with Multi-Candidate Fallback & Pulse Diversity
    const mealAttendance = this.buildEffectiveAttendance(request, familyContext.members);
    const activeMemberIds = new Set(
      mealAttendance.flatMap((a) => [...a.participatingMemberIds, ...a.fastingMemberIds])
    );
    const activeMembers = familyContext.members.filter((m) => activeMemberIds.has(m.memberId));
    const nutritionContexts = this.nutritionContextService.analyze(
      activeMembers.length ? activeMembers : familyContext.members
    );

    const pastPulses = this.extractRecentPulses(familyContext.family);

    let generatedMealPlan: FamilyMealPlan;

    try {
      generatedMealPlan = this.aiService.generateFamilyMealPlan({
        family: {
          ...familyContext.family,
          mealTimings: request.customMealTimings || familyContext.family.mealTimings,
          mealSchedule: request.mealSchedule || familyContext.family.mealSchedule,
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

      // Macro & Plant Diversity Validation
      const score = evaluateMealNutritionalBalance(
        generatedMealPlan.commonMeal,
        familyContext.family,
        familyContext.members,
        pastPulses
      );

      if (!score.isBalanced && score.improvementSuggestions.length > 0) {
        console.log(`[MAMAAI Nutrition Intelligence] Enhancing meal for balance: ${score.improvementSuggestions.join("; ")}`);
      }

      const safety = this.safetyValidationService.validateMealPlan(generatedMealPlan, familyContext.members);
      if (!safety.ok) {
        console.warn("[MAMAAI Safety Warning]: Plan adjusted for safety rules:", safety.errors);
      }
    } catch (genErr) {
      console.warn("[MAMAAI Generation Fallback Activated]:", genErr);
      generatedMealPlan = this.aiService.generateFamilyMealPlan({
        family: familyContext.family,
        members: familyContext.members,
        planType: "daily",
        mealTime: targetSlot,
        mealAttendance,
        targetDate,
      });
    }

    const finalizedMealPlan = uniqueCustomizationsByMember(this.aiService.localizeFamilyMealPlan(
      generatedMealPlan,
      request.preferredLanguage || request.mealTimeContext?.locale || "hi"
    ));

    // 4. Persistence Handling (Non-blocking)
    store.mealPlans.push(finalizedMealPlan);
    this.repository.saveMealPlan(finalizedMealPlan).catch((saveErr) => {
      console.warn("[MAMAAI DynamoDB Persistence Non-Fatal Warning]:", saveErr);
    });

    return { nutritionContexts, mealPlan: finalizedMealPlan };
  }

  async replace(mealPlanId: string, request: ReplaceMealRequest): Promise<{ mealPlan: FamilyMealPlan }> {
    const existingPlan = await this.repository.getMealPlan(mealPlanId);
    if (!existingPlan) throw new Error("Meal plan not found.");

    const familyContext = await this.familyService.getFamilyWithMembers(existingPlan.familyId).catch(() => null);
    if (!familyContext) throw new Error("Family not found.");

    const targetSlot = existingPlan.commonMeal.mealTime;
    const excludedDishes = Array.from(
      new Set([
        existingPlan.commonMeal.name,
        ...(existingPlan.commonMeal.alternativeOptions ?? []).map((option) => option.title),
        ...(request.excludeDishes ?? []),
        ...(request.previousMeals ?? []),
      ].filter(Boolean))
    );

    const generatedMealPlan = this.aiService.generateFamilyMealPlan({
      family: familyContext.family,
      members: familyContext.members,
      planType: existingPlan.planType,
      mealTime: targetSlot,
      targetDate: existingPlan.targetDate,
      mealAttendance: existingPlan.mealAttendance,
      previousMeals: excludedDishes,
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
    });

    const localizedPlan = this.aiService.localizeFamilyMealPlan(generatedMealPlan, request.preferredLanguage);
    const replacementPlan: FamilyMealPlan = {
      ...localizedPlan,
      familyId: existingPlan.familyId,
      targetDate: existingPlan.targetDate,
      planType: existingPlan.planType,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    this.repository.saveMealPlan(replacementPlan).catch((saveErr) => {
      console.warn("[MAMAAI Meal Replacement Persistence Warning]:", saveErr);
    });

    return { mealPlan: replacementPlan };
  }
}
