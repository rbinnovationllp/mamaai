"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppPageNav } from "@/components/AppPageNav";
import { LanguageSelector, useLanguage } from "@/components/LanguageProvider";
import { DAILY_INGREDIENT_CATALOGUE, type QuickDailyMember } from "@/lib/shared/daily-meal-planner";
import type { FamilyMealPlan } from "@/lib/shared/contracts";

type SavedExperience = {
  questionnaire: { ingredients: string[]; otherIngredients: string[]; memberCount: number };
  mealPlans: FamilyMealPlan[];
};

type ExperienceKind = "free" | "paid" | undefined;
type DailyMeal = "breakfast" | "lunch" | "high_tea" | "dinner";

const copy = {
  en: {
    title: "What to Cook Today?",
    intro: "Try one personalised family day free. Tell us only what changes today, then review the plan before cooking.",
    signIn: "Sign in to start your free plan",
    ingredients: "What ingredients do you have at home?",
    other: "Other ingredients",
    people: "Who is eating today?",
    meals: "Meals to plan",
    consent: "I agree that MAMAAI may use these food and dietary details to prepare this plan. I understand this is meal-planning guidance, not medical treatment.",
    generate: "Generate Today’s FREE Meal Plan",
    generating: "Preparing your family plan…",
    saved: "Your saved free daily meal plan",
    profile: "Create My Family Profile",
    subscription: "View Subscription Plans",
  },
  hi: {
    title: "आज क्या बनाएं?",
    intro: "अपने परिवार के लिए एक दिन की व्यक्तिगत मील प्लानिंग मुफ्त आज़माएं और पकाने से पहले प्लान की समीक्षा करें।",
    signIn: "अपना मुफ्त प्लान शुरू करने के लिए साइन इन करें",
    ingredients: "घर में कौन-कौन सी सामग्री उपलब्ध है?",
    other: "अन्य सामग्री",
    people: "आज कौन भोजन करेगा?",
    meals: "कौन से भोजन प्लान करने हैं",
    consent: "मैं सहमत हूं कि MAMAAI इस प्लान के लिए इन भोजन और आहार विवरणों का उपयोग कर सकता है। यह चिकित्सा उपचार नहीं है।",
    generate: "आज का मुफ्त मील प्लान बनाएं",
    generating: "आपका पारिवारिक प्लान तैयार हो रहा है…",
    saved: "आपका सहेजा गया मुफ्त दैनिक मील प्लान",
    profile: "मेरी फैमिली प्रोफाइल बनाएं",
    subscription: "सब्सक्रिप्शन प्लान देखें",
  },
  kn: {
    title: "ಇಂದು ಏನು ಅಡುಗೆ ಮಾಡೋಣ?",
    intro: "ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಒಂದು ದಿನದ ವೈಯಕ್ತಿಕ ಊಟದ ಯೋಜನೆಯನ್ನು ಉಚಿತವಾಗಿ ಪ್ರಯತ್ನಿಸಿ ಮತ್ತು ಅಡುಗೆ ಮಾಡುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ.",
    signIn: "ನಿಮ್ಮ ಉಚಿತ ಯೋಜನೆ ಪ್ರಾರಂಭಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
    ingredients: "ಮನೆಯಲ್ಲಿ ಯಾವ ಪದಾರ್ಥಗಳಿವೆ?",
    other: "ಇತರ ಪದಾರ್ಥಗಳು",
    people: "ಇಂದು ಯಾರು ಊಟ ಮಾಡುತ್ತಾರೆ?",
    meals: "ಯೋಜಿಸಬೇಕಾದ ಊಟಗಳು",
    consent: "ಈ ಯೋಜನೆಗಾಗಿ MAMAAI ಈ ಆಹಾರ ಮತ್ತು ಆಹಾರಕ್ರಮದ ವಿವರಗಳನ್ನು ಬಳಸಲು ನಾನು ಒಪ್ಪುತ್ತೇನೆ. ಇದು ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ ಅಲ್ಲ.",
    generate: "ಇಂದಿನ ಉಚಿತ ಮೀಲ ಪ್ಲಾನ್ ರಚಿಸಿ",
    generating: "ನಿಮ್ಮ ಕುಟುಂಬದ ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ…",
    saved: "ನಿಮ್ಮ ಉಳಿಸಿದ ಉಚಿತ ದೈನಂದಿನ ಊಟದ ಯೋಜನೆ",
    profile: "ನನ್ನ ಕುಟುಂಬ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
    subscription: "ಚಂದಾದಾರಿಕೆ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ",
  },
} as const;

