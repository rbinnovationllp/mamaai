'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import type { DietType, FamilyDietPreference, FamilyMealPlan, MealTime, RecipeVideoSearchResponse } from '@/lib/shared/contracts';
import { trackAnalyticsEvent } from '@/lib/shared/client-analytics';

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';
const LAST_PLAN_KEY = 'mamaai_last_successful_plan';

type HouseholdMember = {
  id: string;
  name: string;
  relation: string;
  age?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';
  foodPreference?: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'semi_vegetarian' | 'vegan' | 'other';
  nonVegFrequency?: 'occasionally' | '1_2_days_per_week' | '3_4_days_per_week' | '4_5_days_per_week' | 'most_days' | 'custom';
  nonVegAvoidDays?: string[];
  nonVegCustomRule?: string;
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
    incompleteText: 'Please complete age for every family member before generating a portion-aware meal plan.',
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
    suggestedPlan: 'Suggested plan',
    lastSelected: 'Last selected',
    recipe: 'Recipe',
    watchVideo: 'Watch How to Cook',
    videoLoading: 'Searching suitable cooking videos...',
    videoEmpty: "We couldn't find a suitable cooking video for this dish right now. Please use the written recipe.",
    prep: 'Prep',
    difficulty: 'Difficulty',
    cost: 'Cost',
    minute: 'min',
    meals: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      evening_snack: 'Evening Snack',
      high_tea: 'High Tea',
      snack: 'Snack',
    },
    difficulties: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
  },
  hi: {
    title: 'आज का पारिवारिक भोजन प्लान करें',
    subtitle: 'आपकी सेव की हुई घरेलू प्रोफाइल से अगला व्यावहारिक पारिवारिक भोजन बनाएं और देखें।',
    readyTitle: 'आपकी घरेलू प्रोफाइल तैयार है',
    missingTitle: 'पहले परिवार की प्रोफाइल पूरी करें',
    missingText:
      'कम से कम एक सदस्य, रिश्ता और कोई एलर्जी, डॉक्टर की पाबंदी या नापसंद जोड़ें। फिर भोजन योजना बनाने के लिए यहां लौटें।',
    incompleteText: 'Portion-aware meal plan बनाने से पहले हर family member की उम्र पूरी करें।',
    completeProfile: 'परिवार प्रोफाइल पूरी करें',
    subscription: 'सब्सक्रिप्शन / ट्रायल चुनें',
    meal: 'कौन सा भोजन प्लान करना है',
    generate: 'आज का पारिवारिक भोजन प्लान करें',
    generating: 'पारिवारिक भोजन योजना बन रही है...',
    success: 'आज का पारिवारिक भोजन तैयार है।',
    noSubscription:
      'अगर पेमेंट या ट्रायल पूरा नहीं है, तो पहले सब्सक्रिप्शन चुनें। जज सब्सक्रिप्शन पेज से evaluator access इस्तेमाल कर सकते हैं।',
    commonMeal: 'आज का पारिवारिक भोजन',
    portions: 'सदस्य-विशेष मार्गदर्शन',
    grocery: 'किराने की सूची',
    fruit: 'फल और पानी',
    profile: 'परिवार प्रोफाइल',
    members: 'सदस्य',
    suggestedPlan: 'सुझाया गया प्लान',
    lastSelected: 'पिछली बार चुना गया',
    recipe: 'रेसिपी',
    watchVideo: 'कैसे बनाएं वीडियो देखें',
    videoLoading: 'Suitable cooking video खोज रहे हैं...',
    videoEmpty: 'इस dish के लिए अभी suitable cooking video नहीं मिला। कृपया written recipe इस्तेमाल करें।',
    prep: 'तैयारी',
    difficulty: 'कठिनाई',
    cost: 'लागत',
    minute: 'मिनट',
    meals: {
      breakfast: 'नाश्ता',
      lunch: 'दोपहर का भोजन',
      dinner: 'रात का खाना',
      evening_snack: 'शाम का नाश्ता',
      high_tea: 'हाई टी',
      snack: 'नाश्ता',
    },
    difficulties: {
      easy: 'आसान',
      medium: 'मध्यम',
      hard: 'कठिन',
    },
  },
  kn: {
    title: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    subtitle: 'ನಿಮ್ಮ ಉಳಿಸಿದ ಮನೆಯ ಪ್ರೊಫೈಲ್ ಆಧರಿಸಿ ಮುಂದಿನ ಪ್ರಾಯೋಗಿಕ ಕುಟುಂಬದ ಊಟವನ್ನು ರಚಿಸಿ ನೋಡಿ.',
    readyTitle: 'ನಿಮ್ಮ ಮನೆಯ ಪ್ರೊಫೈಲ್ ಸಿದ್ಧವಾಗಿದೆ',
    missingTitle: 'ಮೊದಲು ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    missingText:
      'ಕನಿಷ್ಠ ಒಬ್ಬ ಸದಸ್ಯ, ಸಂಬಂಧ ಮತ್ತು ಯಾವುದೇ ಅಲರ್ಜಿ, ವೈದ್ಯರ ನಿರ್ಬಂಧ ಅಥವಾ ಇಷ್ಟವಿಲ್ಲದ ಪದಾರ್ಥಗಳನ್ನು ಸೇರಿಸಿ. ನಂತರ ಊಟದ ಯೋಜನೆ ಮಾಡಲು ಇಲ್ಲಿ ಮರಳಿ ಬನ್ನಿ.',
    incompleteText: 'Portion-aware meal plan ಮಾಡಲು ಮೊದಲು ಪ್ರತಿ family member ವಯಸ್ಸು ಪೂರ್ಣಗೊಳಿಸಿ.',
    completeProfile: 'ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    subscription: 'ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ / ಟ್ರಯಲ್ ಆಯ್ಕೆಮಾಡಿ',
    meal: 'ಯಾವ ಊಟವನ್ನು ಯೋಜಿಸಬೇಕು',
    generate: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    generating: 'ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    success: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟ ಸಿದ್ಧವಾಗಿದೆ.',
    noSubscription:
      'ಪಾವತಿ ಅಥವಾ ಟ್ರಯಲ್ ಪೂರ್ಣವಾಗಿರದಿದ್ದರೆ ಮೊದಲು ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಆಯ್ಕೆಮಾಡಿ. ಜಡ್ಜ್‌ಗಳು ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಪೇಜ್‌ನಿಂದ evaluator access ಬಳಸಬಹುದು.',
    commonMeal: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟ',
    portions: 'ಸದಸ್ಯರಿಗನುಗುಣ ಮಾರ್ಗದರ್ಶನ',
    grocery: 'ಕಿರಾಣಿ ಪಟ್ಟಿ',
    fruit: 'ಹಣ್ಣು ಮತ್ತು ನೀರು',
    profile: 'ಕುಟುಂಬ ಪ್ರೊಫೈಲ್',
    members: 'ಸದಸ್ಯರು',
    suggestedPlan: 'ಸೂಚಿಸಿದ ಪ್ಲ್ಯಾನ್',
    lastSelected: 'ಕೊನೆಯದಾಗಿ ಆಯ್ಕೆಮಾಡಿದದು',
    recipe: 'ರೆಸಿಪಿ',
    watchVideo: 'ಹೇಗೆ ಅಡುಗೆ ಮಾಡುವುದು ನೋಡಿ',
    videoLoading: 'ಸೂಕ್ತ cooking video ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    videoEmpty: 'ಈ dish ಗೆ ಈಗ suitable cooking video ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು written recipe ಬಳಸಿ.',
    prep: 'ತಯಾರಿ',
    difficulty: 'ಕಷ್ಟದ ಮಟ್ಟ',
    cost: 'ವೆಚ್ಚ',
    minute: 'ನಿಮಿಷ',
    meals: {
      breakfast: 'ಉಪಹಾರ',
      lunch: 'ಮಧ್ಯಾಹ್ನದ ಊಟ',
      dinner: 'ರಾತ್ರಿ ಊಟ',
      evening_snack: 'ಸಂಜೆ ತಿಂಡಿ',
      high_tea: 'ಹೈ ಟೀ',
      snack: 'ತಿಂಡಿ',
    },
    difficulties: {
      easy: 'ಸುಲಭ',
      medium: 'ಮಧ್ಯಮ',
      hard: 'ಕಷ್ಟ',
    },
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

function nonVegNotes(member: HouseholdMember, selectedMealTime: MealTime) {
  const notes: string[] = [];
  const label = member.name || 'This member';
  if (member.nonVegFrequency) {
    notes.push(`${label} non-vegetarian frequency preference: ${member.nonVegFrequency.replaceAll('_', ' ')}.`);
  }
  if (member.nonVegAvoidDays?.length) {
    notes.push(`${label} avoids non-vegetarian food on ${member.nonVegAvoidDays.join(', ')}.`);
  }
  if (member.nonVegCustomRule) {
    notes.push(`${label} custom non-vegetarian rule: ${member.nonVegCustomRule}.`);
  }
  if (member.foodPreference === 'non_vegetarian' || member.foodPreference === 'semi_vegetarian' || member.foodPreference === 'eggetarian') {
    notes.push(`${label} may eat ${member.foodPreference.replace('_', ' ')}, but do not assume every ${selectedMealTime} should be non-vegetarian. Prefer a vegetarian common base with optional add-on when family preferences differ.`);
  }
  return notes;
}

function mealLabel(value: MealTime, labels: typeof plannerCopy.en.meals) {
  return labels[value] ?? value.replace('_', ' ');
}

function planLabel(value: string) {
  return value
    .replace('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function difficultyLabel(value: FamilyMealPlan['commonMeal']['difficulty'], labels: typeof plannerCopy.en.difficulties) {
  return labels[value] ?? value;
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
  const [videoSearch, setVideoSearch] = useState<RecipeVideoSearchResponse | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
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
  const membersMissingAge = members.filter((member) => typeof member.age !== 'number' || Number.isNaN(member.age));

  const generatePlan = async () => {
    if (!canGenerate || isGenerating) return;
    if (membersMissingAge.length) {
      setError(t.incompleteText);
      return;
    }

    setIsGenerating(true);
    setError('');
    setStatus(t.generating);
    setMealPlan(null);
    setVideoSearch(null);
    setVideoStatus('');

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
              age: member.age as number,
              gender: 'prefer_not_to_say',
              activityLevel: member.activityLevel ?? 'moderate',
              goals: ['Balanced home meal', ...nonVegNotes(member, selectedMealTime)],
              dietType: memberDietTypeFor(member.foodPreference),
              nonVegFrequency: member.nonVegFrequency,
              nonVegAvoidDays: member.nonVegAvoidDays ?? [],
              nonVegCustomRule: member.nonVegCustomRule,
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

  const watchHowToCook = async () => {
    if (!mealPlan) return;
    setVideoStatus(t.videoLoading);
    setVideoSearch(null);
    trackAnalyticsEvent('recipe_video_requested', {
      category: familyDietPreferenceFor(customer, members),
      label: mealPlan.commonMeal.name,
    });
    const response = await fetch('/api/recipes/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dishName: mealPlan.commonMeal.recipe.title || mealPlan.commonMeal.name,
        country: 'India',
        region: 'Karnataka',
        preferredLanguage: language,
        cuisine: ['Indian', 'Home-style'],
        dietaryPreference: familyDietPreferenceFor(customer, members),
        healthyPreparation: true,
        familyRequirements: mealPlan.memberCustomizations.flatMap((customization) => customization.safetyNotes),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setVideoStatus(data.error?.message ?? t.videoEmpty);
      return;
    }
    setVideoSearch(data);
    setVideoStatus(data.results?.length ? data.note : t.videoEmpty);
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
                    {t.suggestedPlan}: {planLabel(suggestedPlan)}
                    {lastPlan ? ` | ${t.lastSelected}: ${planLabel(lastPlan)}` : ''}
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
                    <option value="breakfast">{t.meals.breakfast}</option>
                    <option value="lunch">{t.meals.lunch}</option>
                    <option value="dinner">{t.meals.dinner}</option>
                    <option value="evening_snack">{t.meals.evening_snack}</option>
                    <option value="high_tea">{t.meals.high_tea}</option>
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
                    {mealLabel(mealPlan.commonMeal.mealTime, t.meals)} | {mealPlan.targetDate}
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">{mealPlan.commonMeal.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{mealPlan.commonMeal.description}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <InfoTile label={t.prep} value={`${mealPlan.commonMeal.prepTimeMinutes} ${t.minute}`} />
                    <InfoTile label={t.difficulty} value={difficultyLabel(mealPlan.commonMeal.difficulty, t.difficulties)} />
                    <InfoTile label={t.cost} value={`₹${mealPlan.estimatedCost.mealCost.amount}`} />
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-950">{t.recipe}</h3>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {mealPlan.commonMeal.recipe.steps.map((step, index) => (
                      <li key={`${step}-${index}`}>{index + 1}. {step}</li>
                    ))}
                  </ol>

                  <div className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <button
                      type="button"
                      onClick={watchHowToCook}
                      className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      {t.watchVideo}
                    </button>
                    {videoStatus ? <p className="mt-3 text-sm font-semibold text-emerald-900">{videoStatus}</p> : null}
                    {videoSearch?.results?.length ? (
                      <div className="mt-3 grid gap-2">
                        {videoSearch.results.map((video) => (
                          <a
                            key={video.url}
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-white p-3 text-sm font-semibold text-emerald-950 ring-1 ring-emerald-100"
                          >
                            {video.sponsored ? <span className="mb-1 block text-xs uppercase text-amber-700">Sponsored Recipe Video / Paid Promotion</span> : null}
                            <span>{video.title}</span>
                            <small className="mt-1 block text-slate-600">
                              {video.channelTitle} {video.language ? `| ${video.language}` : ''} | {video.matchQuality ?? video.source}
                            </small>
                            <small className="mt-1 block text-slate-500">{video.thirdPartyDisclaimer}</small>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
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
