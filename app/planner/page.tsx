'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import type { DietType, FamilyDietPreference, FamilyMealPlan, MealTime } from '@/lib/shared/contracts';

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';
const LAST_PLAN_KEY = 'mamaai_last_successful_plan';

type HouseholdMember = {
  id: string;
  name: string;
  relation: string;
  foodPreference?: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'semi_vegetarian' | 'vegan' | 'other';
  allergies?: string[];
  doctorAdvisedRestrictions?: string[];
  dislikes?: string[];
  mealStrategyPreference?: 'common' | 'allow_separate';
};

type CustomerAccount = {
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  householdFoodPreference?: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'semi_vegetarian' | 'vegan' | 'mixed' | 'other';
  cookingHabit?: 'fresh_home_cooked' | 'ready_frozen' | 'fresh_ready_mix' | 'takeaway_prepared' | 'other';
};

const plannerCopy = {
  en: {
    title: "Plan Today's Family Meal",
    subtitle: 'Generate and view the next practical family food plan from your saved household profile.',
    readyTitle: 'Your saved household is ready',
    missingTitle: 'Complete your family profile first',
    missingText:
      'Add at least one family member with relation and any allergies, restrictions or dislikes. Then return here to generate the food plan.',
    completeProfile: 'Complete Family Profile',
    subscription: 'Choose Subscription / Trial',
    meal: 'Meal to plan',
    generate: "Plan Today's Family Meal",
    generating: 'Generating family food plan...',
    success: "Today's family food plan is ready.",
    noSubscription:
      'If payment or trial is not completed yet, choose a subscription first. Judges can use evaluator access from the subscription page.',
    commonMeal: "Today's Family Meal",
    portions: 'Member guidance',
    grocery: 'Grocery list',
    fruit: 'Fruit and hydration',
    profile: 'Family Profile',
    members: 'members',
  },
  hi: {
    title: 'आज का Family Meal Plan करें',
    subtitle: 'Saved household profile से अगला practical family food plan generate और view करें.',
    readyTitle: 'आपका saved household ready है',
    missingTitle: 'पहले family profile complete करें',
    missingText:
      'कम से कम एक family member, relation और allergies/restrictions/dislikes add करें. फिर food plan generate करने के लिए यहां आएं.',
    completeProfile: 'Family Profile Complete करें',
    subscription: 'Subscription / Trial चुनें',
    meal: 'कौन सा meal plan करना है',
    generate: 'आज का Family Meal Plan करें',
    generating: 'Family food plan बन रहा है...',
    success: 'आज का family food plan ready है.',
    noSubscription:
      'अगर payment या trial complete नहीं है, पहले subscription चुनें. Judges subscription page से evaluator access use कर सकते हैं.',
    commonMeal: 'आज का Family Meal',
    portions: 'Member guidance',
    grocery: 'Grocery list',
    fruit: 'Fruit और hydration',
    profile: 'Family Profile',
    members: 'members',
  },
  kn: {
    title: 'ಇಂದಿನ Family Meal Plan ಮಾಡಿ',
    subtitle: 'Saved household profile ನಿಂದ ಮುಂದಿನ practical family food plan generate ಮಾಡಿ ನೋಡಿ.',
    readyTitle: 'ನಿಮ್ಮ saved household ready ಇದೆ',
    missingTitle: 'ಮೊದಲು family profile complete ಮಾಡಿ',
    missingText:
      'ಕನಿಷ್ಠ ಒಬ್ಬ family member, relation ಮತ್ತು allergies/restrictions/dislikes ಸೇರಿಸಿ. ನಂತರ food plan generate ಮಾಡಲು ಇಲ್ಲಿ ಬನ್ನಿ.',
    completeProfile: 'Family Profile Complete ಮಾಡಿ',
    subscription: 'Subscription / Trial ಆಯ್ಕೆಮಾಡಿ',
    meal: 'ಯಾವ meal plan ಮಾಡಬೇಕು',
    generate: 'ಇಂದಿನ Family Meal Plan ಮಾಡಿ',
    generating: 'Family food plan ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    success: 'ಇಂದಿನ family food plan ready ಇದೆ.',
    noSubscription:
      'Payment ಅಥವಾ trial complete ಆಗಿಲ್ಲದಿದ್ದರೆ ಮೊದಲು subscription ಆಯ್ಕೆಮಾಡಿ. Judges subscription page ನಲ್ಲಿ evaluator access ಬಳಸಬಹುದು.',
    commonMeal: 'ಇಂದಿನ Family Meal',
    portions: 'Member guidance',
    grocery: 'Grocery list',
    fruit: 'Fruit ಮತ್ತು hydration',
    profile: 'Family Profile',
    members: 'members',
  },
};

function todayLocalDate() {
  return new Date().toLocaleDateString('en-CA');
}

function planFromMemberCount(count: number): 'starter' | 'premium' | 'family_plus' {
  if (count >= 7) return 'family_plus';
  if (count >= 5) return 'premium';
  return 'starter';
}

