"use client";

import { useEffect, useMemo, useState } from "react";
import { MamaFamilyTable } from "./MamaFamilyTable";
import type {
  CreateFamilyMemberInput,
  Family,
  FamilyDietPreference,
  FamilyMealPlan,
  FamilyMember,
  HighTeaPreference,
  MealAttendanceEntry,
  MealTime,
  MealTimeContext,
  NutritionEstimate,
  NutritionContext
} from "@/lib/shared/contracts";
import { demoMemberInputs } from "@/lib/shared/demo-data";

type DemoResponse = {
  family: Family;
  members: FamilyMember[];
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
};

const demoSteps = [
  "Fictional family profile",
  "Multiple family members",
  "Nutrition context",
  "One common family meal",
  "Personal portions and adjustments",
  "Fruit and hydration",
  "Replace meal",
  "Updated grocery list",
  "MAMA Family Table",
  "Feedback"
];

const familyDietOptions: { value: FamilyDietPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non vegetarian" },
  { value: "semi_vegetarian", label: "Semi vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "mixed", label: "Mixed family" }
];

const addOnNutrition: Record<string, NutritionEstimate> = {
  none: {
    caloriesKcal: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    basis: "No extra food added.",
    dataSource: "User has not added an extra food.",
    confidence: "high"
  },
  egg: {
    caloriesKcal: 70,
    proteinGrams: 6,
    carbsGrams: 1,
    fatGrams: 5,
    fiberGrams: 0,
    basis: "Approximate value for 1 boiled egg.",
    dataSource: "MVP estimate aligned to public food-composition data fields.",
    confidence: "medium"
  },
  paneer: {
    caloriesKcal: 265,
    proteinGrams: 18,
    carbsGrams: 6,
    fatGrams: 20,
    fiberGrams: 0,
    basis: "Approximate value for 100 g paneer.",
    dataSource: "MVP estimate aligned to public food-composition data fields.",
    confidence: "medium"
  },
  chicken: {
    caloriesKcal: 240,
    proteinGrams: 31,
    carbsGrams: 0,
    fatGrams: 12,
    fiberGrams: 0,
    basis: "Approximate value for 100 g cooked chicken.",
    dataSource: "MVP estimate aligned to public food-composition data fields.",
    confidence: "medium"
  },
  dal: {
    caloriesKcal: 180,
    proteinGrams: 12,
    carbsGrams: 28,
    fatGrams: 2,
    fiberGrams: 8,
    basis: "Approximate value for 1 bowl cooked dal.",
    dataSource: "MVP estimate aligned to public food-composition data fields.",
    confidence: "medium"
  }
};

function getUserMealTimeContext(): MealTimeContext {
  const locale = typeof navigator === "undefined" ? "en" : navigator.language;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    hour12: false
  }).formatToParts(new Date());

  return {
    timeZone,
    locale,
    localHour: Number(parts.find((part) => part.type === "hour")?.value ?? "12")
  };
}

function getLocalDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : new Date().toISOString().slice(0, 10);
}

function recommendedMealTime(hour = getUserMealTimeContext().localHour ?? 12): MealTime {
  if (hour < 9) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 18) return "high_tea";
  if (hour >= 18) return "dinner";
  return "dinner";
}

function mealTimingMessage(mealTime: MealTime, context: MealTimeContext) {
  const hour = context.localHour ?? 12;
  const zoneLabel = context.city && context.region ? `${context.city}, ${context.region}` : context.timeZone;
  if (hour < 9) return `Local time in ${zoneLabel} suggests breakfast right now.`;
  if (hour < 10) return `It is still morning in ${zoneLabel}. Choose breakfast or lunch based on what you need.`;
  if (hour >= 16 && hour < 18) return `Late afternoon in ${zoneLabel} suggests high tea or an evening snack.`;
  if (hour >= 18) return `Evening in ${zoneLabel} suggests dinner.`;
  if (mealTime === "lunch") return `Local time in ${zoneLabel} suggests lunch for the next meal.`;
  return "Choose the meal you want MAMA to plan.";
}

const initialMember: CreateFamilyMemberInput = {
  name: "New Member",
  relationship: "Family member",
  age: 30,
  gender: "female",
  heightCm: 160,
  weightKg: 60,
  activityLevel: "moderate",
  goals: ["Healthy living"],
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
  fastingPreference: {
    observesFasting: "no",
    regularDays: [],
    allowedFoods: [],
    avoidedFoods: [],
    fruitsAllowed: true,
    dairyAllowed: true,
    grainsRestricted: false,
    customRules: []
  }
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]) {
  return value.join(", ");
}

