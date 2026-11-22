import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { FreeDailyExperienceError, FreeDailyExperienceRepository } from "@/lib/repositories/free-daily-experience-repository";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { hasCurrentEntitlement } from "@/lib/services/paid-entitlement";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { freeDailyFamilyId, quickDailyMealRequestSchema } from "@/lib/shared/daily-meal-planner";
import type { Family, FamilyMember, MealTime } from "@/lib/shared/contracts";

export const dynamic = "force-dynamic";

function memberDiet(value: string): FamilyMember["dietType"] {
  if (value === "eggetarian") return "eggitarian";
  if (value === "semi_vegetarian") return "non_vegetarian";
  if (value === "vegetarian" || value === "non_vegetarian" || value === "vegan" || value === "jain" || value === "satvik") return value;
  return "other";
}

function familyDiet(value: string): Family["dietPreference"] {
  if (value === "vegetarian" || value === "eggetarian" || value === "non_vegetarian" || value === "semi_vegetarian" || value === "vegan" || value === "mixed") return value;
  return "mixed";
}

/** A short-lived planning context, deliberately separate from the permanent profile. */
function buildFreeContext(input: ReturnType<typeof quickDailyMealRequestSchema.parse>, userId: string, experienceId: string) {
  const familyId = freeDailyFamilyId(experienceId);
  const now = new Date().toISOString();
  const members: FamilyMember[] = Array.from({ length: input.memberCount }, (_, index) => {
    const draft = input.members[index];
    const name = draft?.name?.trim() || `Family member ${index + 1}`;
    const allergies = draft?.allergies ?? [];
    const restrictions = draft?.restrictions ?? [];
    return {
      memberId: draft?.id || `${experienceId}_member_${index + 1}`,
      familyId,
      name,
      relationship: index === 0 ? "Primary household member" : "Family member",
      age: draft?.age ?? 0,
      gender: "prefer_not_to_say",
      activityLevel: "moderate",
      goals: ["Practical family meal"],
      dietType: memberDiet(draft?.diet ?? input.householdDiet),
      likes: draft?.likes ?? [],
      dislikes: draft?.dislikes ?? [],
      allergies,
      foodAllergies: allergies,
      ingredientAllergies: allergies,
      foodDislikes: draft?.dislikes ?? [],
      dislikedMeals: draft?.dislikes ?? [],
      excludedIngredients: [],
      dietaryRestrictions: restrictions,
      healthConditions: [],
      doctorRestrictions: restrictions,
      specialStatuses: [],
      fastingPreference: { observesFasting: "no", regularDays: [], allowedFoods: [], avoidedFoods: [], fruitsAllowed: true, dairyAllowed: true, grainsRestricted: false, customRules: [] },
      scheduleRole: draft?.needsTiffin ? "working" : "other",
      tiffinPreferences: draft?.needsTiffin ? ["Tiffin requested today"] : [],
    };
  });
  const family: Family = {
    familyId,
    userId,
    name: "MAMAAI free daily planning household",
    country: "India",
    state: "Home region",
    city: "Home city",
    dietPreference: familyDiet(input.householdDiet),
    cuisinePreferences: [],
    localIngredientAvailabilityNotes: ["Temporary free daily-planning context.", `Available ingredients confirmed by customer: ${[...input.ingredients, ...input.otherIngredients].join(", ")}`],
    recentMealHistory: [],
    mealTimings: {},
    budget: { type: "daily", currency: "INR", priority: input.cookingPreference === "budget" ? "strict" : "flexible", preferLowCostMeals: input.cookingPreference === "budget" },
    kitchenProfile: { equipment: ["Basic home kitchen"], cookingTimePreference: input.cookingPreference === "quick" || input.cookingPreference === "minimum_effort" ? "under_30" : "30_to_60" },
    subscriptionPlan: "starter",
    createdAt: now,
    updatedAt: now,
  };
  return { family, members };
}