function familyDietPreferenceFor(customer: CustomerAccount, members: HouseholdMember[]): FamilyDietPreference {
  const saved = customer.householdFoodPreference;
  if (saved === 'vegetarian' || saved === 'non_vegetarian' || saved === 'semi_vegetarian' || saved === 'eggetarian' || saved === 'vegan') {
    return saved;
  }
  const memberPrefs = new Set(members.map((member) => member.foodPreference).filter(Boolean));
  if (memberPrefs.has('vegan') && memberPrefs.size === 1) return 'vegan';
  if (memberPrefs.has('non_vegetarian')) return memberPrefs.size > 1 ? 'mixed' : 'non_vegetarian';
  if (memberPrefs.has('eggetarian')) return memberPrefs.size > 1 ? 'mixed' : 'eggetarian';
  if (memberPrefs.has('semi_vegetarian')) return 'semi_vegetarian';
  if (memberPrefs.has('vegetarian')) return 'vegetarian';
  return 'mixed';
}

function memberDietTypeFor(preference?: HouseholdMember['foodPreference']): DietType {
  if (preference === 'eggetarian') return 'eggitarian';
  if (preference === 'vegetarian' || preference === 'non_vegetarian' || preference === 'vegan') return preference;
  return 'other';
}

function cookingHabitNotes(value?: CustomerAccount['cookingHabit']) {
  switch (value) {
    case 'ready_frozen':
      return ['Household usually relies on ready-made or frozen cooked meal bases. Prefer practical heat-and-customize options with fresh vegetables or protein additions.'];
    case 'fresh_ready_mix':
      return ['Household uses a mix of fresh cooking and ready-made or frozen foods. Suggest practical combinations of home-cooked dishes and suitable ready bases.'];
    case 'takeaway_prepared':
      return ['Household often buys prepared meals or takeaway. Recommend realistic, low-effort ways to balance prepared foods with fresh sides.'];
    case 'other':
      return ['Household cooking habit is custom or not fully specified. Ask gently when more precision is needed.'];
    default:
      return ['Household mostly cooks fresh meals at home. Prioritize fresh home-cooked family meals.'];
  }
}