function displayList(value: string[], fallback = "None listed") {
  return value.length ? value.join(", ") : fallback;
}

function sumNutrition(base: NutritionEstimate, addOn: NutritionEstimate, custom: NutritionEstimate): NutritionEstimate {
  return {
    caloriesKcal: base.caloriesKcal + addOn.caloriesKcal + custom.caloriesKcal,
    proteinGrams: base.proteinGrams + addOn.proteinGrams + custom.proteinGrams,
    carbsGrams: base.carbsGrams + addOn.carbsGrams + custom.carbsGrams,
    fatGrams: base.fatGrams + addOn.fatGrams + custom.fatGrams,
    fiberGrams: base.fiberGrams + addOn.fiberGrams + custom.fiberGrams,
    basis: custom.caloriesKcal || custom.proteinGrams ? `${base.basis} Includes user-added food estimate.` : base.basis,
    dataSource: `${base.dataSource} User-added custom values are calculated from the values entered by the user.`,
    confidence: custom.caloriesKcal || custom.proteinGrams ? "low" : base.confidence
  };
}

function nutritionFeedback(estimate: NutritionEstimate) {
  if (estimate.proteinGrams >= 75 && estimate.fiberGrams >= 25) {
    return "This looks like a strong family meal estimate: good protein support and useful fiber, assuming portions match the suggestion.";
  }
  if (estimate.proteinGrams < 45) {
    return "This meal may need more protein for the whole family. Consider dal, paneer, egg, curd, soy, fish, or chicken depending on your family preference.";
  }
  if (estimate.fiberGrams < 18) {
    return "This meal may need more fiber. Add vegetables, pulses, millet, fruit, or salad if suitable for the family.";
  }
  return "This suggestion is reasonable for a shared family meal. Values remain estimates and should be adjusted for actual portions.";
}

function mealLabel(mealTime: MealTime) {
  return mealTime === "high_tea"
    ? "High tea"
    : mealTime === "evening_snack"
      ? "Evening snack"
      : mealTime.charAt(0).toUpperCase() + mealTime.slice(1);
}