function mealSequence(input: ReturnType<typeof quickDailyMealRequestSchema.parse>): MealTime[] {
  const selected = [...input.meals];
  if (input.schoolTiffins > 0) selected.push("school_tiffin" as never);
  if (input.officeTiffins > 0) selected.push("office_tiffin" as never);
  return selected as MealTime[];
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const repository = new FreeDailyExperienceRepository();
    const subscription = await new SubscriptionRepository().getLatestSubscriptionForUser(user.userId);
    const subscribed = hasCurrentEntitlement(subscription);
    // Keep the completed free plan visible after a customer subscribes, until
    // they create their first paid daily plan. A subscription must not make a
    // confirmed free plan disappear from this screen.
    const paidRecord = subscribed ? await repository.getSubscribedLatest(user.userId) : undefined;
    const freeRecord = paidRecord ? undefined : await repository.getForUser(user.userId);
    const record = paidRecord ?? freeRecord;
    return NextResponse.json({
      subscribed,
      experience: record?.status === "generated" ? record : null,
      experienceKind: paidRecord?.status === "generated" ? "paid" : freeRecord?.status === "generated" ? "free" : undefined,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: { code: "FREE_DAILY_READ_FAILED", message: "Unable to read your saved daily plan." } }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const requestId = `daily_${randomUUID()}`;
  let reservation: Awaited<ReturnType<FreeDailyExperienceRepository["begin"]>> | undefined;
  let transientFamilyId: string | undefined;
  let transientMealPlanIds: string[] = [];
  const repository = new FreeDailyExperienceRepository();
  try {
    requireSameOrigin(request);
    const user = await requireUser(request);
    if (!user.deviceId) return NextResponse.json({ error: { code: "RECOGNIZED_DEVICE_REQUIRED", message: "Please sign in again on this device before starting the free experience." } }, { status: 409 });
    const parsed = quickDailyMealRequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: { code: "FREE_DAILY_INVALID", message: "Please review the daily-planning details and try again." } }, { status: 400 });
    const { aiProcessingConsent: _consent, ...questionnaire } = parsed.data;
    const subscription = await new SubscriptionRepository().getLatestSubscriptionForUser(user.userId);
    const subscribed = hasCurrentEntitlement(subscription);
    if (subscribed) {
      const profile = await new CustomerProfileRepository().getFamilyProfile(user.userId);
      if (!profile?.members.length) return NextResponse.json({ error: { code: "PROFILE_REQUIRED", message: "Complete your family profile before using daily meal planning." } }, { status: 409 });
      const ingredientList = [...parsed.data.ingredients, ...parsed.data.otherIngredients];
      const tiffinNote = [parsed.data.schoolTiffins ? `${parsed.data.schoolTiffins} school tiffin(s)` : "", parsed.data.officeTiffins ? `${parsed.data.officeTiffins} office tiffin(s)` : ""].filter(Boolean).join(", ");
      const planner = new MealPlanningService();
      const mealPlans = await Promise.all(mealSequence(parsed.data).map((mealTime) => planner.generate({
        familyId: profile.familyId, userId: user.userId, planType: "daily", mealTime, targetDate: new Date().toISOString().slice(0, 10), preferredLanguage: parsed.data.preferredLanguage, userPlanningMode: "returning_user_weekly_editable", availableIngredients: ingredientList,
        userPromptOverride: `Create a practical ${mealTime} plan using these confirmed available ingredients first: ${ingredientList.join(", ")}. ${tiffinNote ? `Also plan for ${tiffinNote}.` : ""} Cooking preference: ${parsed.data.cookingPreference}. Clearly state any additional ingredients that are needed rather than assuming they are available.`,
        mealAttendance: [{ mealTime, participatingMemberIds: profile.members.map((member) => member.id), absentMemberIds: [], fastingMemberIds: [], guestCount: 0, enabled: true }],
      }))).then((results) => results.map((result) => result.mealPlan));
      const experience = await repository.saveSubscribedLatest({ userId: user.userId, deviceId: user.deviceId, questionnaire, mealPlans });
      return NextResponse.json({ generated: true, reused: false, subscribed: true, experience }, { status: 201 });
    }
    reservation = await repository.begin({ experienceId: randomUUID(), userId: user.userId, deviceId: user.deviceId, requestId, questionnaire });
    if (reservation.state === "existing") return NextResponse.json({ generated: true, reused: true, experience: reservation.record });

    const context = buildFreeContext(parsed.data, user.userId, reservation.record.experienceId);
    transientFamilyId = context.family.familyId;
    const familyMeals = new FamilyMealRepository();
    await familyMeals.saveFamilyContext(context);
    const ingredientList = [...parsed.data.ingredients, ...parsed.data.otherIngredients];
    const restrictions = context.members.flatMap((member) => [...member.allergies, ...member.doctorRestrictions]).filter(Boolean);
    const separateMealMembers = context.members
      .filter((member) => parsed.data.members.find((draft) => draft.id === member.memberId || draft.name?.trim() === member.name)?.needsSeparateMeal)
      .map((member) => member.name);
    const tiffinNote = [parsed.data.schoolTiffins ? `${parsed.data.schoolTiffins} school tiffin(s)` : "", parsed.data.officeTiffins ? `${parsed.data.officeTiffins} office tiffin(s)` : ""].filter(Boolean).join(", ");
    const planner = new MealPlanningService();
    const mealPlans = await Promise.all(mealSequence(parsed.data).map((mealTime) => planner.generate({
      familyId: context.family.familyId,
      userId: user.userId,
      planType: "daily",
      mealTime,
      targetDate: new Date().toISOString().slice(0, 10),
      preferredLanguage: parsed.data.preferredLanguage,
      userPlanningMode: "new_user_next_meal",
      availableIngredients: ingredientList,
      userPromptOverride: `Create a practical ${mealTime} plan using these confirmed available ingredients first: ${ingredientList.join(", ")}. ${tiffinNote ? `Also plan for ${tiffinNote}.` : ""} ${separateMealMembers.length ? `Clearly label a safe separate alternative for: ${separateMealMembers.join(", ")}.` : ""} ${restrictions.length ? `Hard safety restrictions: avoid ${restrictions.join(", ")}.` : ""} Cooking preference: ${parsed.data.cookingPreference}. Clearly state any additional ingredients that are needed rather than assuming they are available.`,
      mealAttendance: [{ mealTime, participatingMemberIds: context.members.map((member) => member.memberId), absentMemberIds: [], fastingMemberIds: [], guestCount: 0, enabled: true }],
    }))).then((results) => results.map((result) => result.mealPlan));
    transientMealPlanIds = mealPlans.map((plan) => plan.mealPlanId);
    const complete = await repository.finalize({ record: reservation.record, mealPlans });
    // The completed experience itself owns its saved plan.  Remove the
    // temporary family and duplicate planner records so no unowned profile is
    // left behind if an account is later deleted.
    await Promise.allSettled([
      familyMeals.deleteFamilyContext(context.family.familyId),
      ...transientMealPlanIds.map((mealPlanId) => familyMeals.deleteMealPlan(mealPlanId)),
    ]);
    return NextResponse.json({ generated: true, reused: false, experience: complete }, { status: 201 });
  } catch (error) {
    if (reservation?.state === "started") await repository.abandon(reservation.record);
    if (transientFamilyId) {
      const familyMeals = new FamilyMealRepository();
      await Promise.allSettled([
        familyMeals.deleteFamilyContext(transientFamilyId),
        ...transientMealPlanIds.map((mealPlanId) => familyMeals.deleteMealPlan(mealPlanId)),
      ]);
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof FreeDailyExperienceError) {
      const status = error.code === "FREE_DAILY_IN_PROGRESS" ? 409 : 403;
      const message = error.code === "FREE_DAILY_DEVICE_ALREADY_USED" ? "This recognised device has already used its free daily experience. You can still complete your profile and choose a plan." : error.code === "FREE_DAILY_ALREADY_USED" ? "Your free daily experience has already been used." : "A daily plan is already being prepared. Please wait a moment and reopen it.";
      return NextResponse.json({ error: { code: error.code, message } }, { status });
    }
    return NextResponse.json({ error: { code: "FREE_DAILY_GENERATION_FAILED", message: "We could not generate a safe daily plan. Your free experience was not used; please try again." } }, { status: 422 });
  }
}