const dietOptions = ["vegetarian", "eggetarian", "non_vegetarian", "semi_vegetarian", "vegan", "jain", "satvik", "mixed", "other"] as const;
const mealOptions: DailyMeal[] = ["breakfast", "lunch", "high_tea", "dinner"];

function emptyMember(index: number): QuickDailyMember {
  return {
    name: index === 0 ? "" : `Family member ${index + 1}`,
    diet: "vegetarian",
    likes: [],
    dislikes: [],
    allergies: [],
    restrictions: [],
    needsSeparateMeal: false,
    needsTiffin: false,
  };
}

const split = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const dietLabel = (diet: string) => diet.replaceAll("_", " ");

export default function TodayPage() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [saved, setSaved] = useState<SavedExperience | null>(null);
  const [savedKind, setSavedKind] = useState<ExperienceKind>();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [otherIngredients, setOtherIngredients] = useState("");
  const [memberCount, setMemberCount] = useState(1);
  const [members, setMembers] = useState<QuickDailyMember[]>([emptyMember(0)]);
  const [householdDiet, setHouseholdDiet] = useState<QuickDailyMember["diet"]>("vegetarian");
  const [meals, setMeals] = useState<DailyMeal[]>(["breakfast", "lunch", "dinner"]);
  const [schoolTiffins, setSchoolTiffins] = useState(0);
  const [officeTiffins, setOfficeTiffins] = useState(0);
  const [cookingPreference, setCookingPreference] = useState("use_available");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/daily-meal-plan", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          setAuthenticated(false);
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || "Unable to load your daily plan.");
        setAuthenticated(true);
        setSubscribed(Boolean(data.subscribed));
        setSaved(data.experience ?? null);
        setSavedKind(data.experienceKind);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load your daily plan."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setMembers((current) => Array.from({ length: memberCount }, (_, index) => current[index] ?? emptyMember(index)));
  }, [memberCount]);

  const selectedIngredientCount = useMemo(() => ingredients.length + split(otherIngredients).length, [ingredients, otherIngredients]);
  const updateMember = (index: number, patch: Partial<QuickDailyMember>) => setMembers((current) => current.map((member, itemIndex) => itemIndex === index ? { ...member, ...patch } : member));
  const toggleIngredient = (item: string) => setIngredients((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const toggleMeal = (meal: DailyMeal) => setMeals((current) => current.includes(meal) ? current.filter((value) => value !== meal) : [...current, meal]);

  async function generate() {
    setError("");
    if (!consent || !meals.length || !selectedIngredientCount) {
      setError("Choose at least one ingredient and meal, then confirm the notice.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/daily-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients,
          otherIngredients: split(otherIngredients),
          memberCount,
          members,
          householdDiet,
          meals,
          schoolTiffins,
          officeTiffins,
          cookingPreference,
          preferredLanguage: language,
          aiProcessingConsent: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Your plan could not be generated. Your free experience has not been used.");
      setSaved(data.experience);
      setSavedKind(data.subscribed ? "paid" : "free");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate your plan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-3xl p-6"><p role="status">Loading…</p></main>;

  if (!authenticated) {
    return <main className="mx-auto max-w-3xl p-6"><AppPageNav /><h1 className="mt-8 text-3xl font-black">{t.title}</h1><p className="mt-3">{t.signIn}</p><Link href="/account/access?next=%2Ftoday" className="mt-5 inline-flex rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">Sign in</Link></main>;
  }

  if (saved?.mealPlans?.length) {
    const isPaidPlan = savedKind === "paid";
    return <main className="min-h-screen bg-slate-50 px-4 pb-28 pt-8 sm:pb-8"><div className="mx-auto max-w-4xl"><AppPageNav />
      <h1 className="mt-8 text-3xl font-black text-emerald-900">{isPaidPlan ? "Today’s meal plan" : t.saved}</h1>
      <p className="mt-2 text-slate-600">{isPaidPlan ? "Your saved profile and restrictions were used for this plan." : "This is your one free saved day. Reopening it does not use another free generation."}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{saved.mealPlans.map((plan) => <article key={plan.mealPlanId} className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-700">{plan.commonMeal.mealTime.replace("_", " ")}</p>
        <h2 className="mt-1 text-xl font-black">{plan.commonMeal.name}</h2>
        <p className="mt-2 text-sm">{plan.commonMeal.description}</p>
        {plan.memberCustomizations.length ? <section className="mt-4 rounded-xl bg-emerald-50 p-3"><h3 className="font-bold text-emerald-950">Family-member guidance</h3><ul className="mt-2 space-y-2 text-sm">{plan.memberCustomizations.map((customization) => <li key={`${plan.mealPlanId}-${customization.memberId}`}><strong>{customization.memberName}:</strong> {customization.modification} <span className="text-slate-600">({customization.portionGuidance})</span>{customization.safetyNotes.length ? <span className="block text-xs text-slate-600">{customization.safetyNotes.join(" ")}</span> : null}</li>)}</ul></section> : null}
        <h3 className="mt-4 font-bold">Ingredients</h3>
        <ul className="mt-1 list-disc pl-5 text-sm">{plan.commonMeal.recipe.ingredients.map((ingredient) => <li key={`${plan.mealPlanId}-${ingredient.name}`}>{ingredient.name} — {ingredient.quantity}</li>)}</ul>
        <h3 className="mt-4 font-bold">How to make it</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">{plan.commonMeal.recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      </article>)}</div>
      <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5">
        {subscribed ? <><h2 className="text-xl font-black">Need a different plan?</h2><p className="mt-2 text-slate-700">Choose today&apos;s available ingredients and generate another daily plan. Fair-use limits still apply.</p><button type="button" onClick={() => { setSaved(null); setSavedKind(undefined); }} className="mt-4 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">Generate a fresh daily plan</button></> : <><h2 className="text-xl font-black">Enjoyed planning today?</h2><p className="mt-2 text-slate-700">Complete your full profile to unlock weekly planning and future daily meal planning.</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/profile/family?from=today" className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">{t.profile}</Link><Link href="/subscription" className="rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900">{t.subscription}</Link></div></>}
      </section>
    </div></main>;
  }

  return <main className="min-h-screen bg-slate-50 px-4 pb-28 pt-8 sm:pb-8"><div className="mx-auto max-w-4xl"><AppPageNav />
    <div className="mt-8 rounded-3xl bg-emerald-900 p-6 text-white"><LanguageSelector /><h1 className="mt-5 text-3xl font-black">{t.title}</h1><p className="mt-3 max-w-2xl text-emerald-50">{t.intro}</p></div>
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black">1. {t.ingredients}</h2><p className="mt-1 text-sm text-slate-600">Select only what is actually available. MAMAAI will state any extra grocery items it needs.</p>
      {DAILY_INGREDIENT_CATALOGUE.map((category) => <details key={category.id} className="mt-4 rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer font-bold">{category.label}</summary><div className="mt-3 flex flex-wrap gap-2">{category.items.map((item) => <label key={item} className={`cursor-pointer rounded-full border px-3 py-2 text-sm ${ingredients.includes(item) ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-300"}`}><input className="sr-only" type="checkbox" checked={ingredients.includes(item)} onChange={() => toggleIngredient(item)} />{item}</label>)}</div></details>)}
      <label className="mt-4 block font-semibold">{t.other}<input value={otherIngredients} onChange={(event) => setOtherIngredients(event.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal" placeholder="Example: leftover dal, millet flour (comma separated)" /></label>
    </section>
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black">2. {t.people}</h2>
      <label className="mt-3 block font-semibold">Number of people<input type="number" min="1" max="50" value={memberCount} onChange={(event) => setMemberCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))} className="mt-2 block w-32 rounded-xl border p-3" /></label>
      <label className="mt-3 block font-semibold">Family food preference<select value={householdDiet} onChange={(event) => setHouseholdDiet(event.target.value as QuickDailyMember["diet"])} className="mt-2 block w-full rounded-xl border p-3">{dietOptions.map((diet) => <option key={diet} value={diet}>{dietLabel(diet)}</option>)}</select></label>
      <div className="mt-4 grid gap-4">{members.map((member, index) => <fieldset key={index} className="rounded-xl border border-slate-200 p-4"><legend className="px-1 font-bold">Family member {index + 1}</legend><div className="grid gap-3 md:grid-cols-2">
        <label>Name or label<input value={member.name ?? ""} onChange={(event) => updateMember(index, { name: event.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder={`Member ${index + 1}`} /></label>
        <label>Age (optional for free plan)<input type="number" min="0" max="120" value={member.age ?? ""} onChange={(event) => updateMember(index, { age: event.target.value ? Number(event.target.value) : undefined })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label>Diet<select value={member.diet} onChange={(event) => updateMember(index, { diet: event.target.value as QuickDailyMember["diet"] })} className="mt-1 w-full rounded-lg border p-2">{dietOptions.map((diet) => <option key={diet} value={diet}>{dietLabel(diet)}</option>)}</select></label>
        <label>Likes (comma separated)<input value={member.likes.join(", ")} onChange={(event) => updateMember(index, { likes: split(event.target.value) })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label>Dislikes (comma separated)<input value={member.dislikes.join(", ")} onChange={(event) => updateMember(index, { dislikes: split(event.target.value) })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label>Allergies (comma separated)<input value={member.allergies.join(", ")} onChange={(event) => updateMember(index, { allergies: split(event.target.value) })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label>Health / dietitian restrictions (comma separated)<input value={member.restrictions.join(", ")} onChange={(event) => updateMember(index, { restrictions: split(event.target.value) })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={member.needsTiffin} onChange={(event) => updateMember(index, { needsTiffin: event.target.checked })} />Needs tiffin</label>
        <label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={member.needsSeparateMeal} onChange={(event) => updateMember(index, { needsSeparateMeal: event.target.checked })} />Needs a separate meal or substitute</label>
      </div></fieldset>)}</div>
    </section>
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-black">3. {t.meals}</h2><div className="mt-3 flex flex-wrap gap-3">{mealOptions.map((meal) => <label key={meal} className="rounded-xl border p-3"><input type="checkbox" checked={meals.includes(meal)} onChange={() => toggleMeal(meal)} /> <span className="ml-2">{meal.replace("_", " ")}</span></label>)}</div><div className="mt-4 grid gap-3 md:grid-cols-3"><label>School tiffins<input type="number" min="0" max="20" value={schoolTiffins} onChange={(event) => setSchoolTiffins(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border p-2" /></label><label>Office tiffins<input type="number" min="0" max="20" value={officeTiffins} onChange={(event) => setOfficeTiffins(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border p-2" /></label><label>Cooking preference<select value={cookingPreference} onChange={(event) => setCookingPreference(event.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="use_available">Use available ingredients</option><option value="quick">Quick and simple</option><option value="budget">Budget-conscious</option><option value="home_style">Home-style</option><option value="light">Light meals</option></select></label></div></section>
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm"><label className="flex gap-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{t.consent}</label><p className="mt-3 text-xs text-slate-500">MAMAAI does not diagnose or treat medical conditions. Confirm allergies and professional advice before following a plan.</p><button type="button" disabled={busy} onClick={generate} className="mt-5 min-h-12 w-full rounded-xl bg-emerald-800 px-5 font-bold text-white disabled:opacity-50">{busy ? t.generating : t.generate}</button>{error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}</section>
  </div></main>;
}