function mealLabel(value: MealTime) {
  return value
    .replace('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PlannerPage() {
  const { language } = useLanguage();
  const t = plannerCopy[language] ?? plannerCopy.en;
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [customer, setCustomer] = useState<CustomerAccount>({});
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('dinner');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [mealPlan, setMealPlan] = useState<FamilyMealPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPlan, setLastPlan] = useState('');

  useEffect(() => {
    try {
      const savedMembers = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) {
          setMembers(parsed.filter((member) => member?.name));
        }
      }

      const savedCustomer = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (savedCustomer) setCustomer(JSON.parse(savedCustomer));

      setLastPlan(window.localStorage.getItem(LAST_PLAN_KEY) ?? '');
    } catch {
      setMembers([]);
    }
  }, []);

  const suggestedPlan = useMemo(() => planFromMemberCount(members.length), [members.length]);
  const canGenerate = members.length > 0;

  const generatePlan = async () => {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    setError('');
    setStatus(t.generating);
    setMealPlan(null);

    try {
      const userId = customer.userId || `customer_${Date.now()}`;
      const familyResponse = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          family: {
            name: `${customer.name || members[0]?.name || 'MAMAAI'} Household`,
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            dietPreference: familyDietPreferenceFor(customer, members),
            cuisinePreferences: ['Indian', 'Home-style', customer.cookingHabit ?? 'fresh_home_cooked'],
            localIngredientAvailabilityNotes: cookingHabitNotes(customer.cookingHabit),
            budget: {
              type: 'none',
              currency: 'INR',
              priority: 'flexible',
              preferLowCostMeals: false,
            },
            kitchenProfile: {
              equipment: ['Gas stove', 'Pressure cooker', 'Mixer/grinder'],
              cookingTimePreference: 'under_30',
            },
            subscriptionPlan: suggestedPlan,
          },
          members: members.map((member) => {
            const allergies = member.allergies ?? [];
            const dislikes = member.dislikes ?? [];
            const restrictions = member.doctorAdvisedRestrictions ?? [];
            return {
              name: member.name,
              relationship: member.relation || 'Family member',
              age: 30,
              gender: 'prefer_not_to_say',
              activityLevel: 'moderate',
              goals: ['Balanced home meal'],
              dietType: memberDietTypeFor(member.foodPreference),
              likes: [],
              dislikes,
              allergies,
              foodAllergies: allergies,
              ingredientAllergies: allergies,
              foodDislikes: dislikes,
              dislikedMeals: dislikes,
              excludedIngredients: [],
              dietaryRestrictions: restrictions,
              healthConditions: [],
              doctorRestrictions: restrictions,
              specialStatuses: [],
              fastingPreference: {
                observesFasting: 'no',
                regularDays: [],
                allowedFoods: [],
                avoidedFoods: [],
                fruitsAllowed: true,
                dairyAllowed: true,
                grainsRestricted: false,
                customRules: [],
              },
            };
          }),
        }),
      });
      const familyData = await familyResponse.json();
      if (!familyResponse.ok) {
        throw new Error(familyData.error?.message || 'Unable to prepare family profile for planning.');
      }

      const createdMembers = familyData.members ?? [];
      const mealResponse = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: familyData.family.familyId,
          planType: 'daily',
          mealTime: selectedMealTime,
          mealTimeContext: {
            timeZone: 'Asia/Kolkata',
            locale: language,
            country: familyData.family.country,
            region: familyData.family.state,
            city: familyData.family.city,
            localHour: new Date().getHours(),
          },
          mealAttendance: [
            {
              mealTime: selectedMealTime,
              participatingMemberIds: createdMembers.map((member: { memberId: string }) => member.memberId),
              absentMemberIds: [],
              fastingMemberIds: [],
              guestCount: 0,
              enabled: true,
            },
          ],
          userPlanningMode: 'new_user_next_meal',
          targetDate: todayLocalDate(),
        }),
      });
      const mealData = await mealResponse.json();
      if (!mealResponse.ok) {
        throw new Error(mealData.error?.message || 'Unable to generate family food plan.');
      }

      setMealPlan(mealData.mealPlan);
      setStatus(t.success);
    } catch (err) {
      setStatus('');
      setError(err instanceof Error ? err.message : 'Unable to generate family food plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <AppPageNav showPlanner={false} />

        <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">MAMAAI Planner</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{t.subtitle}</p>
          </div>
          <LanguageSelector />
        </div>

        {!canGenerate ? (
          <section className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">{t.missingTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.missingText}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/profile/family" className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white">
                {t.completeProfile}
              </Link>
              <Link href="/subscription" className="rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-bold text-emerald-800">
                {t.subscription}
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-6 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">{t.readyTitle}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {members.length} {t.members}: {members.map((member) => member.name).join(', ')}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-800">
                    Suggested plan: {suggestedPlan.replace('_', ' ')}
                    {lastPlan ? ` | Last selected: ${lastPlan.replace('_', ' ')}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/profile/family" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                    {t.profile}
                  </Link>
                  <Link href="/subscription" className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-800">
                    {t.subscription}
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">{t.meal}</span>
                  <select
                    value={selectedMealTime}
                    onChange={(event) => setSelectedMealTime(event.target.value as MealTime)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="evening_snack">Evening Snack</option>
                    <option value="high_tea">High Tea</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={generatePlan}
                  disabled={isGenerating}
                  className="rounded-2xl bg-emerald-700 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {isGenerating ? t.generating : t.generate}
                </button>
              </div>

              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {t.noSubscription}
              </p>
            </section>

            {status ? (
              <p className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{status}</p>
            ) : null}
            {error ? (
              <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
            ) : null}

            {mealPlan ? (
              <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    {mealLabel(mealPlan.commonMeal.mealTime)} | {mealPlan.targetDate}
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">{mealPlan.commonMeal.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{mealPlan.commonMeal.description}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <InfoTile label="Prep" value={`${mealPlan.commonMeal.prepTimeMinutes} min`} />
                    <InfoTile label="Difficulty" value={mealPlan.commonMeal.difficulty} />
                    <InfoTile label="Cost" value={`Rs. ${mealPlan.estimatedCost.mealCost.amount}`} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-950">Recipe</h3>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {mealPlan.commonMeal.recipe.steps.map((step, index) => (
                      <li key={`${step}-${index}`}>{index + 1}. {step}</li>
                    ))}
                  </ol>
                </article>

                <div className="grid gap-6">
                  <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-slate-950">{t.portions}</h3>
                    <div className="mt-4 grid gap-3">
                      {mealPlan.memberCustomizations.map((item) => (
                        <div key={item.memberId} className="rounded-2xl bg-slate-50 p-4">
                          <p className="font-bold text-slate-950">{item.memberName}</p>
                          <p className="mt-1 text-sm text-slate-700">{item.portionGuidance}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.modification}</p>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-slate-950">{t.grocery}</h3>
                    <div className="mt-4 grid gap-3">
                      {mealPlan.groceryItems.slice(0, 8).map((item) => (
                        <div key={item.itemId} className="flex items-start justify-between gap-3 rounded-2xl bg-emerald-50 p-3 text-sm">
                          <span className="font-bold text-emerald-950">{item.name}</span>
                          <span className="text-right text-emerald-800">{item.quantityToPurchase}</span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-bold text-slate-950">{t.fruit}</h3>
                    <div className="mt-4 grid gap-3 text-sm text-slate-700">
                      {mealPlan.fruits.slice(0, 4).map((item) => (
                        <p key={item.memberId}><strong>{item.memberName}:</strong> {item.fruit}, {item.portion}</p>
                      ))}
                      {mealPlan.hydration.slice(0, 3).map((item) => (
                        <p key={`h-${item.memberId}`}><strong>{item.memberName}:</strong> {item.guidance}</p>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black capitalize text-slate-950">{value}</p>
    </div>
  );
}
