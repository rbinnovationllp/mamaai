"use client";

import { useEffect, useMemo, useState } from "react";
import { AskMamaWidget } from "./AskMamaWidget";
import { MamaFamilyTable } from "./MamaFamilyTable";
import { trackAnalyticsEvent } from "@/lib/shared/client-analytics";
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

const familyNeedCards = [
  { icon: "GM", name: "Grandmother", need: "Softer, easy-to-digest food", color: "green" },
  { icon: "FA", name: "Father", need: "Diet-aware portions", color: "orange" },
  { icon: "MO", name: "Mother", need: "Balanced nutrition", color: "yellow" },
  { icon: "SO", name: "Son", need: "Additional protein", color: "aqua" },
  { icon: "CH", name: "Child", need: "Growth-supportive nutrition", color: "plum" }
];

const featureCards = [
  ["AI Family Meal Planning", "One practical meal planned around the whole family.", "AI"],
  ["Personalized Portions", "Different portions and adjustments for individual needs.", "PT"],
  ["Allergy & Dislike Aware", "Avoid unsafe ingredients and account for disliked foods.", "SA"],
  ["Regional & Seasonal Foods", "Adapted to location, cuisine preference, season and availability.", "RG"],
  ["Fasting-Aware Planning", "Different guidance for fasting or restricted-food days.", "FT"],
  ["Ingredients & Quantities", "Know what to cook and approximately how much to prepare.", "IQ"],
  ["Smart Grocery Planning", "Turn meals into organized grocery requirements.", "GL"],
  ["Recipes & Cooking Help", "Written recipes stay available; video options are clearly labeled.", "RC"]
];

