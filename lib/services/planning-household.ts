import { nowIso } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import type { CreateMealPlanRequest, Family, FamilyMember } from "@/lib/shared/contracts";

export class PlanningHouseholdError extends Error {
  constructor(public code: "FORBIDDEN" | "FAMILY_PROFILE_REQUIRED") {
    super(code === "FORBIDDEN" ? "This household is unavailable to the signed-in customer." : "Complete your family profile before planning meals.");
  }
}

function dietPreferenceForMember(preference?: string): FamilyMember["dietType"] {
  if (preference === "eggetarian") return "eggitarian";
  if (preference === "jain") return "jain";
  // The shared contract has no pescatarian value. Preserve the narrower
  // permission set below instead of widening the member to unrestricted meat.
  if (preference === "pescatarian") return "non_vegetarian";
  if (preference === "semi_vegetarian") return "non_vegetarian";
  if (preference === "vegetarian" || preference === "non_vegetarian" || preference === "vegan") return preference;
  return "other";
}

function familyDietFromProfile(customerDiet: string | undefined, members: Array<{ foodPreference?: string }>): Family["dietPreference"] {
  if (customerDiet === "vegetarian" || customerDiet === "non_vegetarian" || customerDiet === "semi_vegetarian" || customerDiet === "eggetarian" || customerDiet === "vegan" || customerDiet === "mixed") {
    return customerDiet;
  }
  const preferences = new Set(members.map((member) => member.foodPreference).filter(Boolean));
  if (preferences.has("vegan") && preferences.size === 1) return "vegan";
  if (preferences.has("non_vegetarian")) return preferences.size > 1 ? "mixed" : "non_vegetarian";
  if (preferences.has("eggetarian")) return preferences.size > 1 ? "mixed" : "eggetarian";
  if (preferences.has("semi_vegetarian")) return "semi_vegetarian";
  if (preferences.has("vegetarian")) return "vegetarian";
  return "mixed";
}

export async function resolvePlanningHousehold(request: CreateMealPlanRequest, profiles = new CustomerProfileRepository(), legacy = new FamilyMealRepository()) {
  if (!request.userId) throw new PlanningHouseholdError("FORBIDDEN");
  const profile = await profiles.getFamilyProfile(request.userId);
  if (!profile) {
    const persisted = await legacy.getFamilyContext(request.familyId);
    if (persisted && persisted.family.userId !== request.userId) throw new PlanningHouseholdError("FORBIDDEN");
    if (persisted?.members.length) return persisted;
    throw new PlanningHouseholdError("FAMILY_PROFILE_REQUIRED");
  }
  if (profile.familyId !== request.familyId) throw new PlanningHouseholdError("FORBIDDEN");
  if (!profile.members?.length) throw new PlanningHouseholdError("FAMILY_PROFILE_REQUIRED");
  const customer = await profiles.getCustomer(request.userId);
    const generatedAt = nowIso();
    // MAMAAI's verified regional catalogue is Indian. A missing optional
    // request context must use that catalogue rather than fall through to
    // generic drafts with composite, unverifiable ingredients.
    const country = request.mealTimeContext?.country || "India";
    const state = request.mealTimeContext?.region || "Home region";
    const city = request.mealTimeContext?.city || state;
    const family: Family = {
      familyId: profile.familyId,
      userId: request.userId,
      name: `${customer?.name || profile.members[0]?.name || "MAMAAI"} Household`,
      country,
      state,
      city,
      dietPreference: familyDietFromProfile(customer?.householdFoodPreference, profile.members),
      cuisinePreferences: [
        ...(customer?.mealTypePreferences ? Object.values(customer.mealTypePreferences).flat().filter(Boolean) : []),
        customer?.cookingHabit || "fresh_home_cooked",
      ].slice(0, 12),
      localIngredientAvailabilityNotes: [
        "Recovered planning context from saved customer family profile for cross-device continuity.",
        customer?.cookingHabit ? `Saved cooking habit: ${customer.cookingHabit}.` : "Cooking habit not specified; avoid country-only assumptions.",
        customer?.budgetPreference ? `Saved budget preference: ${customer.budgetPreference}.` : "Budget preference not specified; use moderate practical cost control.",
      ],
      weeklyFoodRoutineStatus: customer?.weeklyFoodRoutineStatus ?? "skip",
      weeklyFoodRoutine: customer?.weeklyFoodRoutine ?? [],
      mealTypePreferences: customer?.mealTypePreferences ?? {},
      recentMealHistory: customer?.recentMealHistory ?? [],
      mealTimings: customer?.mealTimings ?? {},
      nonVegPreferredFoods: customer?.nonVegPreferredFoods ?? [],
      cultureProfile: { country, region: state, city },
      budget: { type: "daily", amount: 700, currency: "INR", priority: "flexible", preferLowCostMeals: customer?.budgetPreference === "economical" },
      kitchenProfile: { equipment: ["Basic home kitchen"], cookingTimePreference: "under_30" },
      subscriptionPlan: profile.suggestedPlan,
      createdAt: profile.createdAt || generatedAt,
      updatedAt: generatedAt,
    };

    const members: FamilyMember[] = profile.members.map((member) => ({
      memberId: member.id,
      familyId: profile.familyId,
      name: member.name,
      relationship: member.relation || "Family member",
      age: member.age ?? 0,
      gender: "prefer_not_to_say",
      activityLevel: member.activityLevel ?? "moderate",
      goals: ["Balanced home meal"],
      dietType: dietPreferenceForMember(member.foodPreference),
      dietaryPermissions: member.dietaryPermissions,
      weekdayDietRules: (member.weekdayDietRules ?? []).flatMap(rule => rule.day ? [{ ...rule, day: rule.day, exclude: rule.exclude ?? [] }] : []),
      festivalDietRules: (member.festivalDietRules ?? []).flatMap(rule => rule.name && rule.confirmedByCustomer ? [{ ...rule, name: rule.name, confirmedByCustomer: true as const, exclude: rule.exclude ?? [] }] : []),
      nonVegFrequency: member.nonVegFrequency,
      nonVegAvoidDays: member.nonVegAvoidDays ?? [],
      nonVegCustomRule: member.nonVegCustomRule,
      likes: member.tiffinPreferences ?? [],
      dislikes: member.dislikes ?? [],
      allergies: member.allergies ?? [],
      foodAllergies: member.allergies ?? [],
      ingredientAllergies: member.allergies ?? [],
      foodDislikes: member.dislikes ?? [],
      dislikedMeals: member.dislikes ?? [],
      excludedIngredients: [],
      dietaryRestrictions: member.doctorAdvisedRestrictions ?? [],
      healthConditions: [],
      doctorRestrictions: member.doctorAdvisedRestrictions ?? [],
      specialStatuses: [],
      fastingPreference: {
        observesFasting: "no",
        regularDays: [],
        allowedFoods: [],
        avoidedFoods: [],
        fruitsAllowed: true,
        dairyAllowed: true,
        grainsRestricted: false,
        customRules: [],
      },
      scheduleRole: member.scheduleRole,
      attendanceDays: member.attendanceDays ?? [],
      holidayOrLeaveDates: member.holidayOrLeaveDates ?? [],
      tiffinPreferences: member.tiffinPreferences ?? [],
      packingStorageLimitations: member.packingStorageLimitations ?? [],
      preferredPreparationTime: member.preferredPreparationTime,
    }));

  return { family, members };
}