export function FamilyFlow() {
  const [judgeMode, setJudgeMode] = useState(true);
  const [familyName, setFamilyName] = useState("Bhartiya Demo Family");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [dietPreference, setDietPreference] = useState<FamilyDietPreference>("vegetarian");
  const [cuisineText, setCuisineText] = useState("Indian, Home-style");
  const [members, setMembers] = useState<CreateFamilyMemberInput[]>(demoMemberInputs);
  const [createdFamily, setCreatedFamily] = useState<Family | null>(null);
  const [createdMembers, setCreatedMembers] = useState<FamilyMember[]>([]);
  const [nutritionContexts, setNutritionContexts] = useState<NutritionContext[]>([]);
  const [mealPlan, setMealPlan] = useState<FamilyMealPlan | null>(null);
  const [timeContext] = useState<MealTimeContext>(() => getUserMealTimeContext());
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>(() => recommendedMealTime());
  const [userPlanningMode, setUserPlanningMode] = useState<"new_user_next_meal" | "returning_user_weekly_editable">("new_user_next_meal");
  const [attendanceMemberIds, setAttendanceMemberIds] = useState<string[]>([]);
  const [fastingMemberIds, setFastingMemberIds] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(0);
  const [highTeaEnabled, setHighTeaEnabled] = useState(false);
  const [highTeaTime, setHighTeaTime] = useState("17:00");
  const [highTeaGuestCount, setHighTeaGuestCount] = useState(0);
  const [selectedAddOn, setSelectedAddOn] = useState("none");
  const [customFoodName, setCustomFoodName] = useState("");
  const [customNutrition, setCustomNutrition] = useState<NutritionEstimate>({
    caloriesKcal: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    basis: "User-entered extra food values.",
    dataSource: "User-entered values.",
    confidence: "low"
  });
  const [status, setStatus] = useState("Loading fictional demo family...");
  const [error, setError] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const canGenerate = useMemo(() => Boolean(createdFamily), [createdFamily]);
  const adjustedNutrition = useMemo(() => {
    if (!mealPlan) return null;
    return sumNutrition(mealPlan.commonMeal.nutritionEstimate, addOnNutrition[selectedAddOn] ?? addOnNutrition.none, customNutrition);
  }, [customNutrition, mealPlan, selectedAddOn]);

  useEffect(() => {
    loadDemo();
    // Demo data should load once on first visit; later reloads are user-triggered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncMealAttendance(nextMembers: FamilyMember[]) {
    setAttendanceMemberIds(nextMembers.map((member) => member.memberId));
    setFastingMemberIds(
      nextMembers
        .filter((member) => member.fastingPreference?.observesFasting === "yes")
        .map((member) => member.memberId)
    );
  }

  function toggleAttendance(memberId: string) {
    setAttendanceMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
    setFastingMemberIds((current) => current.filter((id) => id !== memberId));
  }

  function toggleFasting(memberId: string) {
    setFastingMemberIds((current) => (current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]));
    setAttendanceMemberIds((current) => (current.includes(memberId) ? current : [...current, memberId]));
  }

  function mealAttendancePayload(membersForPlan: FamilyMember[]): MealAttendanceEntry[] {
    const memberIds = membersForPlan.map((member) => member.memberId);
    const selectedParticipantIds = attendanceMemberIds.filter((memberId) => memberIds.includes(memberId));
    const participantIds = selectedParticipantIds.length ? selectedParticipantIds : memberIds;
    return [
      {
        mealTime: selectedMealTime,
        participatingMemberIds: participantIds,
        absentMemberIds: membersForPlan.filter((member) => !participantIds.includes(member.memberId)).map((member) => member.memberId),
        fastingMemberIds: fastingMemberIds.filter((memberId) => participantIds.includes(memberId)),
        guestCount,
        enabled: true
      }
    ];
  }

  function highTeaPreferencePayload(): HighTeaPreference {
    return {
      enabled: highTeaEnabled || selectedMealTime === "high_tea",
      days: ["today"],
      approximateTime: highTeaTime,
      usualParticipantMemberIds: attendanceMemberIds,
      guestCount: highTeaGuestCount
    };
  }

  async function loadDemo(mode: "judge" | "standard" = "standard") {
    setJudgeMode(mode === "judge");
    setError("");
    setFeedbackSaved(false);
    setStatus(mode === "judge" ? "Opening Judge Access with fictional demo data..." : "Loading fictional demo family...");
    const response = await fetch("/api/demo");
    const data = (await response.json()) as DemoResponse;
    setCreatedFamily(data.family);
    setCreatedMembers(data.members);
    setNutritionContexts(data.nutritionContexts);
    setMealPlan(data.mealPlan);
    setFamilyName(data.family.name);
    setCountry(data.family.country);
    setCity(data.family.city);
    setState(data.family.state);
    setDietPreference(data.family.dietPreference);
    setCuisineText(data.family.cuisinePreferences.join(", "));
    setMembers(data.members.map(({ memberId: _memberId, familyId: _familyId, ...member }) => member));
    syncMealAttendance(data.members);
    setStatus(
      mode === "judge"
        ? "Judge Access ready. Review the family profile, common meal, personal guidance, fruit, hydration, grocery list, and try Replace Meal."
        : "Demo family loaded. You can edit members, recreate the family, or replace the meal."
    );
  }

  function updateMember(index: number, patch: Partial<CreateFamilyMemberInput>) {
    setMembers((current) => current.map((member, itemIndex) => (itemIndex === index ? { ...member, ...patch } : member)));
  }

  function startCustomFamily() {
    setJudgeMode(false);
    setStatus("Custom family mode ready. Edit the family members, create the family, then plan today.");
  }

  async function createFamily() {
    setError("");
    setFeedbackSaved(false);
    setStatus("Creating family and saving members...");

    const response = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "demo-user",
        family: {
          name: familyName,
          country,
          state,
          city,
          dietPreference,
          cuisinePreferences: splitList(cuisineText),
          budget: { type: "daily", amount: 450, currency: "INR" },
          kitchenProfile: {
            equipment: ["Gas stove", "Pressure cooker", "Mixer/grinder"],
            cookingTimePreference: "under_30"
          },
          subscriptionPlan: "family_premium"
        },
        members: members.map((member) => ({
          ...member,
          allergies: [...new Set([...member.allergies, ...member.foodAllergies, ...member.ingredientAllergies])],
          dislikes: [...new Set([...member.dislikes, ...member.foodDislikes, ...member.dislikedMeals])],
          doctorRestrictions: [...new Set([...member.doctorRestrictions, ...member.dietaryRestrictions])]
        }))
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "Family creation failed.");
      setStatus("");
      return;
    }

    setCreatedFamily(data.family);
    setCreatedMembers(data.members);
    syncMealAttendance(data.members);
    setMealPlan(null);
    setNutritionContexts([]);
    setStatus("Family created. Analyzing profiles and generating one common family meal...");
    await generateMeal(data.family, data.members);
  }

  async function generateMeal(familyForPlan = createdFamily, membersForPlan = createdMembers) {
    if (!familyForPlan) return;

    setError("");
    setFeedbackSaved(false);
    setStatus("Analyzing profiles and generating one common family meal...");
    const planType = userPlanningMode === "returning_user_weekly_editable" ? "weekly" : "daily";

    const response = await fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: familyForPlan.familyId,
        planType,
        mealTime: selectedMealTime,
        mealTimeContext: {
          ...timeContext,
          country: familyForPlan.country,
          region: familyForPlan.state,
          city: familyForPlan.city
        },
        mealAttendance: mealAttendancePayload(membersForPlan),
        highTeaPreference: highTeaPreferencePayload(),
        userPlanningMode,
        targetDate: getLocalDate(timeContext.timeZone)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "Meal generation failed.");
      setStatus("");
      return;
    }

    setNutritionContexts(data.nutritionContexts);
    setMealPlan(data.mealPlan);
    setStatus(
      userPlanningMode === "returning_user_weekly_editable"
        ? "Weekly editable planning mode selected. This demo shows the next meal while preserving the lower-cost reuse strategy."
        : "Common family meal generated with portions, modifications, fruit, hydration, and grocery list."
    );
  }

  async function replaceMeal() {
    if (!mealPlan) return;

    setError("");
    setFeedbackSaved(false);
    setStatus("Replacing meal and recalculating grocery list...");

    const response = await fetch(`/api/meal-plans/${mealPlan.mealPlanId}/replace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "ingredient_unavailable",
        unavailableIngredients: ["Rice"],
        dislikedFoods: []
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "Meal replacement failed.");
      setStatus("");
      return;
    }

    setMealPlan(data.mealPlan);
    setStatus("Meal replaced. Grocery list and estimated cost have been updated.");
  }

  async function saveFeedback(rating: "loved" | "good" | "average" | "dont_suggest_again") {
    if (!mealPlan) return;

    setError("");
    setStatus("Saving family feedback...");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealPlanId: mealPlan.mealPlanId,
        rating
      })
    });

    if (!response.ok) {
      setError("Feedback could not be saved.");
      setStatus("");
      return;
    }

    setFeedbackSaved(true);
    setStatus("Feedback saved for future personalization.");
  }

  function downloadMealPlan() {
    if (!mealPlan) return;

    const payload = {
      exportedAt: new Date().toISOString(),
      retentionNotice: mealPlan.retentionPolicy.userMessage,
      family: createdFamily,
      members: createdMembers.map(({ familyId: _familyId, memberId, name, relationship, age, dietType }) => ({
        memberId,
        name,
        relationship,
        age,
        dietType
      })),
      mealPlan
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mamaai-meal-plan-${mealPlan.targetDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MAMA AI</span>
        </div>
        <p className="muted">The Wisdom of Maa. The Intelligence of AI.</p>
      </header>

      <main className="main">
        <section className="hero">
          <p className="eyebrow">One Family. Different Needs. One Intelligent Meal Plan.</p>
          <h1>What Shall MAMA Plan for Your Family Today?</h1>
          <div className="judge-banner">
            <div>
              <p className="eyebrow">Codex Hackathon Judge Access</p>
              <h2>Try the full MAMA AI demo without registration or payment.</h2>
              <p>
                Uses only fictional family data and shows the core innovation in minutes: one common family meal with
                personalized portions, modifications, fruit, hydration, replacement, grocery update, and the MAMA Family Table.
              </p>
            </div>
            <button className="button judge-button" onClick={() => loadDemo("judge")}>
              Try Demo / Judge Access
            </button>
          </div>
          <p className="lead">
            Create a family, add the needs of each family member, and generate one practical common meal with personal portions,
            fruit, hydration, and a grocery list that updates when the meal changes.
          </p>
          <div className="actions">
            <label className="compact-control">
              Meal
              <select value={selectedMealTime} onChange={(event) => setSelectedMealTime(event.target.value as MealTime)}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="high_tea">High Tea</option>
                <option value="evening_snack">Evening Snack</option>
                <option value="dinner">Dinner</option>
              </select>
            </label>
            <label className="compact-control">
              User type
              <select
                value={userPlanningMode}
                onChange={(event) => setUserPlanningMode(event.target.value as "new_user_next_meal" | "returning_user_weekly_editable")}
              >
                <option value="new_user_next_meal">New user - next meal</option>
                <option value="returning_user_weekly_editable">Returning user - weekly editable</option>
              </select>
            </label>
            <button className="button" onClick={() => generateMeal()} disabled={!canGenerate}>
              Plan Today
            </button>
            <button className="button secondary" onClick={() => loadDemo("standard")}>
              Load Demo Family
            </button>
            <button className="button secondary" onClick={replaceMeal} disabled={!mealPlan}>
              Replace Meal
            </button>
          </div>
          {createdMembers.length ? (
            <div className="attendance-panel">
              <div className="member-header">
                <div>
                  <p className="mini-title">{mealLabel(selectedMealTime)} strength</p>
                  <p className="muted">Select who will eat this meal today. Fasting members get a separate fasting-aware suggestion.</p>
                </div>
                <label className="guest-control">
                  Guests
                  <input type="number" min="0" value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value))} />
                </label>
              </div>
              <div className="attendance-grid">
                {createdMembers.map((member) => (
                  <div className="attendance-row" key={member.memberId}>
                    <label>
                      <input
                        type="checkbox"
                        checked={attendanceMemberIds.includes(member.memberId)}
                        onChange={() => toggleAttendance(member.memberId)}
                      />
                      Eating: {member.name}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={fastingMemberIds.includes(member.memberId)}
                        onChange={() => toggleFasting(member.memberId)}
                      />
                      Fasting today
                    </label>
                  </div>
                ))}
              </div>
              <div className="row">
                <label className="checkbox-line">
                  <input type="checkbox" checked={highTeaEnabled} onChange={(event) => setHighTeaEnabled(event.target.checked)} />
                  Family needs high tea planning today
                </label>
                <label>
                  High tea time
                  <input value={highTeaTime} onChange={(event) => setHighTeaTime(event.target.value)} placeholder="17:00" />
                </label>
              </div>
              <label>
                High tea guests
                <input type="number" min="0" value={highTeaGuestCount} onChange={(event) => setHighTeaGuestCount(Number(event.target.value))} />
              </label>
            </div>
          ) : null}
          <p className="muted">
            {mealTimingMessage(selectedMealTime, {
              ...timeContext,
              country: createdFamily?.country,
              region: createdFamily?.state ?? state,
              city: createdFamily?.city ?? city
            })}
          </p>
          <p className="notice">
            Cost-control rule: new users get a focused next-meal plan. Returning users should reuse and edit a weekly plan
            so AI calls stay low and the INR 199 plan can remain financially sustainable.
          </p>
          {judgeMode ? (
            <div className="demo-steps" aria-label="Judge demo checklist">
              {demoSteps.map((step, index) => (
                <span key={step}>
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          ) : null}
          <p className={error ? "status error" : "status"}>{error || status}</p>
        </section>

        <div className="grid">
          <section className="panel">
            <div className="member-header">
              <h2>{judgeMode ? "Fictional Judge Demo Family" : "Create Family"}</h2>
              {judgeMode ? <span className="pill">Payment bypass: demo only</span> : null}
            </div>
            {judgeMode ? (
              <div className="field-grid">
                <p className="notice">
                  Judge Access uses preloaded fictional profiles only. It does not use real personal or medical data and does
                  not require RevenueCat, Google Play Billing, or account registration.
                </p>
                <div className="demo-family-summary">
                  <p className="mini-title">{createdFamily?.name ?? familyName}</p>
                  <p className="muted">
                    {createdFamily?.city ?? city}, {createdFamily?.state ?? state} - Family Premium demo entitlement
                  </p>
                  <p className="muted">Food pattern: {familyDietOptions.find((option) => option.value === createdFamily?.dietPreference)?.label ?? "Vegetarian"}</p>
                </div>
                <div className="member-list">
                  {createdMembers.map((member) => (
                    <article className="member-item demo-profile" key={member.memberId}>
                      <div>
                        <strong>{member.name}</strong>
                        <p className="muted">
                          {member.relationship} - Age {member.age} - {member.activityLevel}
                        </p>
                      </div>
                      <p>
                        <span className="mini-title">Goals: </span>
                        {displayList(member.goals)}
                      </p>
                      <p>
                        <span className="mini-title">Health context: </span>
                        {displayList(member.healthConditions)}
                      </p>
                      <p>
                        <span className="mini-title">Allergies/restrictions: </span>
                        {displayList([
                          ...member.allergies,
                          ...member.foodAllergies,
                          ...member.ingredientAllergies,
                          ...member.excludedIngredients,
                          ...member.dietaryRestrictions,
                          ...member.doctorRestrictions
                        ])}
                      </p>
                      <p>
                        <span className="mini-title">Dislikes: </span>
                        {displayList([...member.dislikes, ...member.foodDislikes, ...member.dislikedMeals])}
                      </p>
                    </article>
                  ))}
                </div>
                <button className="button secondary" onClick={startCustomFamily}>
                  Create Custom Test Family
                </button>
              </div>
            ) : (
              <div className="field-grid">
                <div className="row">
                  <label>
                    Family name
                    <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} />
                  </label>
                  <label>
                    Country of residence
                    <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="United Kingdom" />
                  </label>
                </div>
                <div className="row">
                  <label>
                    City
                    <input value={city} onChange={(event) => setCity(event.target.value)} />
                  </label>
                </div>
                <label>
                  State
                  <input value={state} onChange={(event) => setState(event.target.value)} />
                </label>
                <label>
                  Preferred food culture / cuisine
                  <input
                    value={cuisineText}
                    onChange={(event) => setCuisineText(event.target.value)}
                    placeholder="Indian 70%, British/European 20%, Mediterranean 10%"
                  />
                </label>
                <label>
                  Family food pattern
                  <select value={dietPreference} onChange={(event) => setDietPreference(event.target.value as FamilyDietPreference)}>
                    {familyDietOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="member-list">
                  <div className="member-header">
                    <h2>Add Members</h2>
                    <button className="button secondary" onClick={() => setMembers((current) => [...current, initialMember])}>
                      Add Member
                    </button>
                  </div>

                  {members.map((member, index) => (
                    <article className="member-item" key={`${member.name}-${index}`}>
                      <div className="member-header">
                        <strong>{member.name || "Family member"}</strong>
                        <button
                          className="button secondary"
                          onClick={() => setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          disabled={members.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="field-grid">
                        <div className="row">
                          <label>
                            Name
                            <input value={member.name} onChange={(event) => updateMember(index, { name: event.target.value })} />
                          </label>
                          <label>
                            Relationship
                            <input value={member.relationship} onChange={(event) => updateMember(index, { relationship: event.target.value })} />
                          </label>
                        </div>
                        <div className="row">
                          <label>
                            Age
                            <input
                              type="number"
                              value={member.age}
                              onChange={(event) => updateMember(index, { age: Number(event.target.value) })}
                            />
                          </label>
                          <label>
                            Activity
                            <select
                              value={member.activityLevel}
                              onChange={(event) => updateMember(index, { activityLevel: event.target.value as CreateFamilyMemberInput["activityLevel"] })}
                            >
                              <option value="sedentary">Sedentary</option>
                              <option value="light">Light</option>
                              <option value="moderate">Moderate</option>
                              <option value="heavy">Heavy</option>
                              <option value="athlete">Athlete</option>
                            </select>
                          </label>
                        </div>
                        <div className="row">
                          <label>
                            Height cm
                            <input
                              type="number"
                              value={member.heightCm ?? ""}
                              onChange={(event) => updateMember(index, { heightCm: Number(event.target.value) })}
                            />
                          </label>
                          <label>
                            Weight kg
                            <input
                              type="number"
                              value={member.weightKg ?? ""}
                              onChange={(event) => updateMember(index, { weightKg: Number(event.target.value) })}
                            />
                          </label>
                        </div>
                        <label>
                          Health context
                          <input
                            value={joinList(member.healthConditions)}
                            onChange={(event) => updateMember(index, { healthConditions: splitList(event.target.value) })}
                            placeholder="Diabetes, hypertension"
                          />
                        </label>
                        <label>
                          Food allergies
                          <input
                            value={joinList(member.foodAllergies)}
                            onChange={(event) => updateMember(index, { foodAllergies: splitList(event.target.value) })}
                            placeholder="Peanut, shellfish, milk"
                          />
                        </label>
                        <label>
                          Ingredient allergies
                          <input
                            value={joinList(member.ingredientAllergies)}
                            onChange={(event) => updateMember(index, { ingredientAllergies: splitList(event.target.value) })}
                            placeholder="Peanut oil, sesame, egg"
                          />
                        </label>
                        <label>
                          Food dislikes
                          <input
                            value={joinList(member.foodDislikes)}
                            onChange={(event) => updateMember(index, { foodDislikes: splitList(event.target.value) })}
                            placeholder="Very spicy food, bitter food"
                          />
                        </label>
                        <label>
                          Meals or dishes not liked
                          <input
                            value={joinList(member.dislikedMeals)}
                            onChange={(event) => updateMember(index, { dislikedMeals: splitList(event.target.value) })}
                            placeholder="Khichdi, poha"
                          />
                        </label>
                        <label>
                          Ingredients never include
                          <input
                            value={joinList(member.excludedIngredients)}
                            onChange={(event) => updateMember(index, { excludedIngredients: splitList(event.target.value) })}
                            placeholder="Mushroom, bitter gourd"
                          />
                        </label>
                        <label>
                          Dietary restrictions
                          <input
                            value={joinList(member.dietaryRestrictions)}
                            onChange={(event) => updateMember(index, { dietaryRestrictions: splitList(event.target.value) })}
                            placeholder="Low sugar, low salt, no fried food"
                          />
                        </label>
                        <label>
                          Doctor restrictions
                          <input
                            value={joinList(member.doctorRestrictions)}
                            onChange={(event) => updateMember(index, { doctorRestrictions: splitList(event.target.value) })}
                            placeholder="Avoid sugary beverages"
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
                <button className="button" onClick={createFamily}>
                  Create Family
                </button>
              </div>
            )}
          </section>

          <section className="stack">
            {mealPlan && createdMembers.length ? (
              <>
                <MamaFamilyTable
                  members={createdMembers}
                  nutritionContexts={nutritionContexts}
                  mealPlan={mealPlan}
                  familyContext={{
                    country: createdFamily?.country,
                    region: createdFamily?.state,
                    preferredLanguage: timeContext.locale,
                    cuisine: createdFamily?.cuisinePreferences,
                    dietaryPreference: createdFamily?.dietPreference
                  }}
                />

                <section className="panel">
                  <h2>Meal Plan Retention</h2>
                  <p className="notice">{mealPlan.retentionPolicy.userMessage}</p>
                  <p className="muted">
                    This detailed plan expires after {mealPlan.retentionPolicy.detailedHistoryDays} days on {new Date(mealPlan.expiresAt).toLocaleDateString()}.
                    Safety and personalization signals such as allergies, dietary restrictions, fasting preferences, favourites, rejected foods, and feedback are retained separately.
                  </p>
                  <button className="button secondary" onClick={downloadMealPlan}>
                    Download / Export / Save
                  </button>
                </section>

                <section className="panel">
                  <h2>Meal Nutrition Estimate</h2>
                  <p className="muted">{mealPlan.commonMeal.nutritionEstimate.basis}</p>
                  <div className="nutrition-grid">
                    <div>
                      <p className="mini-title">{adjustedNutrition?.caloriesKcal ?? 0} kcal</p>
                      <p className="muted">Energy</p>
                    </div>
                    <div>
                      <p className="mini-title">{adjustedNutrition?.proteinGrams ?? 0} g</p>
                      <p className="muted">Protein</p>
                    </div>
                    <div>
                      <p className="mini-title">{adjustedNutrition?.carbsGrams ?? 0} g</p>
                      <p className="muted">Carbs</p>
                    </div>
                    <div>
                      <p className="mini-title">{adjustedNutrition?.fatGrams ?? 0} g</p>
                      <p className="muted">Fat</p>
                    </div>
                    <div>
                      <p className="mini-title">{adjustedNutrition?.fiberGrams ?? 0} g</p>
                      <p className="muted">Fiber</p>
                    </div>
                  </div>
                  <div className="field-grid">
                    <label>
                      Add a common extra food
                      <select value={selectedAddOn} onChange={(event) => setSelectedAddOn(event.target.value)}>
                        <option value="none">No extra food</option>
                        <option value="egg">1 boiled egg</option>
                        <option value="paneer">100 g paneer</option>
                        <option value="chicken">100 g cooked chicken</option>
                        <option value="dal">1 bowl cooked dal</option>
                      </select>
                    </label>
                    <div className="row">
                      <label>
                        Other food name
                        <input value={customFoodName} onChange={(event) => setCustomFoodName(event.target.value)} placeholder="Example: extra roti" />
                      </label>
                      <label>
                        Calories
                        <input
                          type="number"
                          value={customNutrition.caloriesKcal}
                          onChange={(event) => setCustomNutrition((current) => ({ ...current, caloriesKcal: Number(event.target.value) }))}
                        />
                      </label>
                    </div>
                    <div className="row">
                      <label>
                        Protein g
                        <input
                          type="number"
                          value={customNutrition.proteinGrams}
                          onChange={(event) => setCustomNutrition((current) => ({ ...current, proteinGrams: Number(event.target.value) }))}
                        />
                      </label>
                      <label>
                        Carbs g
                        <input
                          type="number"
                          value={customNutrition.carbsGrams}
                          onChange={(event) => setCustomNutrition((current) => ({ ...current, carbsGrams: Number(event.target.value) }))}
                        />
                      </label>
                    </div>
                    <div className="row">
                      <label>
                        Fat g
                        <input
                          type="number"
                          value={customNutrition.fatGrams}
                          onChange={(event) => setCustomNutrition((current) => ({ ...current, fatGrams: Number(event.target.value) }))}
                        />
                      </label>
                      <label>
                        Fiber g
                        <input
                          type="number"
                          value={customNutrition.fiberGrams}
                          onChange={(event) => setCustomNutrition((current) => ({ ...current, fiberGrams: Number(event.target.value) }))}
                        />
                      </label>
                    </div>
                  </div>
                  <p className="notice">{adjustedNutrition ? nutritionFeedback(adjustedNutrition) : "Generate a meal to see nutrition estimates."}</p>
                  <p className="muted">
                    Source basis: {mealPlan.commonMeal.nutritionEstimate.dataSource}
                    {customFoodName ? ` Custom addition: ${customFoodName}.` : ""}
                  </p>
                </section>

                <section className="panel">
                  <h2>Meal-Wise Ingredients</h2>
                  <p className="muted">
                    Quantities are recalculated from today&apos;s selected family strength, fasting members, and guests.
                  </p>
                  <div className="grocery">
                    {mealPlan.mealIngredientRequirements.map((item) => (
                      <div className="grocery-item" key={item.itemId}>
                        <p className="mini-title">{item.name}</p>
                        <p className="muted">
                          {mealLabel(item.mealTime as MealTime)} - {item.adjustedQuantity} - INR {item.estimatedCost.amount}
                        </p>
                        <p className="muted">{item.notes.join(" ")}</p>
                      </div>
                    ))}
                  </div>
                  {mealPlan.fastingMealRequirements.length ? (
                    <div className="fasting-box">
                      <p className="mini-title">Fasting-aware food</p>
                      {mealPlan.fastingMealRequirements.map((item) => (
                        <p className="muted" key={`${item.memberId}-${item.mealTime}`}>
                          {item.memberName}: {item.suggestion}. Avoid: {displayList(item.avoidedFoods, "None listed")}.
                        </p>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="panel">
                  <h2>Auto-Updated Grocery List</h2>
                  <div className="grocery">
                    {mealPlan.groceryItems.map((item) => (
                      <div className="grocery-item" key={item.itemId}>
                        <p className="mini-title">{item.name}</p>
                        <p className="muted">
                          {item.quantityToPurchase} - INR {item.estimatedCost.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="muted">
                    Estimated meal cost: INR {mealPlan.estimatedCost.mealCost.amount} - Daily estimate: INR{" "}
                    {mealPlan.estimatedCost.dailyCost.amount}
                  </p>
                </section>

                <section className="panel subscription-panel">
                  <h2>Subscription Architecture</h2>
                  <p className="muted">
                    Judge Access safely bypasses payment for demo review. Production entitlement remains server-side and
                    RevenueCat-ready.
                  </p>
                  <div className="plan-grid">
                    <div>
                      <p className="mini-title">Family Starter</p>
                      <p className="muted">INR 199/month - 4 members</p>
                    </div>
                    <div>
                      <p className="mini-title">Family Premium</p>
                      <p className="muted">INR 399/month - 6 members</p>
                    </div>
                    <div>
                      <p className="mini-title">Family Plus</p>
                      <p className="muted">INR 599/month - 10 members</p>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <h2>Family Feedback</h2>
                  <div className="actions">
                    <button className="button secondary" onClick={() => saveFeedback("loved")}>
                      Loved It
                    </button>
                    <button className="button secondary" onClick={() => saveFeedback("good")}>
                      Good
                    </button>
                    <button className="button secondary" onClick={() => saveFeedback("average")}>
                      Average
                    </button>
                    <button className="button warn" onClick={() => saveFeedback("dont_suggest_again")}>
                      Do Not Suggest
                    </button>
                  </div>
                  {feedbackSaved ? <p className="notice">Feedback saved for personalization.</p> : null}
                </section>

                <p className="notice">{mealPlan.disclaimer}</p>
              </>
            ) : (
              <section className="panel">
                <h2>MAMA Family Table</h2>
                <p className="lead">Create a family, then plan today to see the common family dish and personal guidance for each member.</p>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