const planPreviewRows = [
  ["Breakfast", "Vegetable poha with curd and fruit"],
  ["Lunch", "Dal, roti, seasonal sabzi and salad"],
  ["High Tea", "Vegetable chilla and unsweetened tea"],
  ["Dinner", "Moong dal khichdi with member adjustments"],
  ["Fruit & Hydration", "Guava, papaya, water and buttermilk guidance"]
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
  const [demoLoading, setDemoLoading] = useState(false);

  const canGenerate = useMemo(() => Boolean(createdFamily), [createdFamily]);
  const adjustedNutrition = useMemo(() => {
    if (!mealPlan) return null;
    return sumNutrition(mealPlan.commonMeal.nutritionEstimate, addOnNutrition[selectedAddOn] ?? addOnNutrition.none, customNutrition);
  }, [customNutrition, mealPlan, selectedAddOn]);

  useEffect(() => {
    trackAnalyticsEvent("homepage_visit");
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

  function scrollToSection(sectionId: string) {
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function loadDemo(mode: "judge" | "standard" = "standard") {
    if (mode === "judge") {
      trackAnalyticsEvent("try_demo_click");
    }
    setDemoLoading(true);
    setJudgeMode(mode === "judge");
    setError("");
    setFeedbackSaved(false);
    setStatus(mode === "judge" ? "Opening Judge Access with fictional demo data..." : "Loading fictional demo family...");
    try {
      const response = await fetch("/api/demo", { cache: "no-store" });
      const data = (await response.json()) as DemoResponse;
      if (!response.ok) {
        throw new Error("Demo could not be loaded.");
      }
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
      if (mode === "judge") {
        scrollToSection("family-profile");
      }
    } catch {
      setStatus("");
      setError("Demo access could not be loaded. Please refresh the page and try again.");
    } finally {
      setDemoLoading(false);
    }
  }

  function updateMember(index: number, patch: Partial<CreateFamilyMemberInput>) {
    setMembers((current) => current.map((member, itemIndex) => (itemIndex === index ? { ...member, ...patch } : member)));
  }

  function startCustomFamily() {
    trackAnalyticsEvent("get_started_click");
    setJudgeMode(false);
    setStatus("Custom family mode ready. Edit the family members, create the family, then plan today.");
    scrollToSection("family-profile");
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
    trackAnalyticsEvent("create_family_success");
    trackAnalyticsEvent("registration_success");
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
    trackAnalyticsEvent("meal_plan_generated");
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
          <span>MAMAAI</span>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="nav-actions">
          <button className="button secondary" type="button" onClick={() => loadDemo("judge")} disabled={demoLoading}>
            {demoLoading ? "Opening Demo..." : "Try Demo"}
          </button>
          <button className="button" type="button" onClick={startCustomFamily}>
            Get Started
          </button>
        </div>
      </header>

      <main className="main">
        <section className="hero landing-hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">Meal & Aahaar Management Assistant</p>
            <h1>One Family. Different Needs. One Intelligent Meal Plan.</h1>
            <p className="lead">
              Tell MAMAAI about your family once. It helps plan what to cook, how much to cook, and how the same family meal
              can be adjusted for everyone.
            </p>
            <div className="actions hero-actions">
              <button className="button hero-button" type="button" onClick={startCustomFamily}>
                Plan My Family Meals
              </button>
              <button className="button judge-button" type="button" onClick={() => loadDemo("judge")} disabled={demoLoading}>
                {demoLoading ? "Opening Judge Demo..." : "Try Demo / Judge Access"}
              </button>
            </div>
            <p className="testing-notice">
              You are using a testing version of MAMAAI. Some features that depend on external services may be limited or temporarily
              unavailable. These integrations are planned to be enabled or expanded as the application progresses toward production.
            </p>
          </div>
          <div className="hero-visual" aria-label="MAMAAI meal planner preview">
            <div className="family-illustration">
              {familyNeedCards.map((member) => (
                <div className={`family-avatar ${member.color}`} key={member.name}>
                  <span>{member.icon}</span>
                  <small>{member.name}</small>
                </div>
              ))}
            </div>
            <div className="phone-preview">
              <p className="eyebrow">Today&apos;s Family Meal</p>
              <h2>Dal + Rice + Vegetables</h2>
              <div className="meal-chip-row">
                <span>Softer for Grandmother</span>
                <span>Adjusted for Father</span>
                <span>Extra protein for Son</span>
              </div>
              <div className="preview-actions">
                <span>View Recipe</span>
                <span>Replace Meal</span>
                <span>Grocery List</span>
              </div>
            </div>
          </div>
        </section>

        <section className="story-section">
          <div>
            <p className="eyebrow">The daily food problem</p>
            <h2>Every Family Eats Together. But Everyone&apos;s Needs Are Different.</h2>
          </div>
          <div className="need-card-grid">
            {familyNeedCards.map((member) => (
              <article className={`need-card ${member.color}`} key={member.name}>
                <span>{member.icon}</span>
                <h3>{member.name}</h3>
                <p>{member.need}</p>
              </article>
            ))}
          </div>
          <div className="common-meal-bridge">
            <span>These profiles come together into</span>
            <strong>One Common Family Meal</strong>
            <small>with personalized portions and adjustments</small>
          </div>
        </section>

        <section className="story-section" id="how-it-works">
          <div>
            <p className="eyebrow">How MAMAAI Works</p>
            <h2>From family profile to practical cooking plan.</h2>
          </div>
          <div className="steps-grid">
            <article>
              <span>1</span>
              <h3>Tell MAMAAI About Your Family</h3>
              <p>Add members, preferences, allergies, fasting, region, cuisine and kitchen context.</p>
            </article>
            <article>
              <span>2</span>
              <h3>MAMAAI Plans One Practical Meal</h3>
              <p>It considers the family together instead of creating separate diet plans for everyone.</p>
            </article>
            <article>
              <span>3</span>
              <h3>Everyone Gets What They Need</h3>
              <p>Portions, adjustments, fruit, hydration, recipes, ingredients and groceries update together.</p>
            </article>
          </div>
        </section>

        <section className="story-section" id="features">
          <div>
            <p className="eyebrow">Core Features</p>
            <h2>Built for real family kitchens.</h2>
          </div>
          <div className="feature-grid">
            {featureCards.map(([title, description, icon]) => (
              <article className="feature-card" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="family-table-showcase">
          <div>
            <p className="eyebrow">MAMA Family Table</p>
            <h2>One Meal. Personalized for Everyone.</h2>
            <p className="lead">Tonight&apos;s family dinner can stay common while each person gets what they need.</p>
          </div>
          <div className="table-orbit">
            <div className="central-meal">
              <span>Dinner</span>
              <strong>Dal + Rice + Mixed Vegetables + Salad</strong>
            </div>
            <p>Grandmother - softer preparation</p>
            <p>Father - adjusted portion</p>
            <p>Mother - balanced portion</p>
            <p>Son - extra protein</p>
            <p>Child - age-appropriate portion + fruit</p>
          </div>
        </section>

        <section className="preview-section">
          <div>
            <p className="eyebrow">Daily Plan Preview</p>
            <h2>Everything a family needs to cook today.</h2>
          </div>
          <div className="dashboard-preview">
            <div className="dashboard-header">
              <strong>Today&apos;s Family Meal Plan</strong>
              <span>Bengaluru - Indian family food</span>
            </div>
            {planPreviewRows.map(([meal, detail]) => (
              <div className="plan-row" key={meal}>
                <span>{meal}</span>
                <p>{detail}</p>
              </div>
            ))}
            <div className="preview-actions">
              <span>View Recipe</span>
              <span>Replace Meal</span>
              <span>View Ingredients</span>
              <span>Grocery List</span>
            </div>
          </div>
        </section>

        <section className="brand-story" id="about">
          <p className="eyebrow">Inspired by the Wisdom of Maa</p>
          <h2>For generations, mothers and grandmothers remembered everyone&apos;s needs before deciding what to cook.</h2>
          <p>
            They remembered what everyone likes, who needs special care, what is available in the kitchen, and what the family can
            afford. MAMAAI brings that caring family wisdom into the AI era.
          </p>
          <strong>The Wisdom of Maa. The Intelligence of AI.</strong>
        </section>

        <section className="final-cta" id="pricing">
          <h2>Stop Asking &quot;What Should We Cook Today?&quot;</h2>
          <p>Let MAMAAI plan smarter for your family.</p>
          <div className="actions">
            <button className="button hero-button" type="button" onClick={startCustomFamily}>
              Create My Family
            </button>
            <button className="button judge-button" type="button" onClick={() => loadDemo("judge")} disabled={demoLoading}>
              {demoLoading ? "Opening Demo..." : "Try MAMAAI Demo"}
            </button>
          </div>
        </section>

        <section className="planner-shell" id="planner">
          <p className="eyebrow">Live Demo Planner</p>
          <h2>What Shall MAMAAI Plan for Your Family Today?</h2>
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
            <button className="button secondary" type="button" onClick={() => loadDemo("standard")} disabled={demoLoading}>
              {demoLoading ? "Loading Demo..." : "Load Demo Family"}
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
          <section className="panel" id="family-profile">
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
                <button className="button secondary" type="button" onClick={startCustomFamily}>
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
                    <button className="button secondary" type="button" onClick={() => setMembers((current) => [...current, initialMember])}>
                      Add Member
                    </button>
                  </div>

                  {members.map((member, index) => (
                    <article className="member-item" key={`${member.name}-${index}`}>
                      <div className="member-header">
                        <strong>{member.name || "Family member"}</strong>
                        <button
                          className="button secondary"
                          type="button"
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
                <button className="button" type="button" onClick={createFamily}>
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
                  <button className="button secondary" type="button" onClick={downloadMealPlan}>
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
                    <button className="button secondary" type="button" onClick={() => saveFeedback("loved")}>
                      Loved It
                    </button>
                    <button className="button secondary" type="button" onClick={() => saveFeedback("good")}>
                      Good
                    </button>
                    <button className="button secondary" type="button" onClick={() => saveFeedback("average")}>
                      Average
                    </button>
                    <button className="button warn" type="button" onClick={() => saveFeedback("dont_suggest_again")}>
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
      <AskMamaWidget onStartFamily={startCustomFamily} onTryDemo={() => loadDemo("judge")} />
    </div>
  );
}
