'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { MealCard, AlternativeOption } from '@/components/planner/MealCard';
import { UpcomingMealReminder } from '@/components/planner/UpcomingMealReminder';
import type {
  DayFoodPreference,
  DayAttendancePlan,
  DayWiseFoodRoutinePreference,
  DietType,
  FamilyDietPreference,
  FamilyMealPlan,
  WeeklyFamilyMealPlan,
  MealSlot,
  MealTimingPattern,
  MealTime,
  RecentMealHistoryDay,
  WeeklyFoodRoutineStatus,
  MealTimetableSchedule,
  MemberMealAttendanceStatus,
} from '@/lib/shared/contracts';
import { trackAnalyticsEvent } from '@/lib/shared/client-analytics';

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';
const CULTURE_STORAGE_KEY = 'mamaai_culture_profile_v1';
const LAST_PLAN_KEY = 'mamaai_last_successful_plan';
const CURRENT_MEAL_PLAN_KEY = 'mamaai_current_meal_plan';
const PANTRY_STORAGE_KEY = 'mamaai_pantry_items_v1';
const FAMILY_LEARNING_KEY = 'mamaai_family_learning_signals_v1';
const TODAY_ATTENDANCE_KEY = 'mamaai_today_meal_attendance_v1';
const YESTERDAY_ATTENDANCE_KEY = 'mamaai_yesterday_meal_attendance_v1';
const REGULAR_WEEKDAY_ATTENDANCE_KEY = 'mamaai_regular_weekday_attendance_v1';
const WEEKLY_MASTER_PLAN_KEY = 'mamaai_weekly_master_plan_v1';
const NEXT_WEEK_MASTER_PLAN_KEY = 'mamaai_next_week_master_plan_v1';

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
  familyId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  householdFoodPreference?: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'semi_vegetarian' | 'vegan' | 'mixed' | 'other';
  cookingHabit?: 'fresh_home_cooked' | 'ready_frozen' | 'fresh_ready_mix' | 'takeaway_prepared' | 'other';
  budgetPreference?: 'economical' | 'moderate' | 'flexible' | 'no_specific_limit' | 'custom_monthly';
  customMonthlyFoodBudget?: number;
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: Partial<Record<MealSlot, string[]>>;
  recentMealHistory?: RecentMealHistoryDay[];
  mealTimings?: MealTimingPattern;
  mealSchedule?: MealTimetableSchedule;
  regularAttendancePattern?: DayAttendancePlan;
  nonVegPreferredFoods?: string[];
};

type CultureProfile = {
  country?: string;
  region?: string;
  city?: string;
  cookingStyle?: string;
  preferredCuisines?: string[];
};

type PantryItem = {
  id?: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
};

type PlannerMode = 'next_meal' | 'specific_meal';
type MemberMealAvailability = 'home' | 'tiffin' | 'away';
type MealAttendanceDraft = Record<
  MealTime,
  {
    participatingMemberIds: string[];
    tiffinMemberIds: string[];
  }
>;

type WeekPlanState = 'IDLE' | 'GENERATING' | 'READY' | 'FAILED';

async function safeParseJsonResponse<T = any>(
  response: Response,
  fallbackMessage = 'API request failed.'
): Promise<{ success: boolean; data?: T; errorText?: string }> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawHtml = await response.text().catch(() => '');
    console.error(`[MAMAAI Error] Non-JSON response (${response.status}):`, rawHtml.slice(0, 300));
    return {
      success: false,
      errorText: `HTTP_${response.status}_NON_JSON_RESPONSE`,
    };
  }

  try {
    const json = await response.json();
    if (!response.ok) {
      const msg = json?.error?.message || json?.error || fallbackMessage;
      return { success: false, data: json, errorText: msg };
    }
    return { success: true, data: json };
  } catch (err) {
    console.error('[MAMAAI JSON Parse Error]:', err);
    return { success: false, errorText: 'MALFORMED_JSON_PAYLOAD' };
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function mealGenerationFailureMessage(language: 'en' | 'hi' | 'kn') {
  if (language === 'hi') return 'अभी भोजन योजना तैयार नहीं हो सकी। कृपया कुछ क्षण बाद फिर प्रयास करें।';
  if (language === 'kn') return 'ಈಗ ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆಯನ್ನು ತಯಾರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.';
  return "We couldn't prepare your meal plan right now. Please try again in a moment.";
}

const dailyScheduleMealTimes: MealTime[] = ['breakfast', 'lunch', 'high_tea', 'dinner'];

const plannerCopy = {
  en: {
    title: "Plan Today's Family Meal",
    subtitle: 'Generate and view the next practical family food plan from your saved household profile.',
    readyTitle: 'Your saved household is ready',
    missingTitle: 'Complete your family profile first',
    loadingProfile: 'Checking your saved family profile...',
    missingText: 'Add at least one family member with relation and any allergies, restrictions or dislikes. Then return here to generate the food plan.',
    incompleteText: 'Please complete age for every family member before generating a portion-aware meal plan.',
    completeProfile: 'Complete Family Profile',
    subscription: 'Choose Subscription / Trial',
    generate: "Plan Today's Family Meal",
    planMealNow: 'Plan {meal}',
    nextMealTitle: "It's time to plan your next meal",
    nextMealDetected: 'Next meal detected',
    basedOnTiming: 'Based on your saved meal timings and local time.',
    chooseAnotherMeal: 'Want to plan something else?',
    generating: 'Generating family food plan...',
    success: "Today's family food plan is ready.",
    weeklyGenerating: "Preparing this week's stable Monday-Sunday meal plan...",
    weeklyReady: "Weekly master plan is ready. Showing the selected meal from this week's plan.",
    weeklyFallbackReady: "Today's meal is ready. The full weekly plan can be prepared again later.",
    openNextWeek: 'Review Next Week',
    viewToday: 'Today',
    viewWeek: 'This Week',
    weeklyPlanTitle: "This Week's Master Meal Plan",
    weeklyGroceryTitle: "This Week's Grocery Requirement",
    procurementTitle: 'Purchase Calendar',
    tomorrowReminderTitle: 'Ingredients Needed for Tomorrow',
    sabsewaProcurementTitle: 'Buy Local with SabSewa Local',
    procurementSafety: 'Freshness depends on storage, climate and ripeness. Buy perishable items closer to cooking day.',
    staleWarning: '⚠️ Showing previously saved meal plan. Tap the button above to generate a fresh recommendation for today.',
    staleBadge: 'Previous Plan',
    selectOneMember: 'Select at least one family member for this meal.',
    todayScheduleTitle: 'Who will be eating each meal today?',
    todayScheduleHelp: 'Choose Home, Tiffin or Not eating for each member. This controls portions, dietary checks, pantry use and grocery quantities.',
    everyone: 'Everyone',
    noOne: 'No One',
    sameAsYesterday: 'Same as Yesterday',
    useWeekdayPattern: 'Apply Regular Attendance Pattern',
    saveWeekdayPattern: 'Save Regular Attendance Pattern',
    viewThisWeekPlan: "View This Week's Meal Plan",
    viewNextWeekPlan: "View Next Week's Meal Plan",
    homeMeal: 'Home',
    tiffinMeal: 'Tiffin',
    awayMeal: 'Not eating',
    scheduleSaved: 'Your regular meal-attendance pattern has been saved on this device.',
    pantryUsed: 'Pantry considered',
    alreadyInPantry: 'Already in pantry',
    sabsewaTitle: 'Support Your Local Vendor',
    sabsewaText: 'For Indian households, use this grocery list with your nearby shop. Future SabSewa Local handoff will connect ingredients to participating local vendors.',
    sabsewaCta: 'Find on SabSewa Local',
    feedbackTitle: 'Help MAMAAI learn',
    cooked: 'Cooked this',
    liked: 'Liked it',
    rejected: 'Do not suggest again',
    anotherOptionSuccess: 'Another suitable meal is ready.',
    feedbackSaved: 'Thanks. This signal was saved for future personalization.',
    recipe: 'Recipe',
    portions: 'Member guidance',
    grocery: 'Grocery list',
    fruit: 'Fruit and hydration',
    profile: 'Family Profile',
    members: 'members',
    suggestedPlan: 'Suggested plan',
    lastSelected: 'Last selected',
    guests: 'Visiting Guests',
    guestHelp: 'Extra portions added to recipe & grocery',
    nextWeekCardReadyTitle: "Next Week's Meal Plan Ready",
    nextWeekCardReadyDesc: 'Monday–Sunday menu and consolidated grocery list loaded.',
    nextWeekCardViewBtn: 'View Full Week (Monday – Sunday)',
    nextWeekCardGenTitle: "Preparing Next Week's Plan...",
    nextWeekCardGenDesc: 'Balancing pulse diversity, nutrition, and pantry deficits...',
    nextWeekCardGenBtn: 'Generating Weekly Plan...',
    nextWeekCardFailTitle: 'Weekly Plan Generation Failed',
    nextWeekCardFailDesc: 'Could not establish connection to planner service.',
    nextWeekCardIdleTitle: 'Plan Next Week (Aug 31 – Sep 06)',
    nextWeekCardIdleDesc: 'Create Monday–Sunday menu and smart procurement preview.',
    nextWeekCardIdleBtn: 'Generate Weekly Plan',
    tryAgain: 'Try Again',
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
    loadingProfile: 'आपकी सेव की हुई family profile check हो रही है...',
    missingText: 'कम से कम एक सदस्य, रिश्ता और कोई एलर्जी, डॉक्टर की पाबंदी या नापसंद जोड़ें। फिर भोजन योजना बनाने के लिए यहां लौटें।',
    incompleteText: 'हिस्से के अनुसार भोजन योजना बनाने से पहले हर परिवार सदस्य की उम्र भरें।',
    completeProfile: 'परिवार प्रोफाइल पूरी करें',
    subscription: 'सब्सक्रिप्शन / ट्रायल चुनें',
    generate: 'आज का पारिवारिक भोजन प्लान करें',
    planMealNow: '{meal} प्लान करें',
    nextMealTitle: 'अब अगला भोजन प्लान करें',
    nextMealDetected: 'अगला भोजन पहचाना गया',
    basedOnTiming: 'आपके सेव किए हुए meal timings और local time के आधार पर।',
    chooseAnotherMeal: 'कुछ और प्लान करना चाहते हैं?',
    generating: 'पारिवारिक भोजन योजना बन रही है...',
    success: 'आज का पारिवारिक भोजन तैयार है।',
    weeklyGenerating: 'इस सप्ताह का स्थिर सोमवार-रविवार भोजन प्लान तैयार हो रहा है...',
    weeklyReady: 'साप्ताहिक master plan तैयार है। इसी सप्ताह के प्लान से चुना हुआ meal दिखाया जा रहा है।',
    weeklyFallbackReady: 'आज का भोजन तैयार है। पूरा साप्ताहिक प्लान बाद में फिर बनाया जा सकता है।',
    openNextWeek: 'अगला सप्ताह देखें',
    viewToday: 'आज',
    viewWeek: 'यह सप्ताह',
    weeklyPlanTitle: 'इस सप्ताह का मास्टर भोजन प्लान',
    weeklyGroceryTitle: 'इस सप्ताह की किराने की जरूरत',
    procurementTitle: 'खरीदारी कैलेंडर',
    tomorrowReminderTitle: 'कल के लिए जरूरी सामग्री',
    sabsewaProcurementTitle: 'SabSewa Local से स्थानीय खरीदारी',
    procurementSafety: 'ताजगी storage, मौसम और ripeness पर निर्भर करती है। जल्दी खराब होने वाली चीजें cooking day के पास खरीदें।',
    staleWarning: '⚠️ यह पिछला सेव किया हुआ प्लान है। आज का नया भोजन बनाने के लिए ऊपर बटन दबाएं।',
    staleBadge: 'पिछला प्लान',
    selectOneMember: 'इस भोजन के लिए कम से कम एक परिवार सदस्य चुनें।',
    todayScheduleTitle: 'आज हर भोजन कौन खाएगा?',
    todayScheduleHelp: 'हर सदस्य के लिए Home, Tiffin या Not eating चुनें। इसी से portions, dietary checks, pantry और grocery quantity तय होगी।',
    everyone: 'सभी',
    noOne: 'कोई नहीं',
    sameAsYesterday: 'कल जैसा',
    useWeekdayPattern: 'नियमित उपस्थिति पैटर्न लगाएँ',
    saveWeekdayPattern: 'नियमित उपस्थिति पैटर्न सेव करें',
    viewThisWeekPlan: 'इस सप्ताह का भोजन प्लान देखें',
    viewNextWeekPlan: 'अगले सप्ताह का भोजन प्लान देखें',
    homeMeal: 'घर पर',
    tiffinMeal: 'टिफिन',
    awayMeal: 'नहीं खाएंगे',
    scheduleSaved: 'आपका नियमित भोजन-उपस्थिति पैटर्न इस डिवाइस पर सेव हो गया है।',
    pantryUsed: 'पैंट्री को ध्यान में रखा गया',
    alreadyInPantry: 'पैंट्री में पहले से है',
    sabsewaTitle: 'अपने local vendor को support करें',
    sabsewaText: 'भारतीय परिवार इस किराने की सूची को अपने नजदीकी दुकानदार के साथ इस्तेमाल कर सकते हैं। आगे SabSewa Local सामग्री को भाग लेने वाले स्थानीय विक्रेताओं से जोड़ सकेगा।',
    sabsewaCta: 'SabSewa Local पर देखें',
    feedbackTitle: 'MAMAAI को सीखने में मदद करें',
    cooked: 'यह बनाया',
    liked: 'पसंद आया',
    rejected: 'फिर न सुझाएं',
    anotherOptionSuccess: 'दूसरा उपयुक्त भोजन तैयार है।',
    feedbackSaved: 'धन्यवाद। यह संकेत आगे की व्यक्तिगत योजना के लिए सेव हो गया।',
    recipe: 'रेसिपी',
    portions: 'सदस्य-विशेष मार्गदर्शन',
    grocery: 'किराने की सूची',
    fruit: 'फल और पानी',
    profile: 'परिवार प्रोफाइल',
    members: 'सदस्य',
    suggestedPlan: 'सुझाया गया प्लान',
    lastSelected: 'पिछली बार चुना गया',
    guests: 'अतिरिक्त मेहमान (Guests)',
    guestHelp: 'मेहमानों के अनुसार सामग्री और मात्रा स्वतः बढ़ेगी',
    nextWeekCardReadyTitle: 'अगले सप्ताह का भोजन प्लान तैयार है',
    nextWeekCardReadyDesc: 'सोमवार-रविवार का संपूर्ण मेनू और खरीदारी सूची लोड हो चुकी है।',
    nextWeekCardViewBtn: 'पूरा सप्ताह देखें (Monday – Sunday)',
    nextWeekCardGenTitle: 'अगले सप्ताह की योजना बनाई जा रही है...',
    nextWeekCardGenDesc: 'पोषण, दालों की विविधता और खरीदारी सूची की गणना हो रही है...',
    nextWeekCardGenBtn: 'साप्ताहिक भोजन योजना बन रही है...',
    nextWeekCardFailTitle: 'योजना तैयार नहीं हो सकी',
    nextWeekCardFailDesc: 'सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।',
    nextWeekCardIdleTitle: 'अगले सप्ताह की भोजन योजना तैयार करें',
    nextWeekCardIdleDesc: 'सोमवार-रविवार भोजन प्लान और खरीदारी प्रिव्यू बनाएं।',
    nextWeekCardIdleBtn: 'साप्ताहिक प्लान तैयार करें',
    tryAgain: 'फिर से प्रयास करें',
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
    loadingProfile: 'ನಿಮ್ಮ ಉಳಿಸಿದ family profile ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    missingText: 'ಕನಿಷ್ಠ ಒಬ್ಬ ಸದಸ್ಯ, ಸಂಬಂಧ ಮತ್ತು ಯಾವುದೇ ಅಲರ್ಜಿ, ವೈದ್ಯರ ನಿರ್ಬಂಧ ಅಥವಾ ಇಷ್ಟವಿಲ್ಲದ ಪದಾರ್ಥಗಳನ್ನು ಸೇರಿಸಿ. ನಂತರ ಊಟದ ಯೋಜನೆ ಮಾಡಲು ಇಲ್ಲಿ ಮರಳಿ ಬನ್ನಿ.',
    incompleteText: 'ಭಾಗಕ್ಕೆ ಅನುಗುಣವಾದ ಊಟದ ಯೋಜನೆ ಮಾಡಲು ಮೊದಲು ಪ್ರತಿ ಕುಟುಂಬ ಸದಸ್ಯರ ವಯಸ್ಸು ಭರ್ತಿ ಮಾಡಿ.',
    completeProfile: 'ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    subscription: 'ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ / ಟ್ರಯಲ್ ಆಯ್ಕೆಮಾಡಿ',
    generate: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    planMealNow: '{meal} ಯೋಜಿಸಿ',
    nextMealTitle: 'ಈಗ ನಿಮ್ಮ ಮುಂದಿನ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    nextMealDetected: 'ಮುಂದಿನ ಊಟ ಗುರುತಿಸಲಾಗಿದೆ',
    basedOnTiming: 'ನಿಮ್ಮ ಉಳಿಸಿದ meal timings ಮತ್ತು local time ಆಧರಿಸಿ.',
    chooseAnotherMeal: 'ಬೇರೆ ಊಟವನ್ನು ಯೋಜಿಸಬೇಕೇ?',
    generating: 'ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    success: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟ ಸಿದ್ಧವಾಗಿದೆ.',
    weeklyGenerating: 'ಈ ವಾರದ ಸ್ಥಿರ ಸೋಮವಾರ-ಭಾನುವಾರ ಊಟದ ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    weeklyReady: 'ವಾರದ master plan ಸಿದ್ಧವಾಗಿದೆ. ಈ ವಾರದ ಯೋಜನೆಯಿಂದ ಆಯ್ದ meal ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
    weeklyFallbackReady: 'ಇಂದಿನ ಊಟ ಸಿದ್ಧವಾಗಿದೆ. ಪೂರ್ಣ ವಾರದ ಯೋಜನೆಯನ್ನು ನಂತರ ಮತ್ತೆ ಸಿದ್ಧಪಡಿಸಬಹುದು.',
    openNextWeek: 'ಮುಂದಿನ ವಾರ ನೋಡಿ',
    viewToday: 'ಇಂದು',
    viewWeek: 'ಈ ವಾರ',
    weeklyPlanTitle: 'ಈ ವಾರದ ಮಾಸ್ಟರ್ ಊಟದ ಯೋಜನೆ',
    weeklyGroceryTitle: 'ಈ ವಾರದ grocery ಅವಶ್ಯಕತೆ',
    procurementTitle: 'ಖರೀದಿ ಕ್ಯಾಲೆಂಡರ್',
    tomorrowReminderTitle: 'ನಾಳೆಗೆ ಬೇಕಾದ ಪದಾರ್ಥಗಳು',
    sabsewaProcurementTitle: 'SabSewa Local ಮೂಲಕ ಸ್ಥಳೀಯವಾಗಿ ಖರೀದಿ',
    procurementSafety: 'ತಾಜಾತನವು storage, ಹವಾಮಾನ ಮತ್ತು ripeness ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ. ಬೇಗ ಹಾಳಾಗುವ ಪದಾರ್ಥಗಳನ್ನು cooking day ಹತ್ತಿರ ಖರೀದಿಸಿ.',
    staleWarning: '⚠️ ಇದು ಹಿಂದಿನ ಊಟದ ಪ್ಲಾನ್ ಆಗಿದೆ. ಇಂದಿನ ಹೊಸ ಊಟವನ್ನು ಯೋಜಿಸಲು ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿರಿ.',
    staleBadge: 'ಹಿಂದಿನ ಪ್ಲಾನ್',
    selectOneMember: 'ಈ ಊಟಕ್ಕೆ ಕನಿಷ್ಠ ಒಬ್ಬ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    todayScheduleTitle: 'ಇಂದು ಪ್ರತಿ ಊಟವನ್ನು ಯಾರು ತಿನ್ನುತ್ತಾರೆ?',
    todayScheduleHelp: 'ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ Home, Tiffin ಅಥವಾ Not eating ಆಯ್ಕೆಮಾಡಿ. ಇದರಿಂದ portions, dietary checks, pantry ಮತ್ತು grocery quantity ನಿರ್ಧಾರವಾಗುತ್ತದೆ.',
    everyone: 'ಎಲ್ಲರೂ',
    noOne: 'ಯಾರೂ ಇಲ್ಲ',
    sameAsYesterday: 'ನಿನ್ನೆ ಇದ್ದಂತೆ',
    useWeekdayPattern: 'ನಿಯಮಿತ ಹಾಜರಾತಿ ಮಾದರಿ ಬಳಸಿ',
    saveWeekdayPattern: 'ನಿಯಮಿತ ಹಾಜರಾತಿ ಮಾದರಿ ಉಳಿಸಿ',
    viewThisWeekPlan: 'ಈ ವಾರದ ಊಟದ ಯೋಜನೆ ನೋಡಿ',
    viewNextWeekPlan: 'ಮುಂದಿನ ವಾರದ ಊಟದ ಯೋಜನೆ ನೋಡಿ',
    homeMeal: 'ಮನೆಯಲ್ಲಿ',
    tiffinMeal: 'ಟಿಫಿನ್',
    awayMeal: 'ತಿನ್ನುವುದಿಲ್ಲ',
    scheduleSaved: 'ನಿಮ್ಮ ನಿಯಮಿತ ಊಟ-ಹಾಜರಾತಿ ಮಾದರಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
    pantryUsed: 'ಪ್ಯಾಂಟ್ರಿಯನ್ನು ಪರಿಗಣಿಸಲಾಗಿದೆ',
    alreadyInPantry: 'ಈಗಾಗಲೇ ಪ್ಯಾಂಟ್ರಿಯಲ್ಲಿದೆ',
    sabsewaTitle: 'ನಿಮ್ಮ local vendor ಅನ್ನು support ಮಾಡಿ',
    sabsewaText: 'ಭಾರತೀಯ ಕುಟುಂಬಗಳು ಈ ಕಿರಾಣಿ ಪಟ್ಟಿಯನ್ನು ಹತ್ತಿರದ ಅಂಗಡಿಯವರೊಂದಿಗೆ ಬಳಸಬಹುದು. ಮುಂದೆ SabSewa Local ಪದಾರ್ಥಗಳನ್ನು ಭಾಗವಹಿಸುವ ಸ್ಥಳೀಯ ಮಾರಾಟಗಾರರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಬಹುದು.',
    sabsewaCta: 'SabSewa Local ನಲ್ಲಿ ನೋಡಿ',
    feedbackTitle: 'MAMAAI ಕಲಿಯಲು ಸಹಾಯ ಮಾಡಿ',
    cooked: 'ಇದನ್ನು ಅಡುಗೆ ಮಾಡಿದೆವು',
    liked: 'ಇಷ್ಟವಾಯಿತು',
    rejected: 'ಮತ್ತೆ ಸೂಚಿಸಬೇಡಿ',
    anotherOptionSuccess: 'ಇನ್ನೊಂದು ಸೂಕ್ತ ಊಟ ಸಿದ್ಧವಾಗಿದೆ.',
    feedbackSaved: 'ಧನ್ಯವಾದಗಳು. ಈ ಸೂಚನೆ ಮುಂದಿನ ವೈಯಕ್ತಿಕ ಯೋಜನೆಗಾಗಿ ಉಳಿಸಲಾಗಿದೆ.',
    recipe: 'ರೆಸಿಪಿ',
    portions: 'ಸದಸ್ಯರಿಗನುಗುಣ ಮಾರ್ಗದರ್ಶನ',
    grocery: 'ಕಿರಾಣಿ ಪಟ್ಟಿ',
    fruit: 'ಹಣ್ಣು ಮತ್ತು ನೀರು',
    profile: 'ಕುಟುಂಬ ಪ್ರೊಫೈಲ್',
    members: 'ಸದಸ್ಯರು',
    suggestedPlan: 'ಸೂಚಿಸಿದ ಪ್ಲ್ಯಾನ್',
    lastSelected: 'ಕೊನೆಯದಾಗಿ ಆಯ್ಕೆಮಾಡಿದದು',
    guests: 'ಹೆಚ್ಚುವರಿ ಅತಿಥಿಗಳು (Guests)',
    guestHelp: 'ಅತಿಥಿಗಳ ಸಂಖ್ಯೆಗೆ ತಕ್ಕಂತೆ ಅಡುಗೆ ಪ್ರಮಾಣ ಹೆಚ್ಚಾಗುತ್ತದೆ',
    nextWeekCardReadyTitle: 'ಮುಂದಿನ ವಾರದ ಊಟದ ಯೋಜನೆ ಸಿದ್ಧವಾಗಿದೆ',
    nextWeekCardReadyDesc: 'ಸೋಮವಾರ-ಭಾನುವಾರದ ಮೆನು ಮತ್ತು ಖರೀದಿ ಪಟ್ಟಿ ಸಿದ್ಧವಾಗಿದೆ.',
    nextWeekCardViewBtn: 'ಪೂರ್ಣ ವಾರ ವೀಕ್ಷಿಸಿ (Monday – Sunday)',
    nextWeekCardGenTitle: 'ಮುಂದಿನ ವಾರದ ಯೋಜನೆ ತಯಾರಾಗುತ್ತಿದೆ...',
    nextWeekCardGenDesc: 'ಪೌಷ್ಟಿಕಾಂಶ ಮತ್ತು ವೈವಿಧ್ಯತೆಯನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...',
    nextWeekCardGenBtn: 'ವಾರದ ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    nextWeekCardFailTitle: 'ಯೋಜನೆ ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
    nextWeekCardFailDesc: 'ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    nextWeekCardIdleTitle: 'ಮುಂದಿನ ವಾರದ ಊಟದ ಯೋಜನೆ ತಯಾರಿಸಿ',
    nextWeekCardIdleDesc: 'ಸೋಮವಾರ-ಭಾನುವಾರ ಊಟದ ಯೋಜನೆ ಮತ್ತು ಖರೀದಿ ಪಟ್ಟಿ ರಚಿಸಿ.',
    nextWeekCardIdleBtn: 'ವಾರದ ಯೋಜನೆ ತಯಾರಿಸಿ',
    tryAgain: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
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

function currentLocalHour() {
  return new Date().getHours();
}

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
}

function addDaysToLocalDate(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy.toLocaleDateString('en-CA');
}

function nextMondayLocalDate(from = new Date()) {
  const copy = new Date(from);
  const day = copy.getDay();
  const distance = day === 0 ? 1 : 8 - day;
  copy.setDate(copy.getDate() + distance);
  return copy.toLocaleDateString('en-CA');
}

function isSaturdayOrSundayLocal(from = new Date()) {
  const day = from.getDay();
  return day === 6 || day === 0;
}

function parseTimeToMinutes(value?: string) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function mealScheduleFromTimings(timings?: MealTimingPattern) {
  return [
    { mealTime: 'breakfast' as MealTime, minute: parseTimeToMinutes(timings?.breakfast) ?? 8 * 60 },
    { mealTime: 'lunch' as MealTime, minute: parseTimeToMinutes(timings?.lunch) ?? 13 * 60 },
    { mealTime: 'high_tea' as MealTime, minute: parseTimeToMinutes(timings?.snacks) ?? 17 * 60 },
    { mealTime: 'dinner' as MealTime, minute: parseTimeToMinutes(timings?.dinner) ?? 20 * 60 + 30 },
  ].sort((a, b) => a.minute - b.minute);
}

function nextMealInfoForCurrentTime(timings?: MealTimingPattern, now = new Date()) {
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const schedule = mealScheduleFromTimings(timings);
  const upcoming = schedule.find((entry) => entry.minute >= currentMinute);
  if (upcoming) {
    return {
      mealTime: upcoming.mealTime,
      targetDate: now.toLocaleDateString('en-CA'),
      scheduledTime: `${String(Math.floor(upcoming.minute / 60)).padStart(2, '0')}:${String(upcoming.minute % 60).padStart(2, '0')}`,
    };
  }
  const firstTomorrow = schedule[0];
  return {
    mealTime: firstTomorrow.mealTime,
    targetDate: addDaysToLocalDate(now, 1),
    scheduledTime: `${String(Math.floor(firstTomorrow.minute / 60)).padStart(2, '0')}:${String(firstTomorrow.minute % 60).padStart(2, '0')}`,
  };
}

function nextMealTimeForHour(hour: number): MealTime {
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'high_tea';
  return 'dinner';
}

function emptyAttendanceDraft(): MealAttendanceDraft {
  return {
    breakfast: { participatingMemberIds: [], tiffinMemberIds: [] },
    lunch: { participatingMemberIds: [], tiffinMemberIds: [] },
    dinner: { participatingMemberIds: [], tiffinMemberIds: [] },
    evening_snack: { participatingMemberIds: [], tiffinMemberIds: [] },
    high_tea: { participatingMemberIds: [], tiffinMemberIds: [] },
    snack: { participatingMemberIds: [], tiffinMemberIds: [] },
  };
}

function attendanceForAllMembers(members: HouseholdMember[], status: MemberMealAvailability = 'home'): MealAttendanceDraft {
  const memberIds = members.map((member) => member.id);
  const draft = emptyAttendanceDraft();
  dailyScheduleMealTimes.forEach((mealTime) => {
    draft[mealTime] = {
      participatingMemberIds: status === 'away' ? [] : memberIds,
      tiffinMemberIds: status === 'tiffin' ? memberIds : [],
    };
  });
  return draft;
}

function availabilityForMember(entry: MealAttendanceDraft[MealTime], memberId: string): MemberMealAvailability {
  if (entry?.tiffinMemberIds?.includes(memberId)) return 'tiffin';
  if (entry?.participatingMemberIds?.includes(memberId)) return 'home';
  return 'away';
}

function patchMealAvailability(
  entry: MealAttendanceDraft[MealTime],
  memberId: string,
  status: MemberMealAvailability
) {
  const participating = new Set(entry?.participatingMemberIds ?? []);
  const tiffin = new Set(entry?.tiffinMemberIds ?? []);
  if (status === 'away') {
    participating.delete(memberId);
    tiffin.delete(memberId);
  } else {
    participating.add(memberId);
    if (status === 'tiffin') tiffin.add(memberId);
    else tiffin.delete(memberId);
  }
  return {
    participatingMemberIds: Array.from(participating),
    tiffinMemberIds: Array.from(tiffin).filter((value) => participating.has(value)),
  };
}

function validAttendanceDraft(value: unknown): value is MealAttendanceDraft {
  if (!value || typeof value !== 'object') return false;
  return dailyScheduleMealTimes.every((mealTime) => {
    const entry = (value as Record<string, unknown>)[mealTime];
    return (
      Boolean(entry) &&
      typeof entry === 'object' &&
      Array.isArray((entry as { participatingMemberIds?: unknown }).participatingMemberIds) &&
      Array.isArray((entry as { tiffinMemberIds?: unknown }).tiffinMemberIds)
    );
  });
}

function attendanceDraftToDayPlan(
  draft: MealAttendanceDraft,
  members: HouseholdMember[],
  guestCountBySlot?: Partial<Record<MealSlot, number>>
): DayAttendancePlan {
  const toSlot = (mealTime: MealTime) => {
    const entry = draft[mealTime] ?? { participatingMemberIds: [], tiffinMemberIds: [] };
    return Object.fromEntries(
      members.map((member) => {
        if (entry.tiffinMemberIds.includes(member.id)) return [member.id, 'tiffin'];
        if (entry.participatingMemberIds.includes(member.id)) return [member.id, 'home'];
        return [member.id, 'skip'];
      })
    ) as DayAttendancePlan['breakfast'];
  };
  return {
    breakfast: toSlot('breakfast'),
    lunch: toSlot('lunch'),
    snacks: toSlot('high_tea'),
    dinner: toSlot('dinner'),
    guestCountBySlot: guestCountBySlot ?? { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 },
  };
}

function dayPlanToAttendanceDraft(plan: DayAttendancePlan, members: HouseholdMember[]): MealAttendanceDraft {
  const fromSlot = (slot: keyof Pick<DayAttendancePlan, 'breakfast' | 'lunch' | 'snacks' | 'dinner'>) => {
    const values = plan[slot] ?? {};
    return {
      participatingMemberIds: members
        .filter((member) => values[member.id] === 'home' || values[member.id] === 'tiffin')
        .map((member) => member.id),
      tiffinMemberIds: members
        .filter((member) => values[member.id] === 'tiffin')
        .map((member) => member.id),
    };
  };
  return {
    breakfast: fromSlot('breakfast'),
    lunch: fromSlot('lunch'),
    dinner: fromSlot('dinner'),
    high_tea: fromSlot('snacks'),
    evening_snack: fromSlot('snacks'),
    snack: fromSlot('snacks'),
  };
}

function weekdayForDate(dateString: string) {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    new Date(`${dateString}T12:00:00`).getDay()
  ];
}

function mealSlotForMealTime(mealTime: MealTime): MealSlot {
  if (mealTime === 'breakfast' || mealTime === 'lunch' || mealTime === 'dinner') return mealTime;
  return 'snacks';
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
  if (preference === 'semi_vegetarian') return 'non_vegetarian';
  if (preference === 'vegetarian' || preference === 'non_vegetarian' || preference === 'vegan') return preference;
  return 'other';
}

function budgetProfileFor(customer: CustomerAccount) {
  const preference = customer.budgetPreference ?? 'moderate';
  if (preference === 'economical') {
    return {
      type: 'daily' as const,
      amount: 450,
      currency: 'INR' as const,
      priority: 'strict' as const,
      preferLowCostMeals: true,
    };
  }
  if (preference === 'moderate') {
    return {
      type: 'daily' as const,
      amount: 700,
      currency: 'INR' as const,
      priority: 'flexible' as const,
      preferLowCostMeals: true,
    };
  }
  if (preference === 'custom_monthly' && customer.customMonthlyFoodBudget) {
    return {
      type: 'monthly' as const,
      amount: customer.customMonthlyFoodBudget,
      currency: 'INR' as const,
      priority: 'flexible' as const,
      preferLowCostMeals: customer.customMonthlyFoodBudget < 18000,
    };
  }
  if (preference === 'no_specific_limit') {
    return {
      type: 'none' as const,
      currency: 'INR' as const,
      priority: 'flexible' as const,
      preferLowCostMeals: false,
    };
  }
  return {
    type: 'weekly' as const,
    amount: 2500,
    currency: 'INR' as const,
    priority: 'flexible' as const,
    preferLowCostMeals: false,
  };
}

function budgetNotes(customer: CustomerAccount) {
  const preference = customer.budgetPreference ?? 'moderate';
  const labels = {
    economical: 'Economical budget: prefer affordable everyday local ingredients, reduce premium proteins, and reuse common base meals.',
    moderate: 'Moderate budget: balance cost, variety and nutrition; keep expensive items controlled.',
    flexible: 'Flexible budget: occasional premium ingredients are acceptable, but avoid waste.',
    no_specific_limit: 'No specific budget limit: prioritize preference, variety and convenience while avoiding unnecessary waste.',
    custom_monthly: `Custom monthly food budget guideline: INR ${customer.customMonthlyFoodBudget ?? 'not specified'}. Treat as planning guidance, not an exact bill promise.`,
  } satisfies Record<NonNullable<CustomerAccount['budgetPreference']>, string>;
  return [labels[preference]];
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

function routineLabel(value?: DayFoodPreference) {
  return value ? value.replaceAll('_', ' ') : 'no particular preference';
}

function weeklyRoutineNotes(customer: CustomerAccount, selectedMealTime: MealTime, targetDate: string) {
  if (customer.weeklyFoodRoutineStatus !== 'add' || !Array.isArray(customer.weeklyFoodRoutine)) return [];
  const weekday = weekdayForDate(targetDate);
  const entry = customer.weeklyFoodRoutine.find((item) => item.day?.toLowerCase() === weekday);
  if (!entry) return [];
  const slot = mealSlotForMealTime(selectedMealTime);
  const mealPreference = entry.meals?.[slot];
  const notes = [
    `Saved weekly food routine for ${weekday}: day preference ${routineLabel(entry.preference)}${mealPreference ? `; ${slot} preference ${routineLabel(mealPreference)}` : ''}. Treat this as an important preference, not an absolute command.`,
    'Latest explicit user request for this meal should override the saved weekly routine for this occasion.',
  ];
  if (entry.note?.trim()) {
    notes.push(`Saved weekly routine note for ${weekday}: ${entry.note.trim()}.`);
  }
  return notes;
}

function mealTypePreferenceNotes(customer: CustomerAccount, selectedMealTime: MealTime) {
  const slot = mealSlotForMealTime(selectedMealTime);
  const values = customer.mealTypePreferences?.[slot]?.filter(Boolean) ?? [];
  if (!values.length) return [];
  return [
    `Explicit family ${slot} preferences: ${values.join(', ')}. Family choice should override regional assumptions.`,
  ];
}

function recentMealHistoryNotes(customer: CustomerAccount, selectedMealTime: MealTime) {
  const entries = customer.recentMealHistory?.filter((entry) =>
    entry.breakfast || entry.lunch || entry.snacks || entry.dinner
  ) ?? [];
  if (!entries.length) return [];

  const slot = mealSlotForMealTime(selectedMealTime);
  const slotMeals = entries
    .map((entry) => (entry[slot] ? `${entry.day} ${slot}: ${entry[slot]}` : ''))
    .filter(Boolean)
    .slice(0, 7);
  const allMeals = entries
    .flatMap((entry) =>
      (['breakfast', 'lunch', 'snacks', 'dinner'] as MealSlot[])
        .map((mealSlot) => (entry[mealSlot] ? `${entry.day} ${mealSlot}: ${entry[mealSlot]}` : ''))
        .filter(Boolean)
    )
    .slice(0, 18);

  return [
    `Recent same-meal history: ${slotMeals.length ? slotMeals.join('; ') : 'not specified'}. Avoid repeating these dishes.`,
    `Compact recent family meal history: ${allMeals.join('; ')}. Use this for repetition control.`,
  ];
}

function cultureNotes(culture: CultureProfile) {
  const notes = [
    'Use country and region only as supporting food-culture context. Do not stereotype the family from location.',
  ];
  if (culture.cookingStyle) {
    notes.push(`Saved culture cooking style: ${culture.cookingStyle}.`);
  }
  if (culture.preferredCuisines?.length) {
    notes.push(`Saved preferred cuisines: ${culture.preferredCuisines.join(', ')}.`);
  }
  return notes;
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

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/mung dal/g, 'moong dal')
    .replace(/tomatoes/g, 'tomato')
    .replace(/potatoes/g, 'potato')
    .replace(/onions/g, 'onion')
    .replace(/[^a-z0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUnit(value: string) {
  const unit = value.toLowerCase().trim();
  const unitMap: Record<string, string> = {
    cups: 'cup',
    cup: 'cup',
    कप: 'cup',
    ಕಪ್: 'cup',
    bowls: 'bowl',
    bowl: 'bowl',
    कटोरी: 'bowl',
    ಬೌಲ್: 'bowl',
    l: 'l',
    litre: 'l',
    liter: 'l',
    litres: 'l',
    liters: 'l',
    लीटर: 'l',
    ಲೀಟರ್: 'l',
    ml: 'ml',
    मिली: 'ml',
    ಮಿಲಿ: 'ml',
    g: 'g',
    gram: 'g',
    grams: 'g',
    ग्राम: 'g',
    ಗ್ರಾಂ: 'g',
    kg: 'kg',
    किलो: 'kg',
    ಕೆಜಿ: 'kg',
    pieces: 'piece',
    piece: 'piece',
    नग: 'piece',
    ನಗ: 'piece',
    tsp: 'tsp',
    'छोटा चम्मच': 'tsp',
    'ಚಿಕ್ಕ ಚಮಚ': 'tsp',
  };
  return unitMap[unit] ?? unit;
}

function parseQuantity(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)\s*([^\d\s+]+)/u);
  if (!match) return null;
  return { amount: Number(match[1]), unit: normalizeUnit(match[2]) };
}

function toComparableQuantity(amount: number, unit: string) {
  const normalized = normalizeUnit(unit);
  if (normalized === 'kg') return { amount: amount * 1000, unit: 'g', displayUnit: 'g' };
  if (normalized === 'g') return { amount, unit: 'g', displayUnit: 'g' };
  if (normalized === 'l') return { amount: amount * 1000, unit: 'ml', displayUnit: 'ml' };
  if (normalized === 'ml') return { amount, unit: 'ml', displayUnit: 'ml' };
  return { amount, unit: normalized, displayUnit: normalized };
}

function localizedUnit(unit: string, language: string) {
  if (language === 'hi') {
    return {
      cup: 'कप',
      bowl: 'कटोरी',
      g: 'ग्राम',
      kg: 'किलो',
      ml: 'मिली',
      l: 'लीटर',
      piece: 'नग',
      tsp: 'छोटा चम्मच',
    }[unit] ?? unit;
  }

  if (language === 'kn') {
    return {
      cup: 'ಕಪ್',
      bowl: 'ಬೌಲ್',
      g: 'ಗ್ರಾಂ',
      kg: 'ಕೆಜಿ',
      ml: 'ಮಿಲಿ',
      l: 'ಲೀಟರ್',
      piece: 'ನಗ',
      tsp: 'ಚಿಕ್ಕ ಚಮಚ',
    }[unit] ?? unit;
  }

  return unit;
}

function formatComparableQuantity(amount: number, unit: string, language = 'en') {
  const rounded = Math.round(amount * 100) / 100;
  if (unit === 'g' && rounded >= 1000) return `${Math.round((rounded / 1000) * 100) / 100} ${localizedUnit('kg', language)}`;
  if (unit === 'ml' && rounded >= 1000) return `${Math.round((rounded / 1000) * 100) / 100} ${localizedUnit('l', language)}`;
  return `${rounded} ${localizedUnit(unit, language)}`;
}

function pantrySummary(items: PantryItem[]) {
  return items
    .filter((item) => item.name && Number(item.quantity) > 0)
    .slice(0, 20)
    .map((item) => `${item.name}: ${item.quantity} ${item.unit}`)
    .join('; ');
}

function adjustGroceryForPantry(plan: FamilyMealPlan, pantryItems: PantryItem[], alreadyInPantryLabel = 'Already in pantry', language = 'en'): FamilyMealPlan {
  if (!pantryItems.length) return plan;
  const adjustedItems = plan.groceryItems.map((item) => {
    const required = parseQuantity(item.quantityToPurchase || item.quantity);
    if (!required) return item;
    const requiredComparable = toComparableQuantity(required.amount, required.unit);
    const match = pantryItems.find((pantryItem) => {
      const pantryName = normalizeName(pantryItem.name);
      const groceryName = normalizeName(item.name);
      const pantryComparable = toComparableQuantity(Number(pantryItem.quantity || 0), pantryItem.unit);
      return (
        pantryName &&
        groceryName &&
        (pantryName.includes(groceryName) || groceryName.includes(pantryName)) &&
        pantryComparable.unit === requiredComparable.unit
      );
    });
    if (!match) return item;
    const pantryComparable = toComparableQuantity(Number(match.quantity || 0), match.unit);
    const remaining = Math.max(0, requiredComparable.amount - pantryComparable.amount);
    return {
      ...item,
      pantryQuantity: `${match.quantity} ${localizedUnit(normalizeUnit(match.unit), language)}`,
      quantityToPurchase:
        remaining === 0
          ? `0 - ${alreadyInPantryLabel}`
          : formatComparableQuantity(remaining, requiredComparable.displayUnit, language),
    };
  });

  return {
    ...plan,
    groceryItems: adjustedItems,
  };
}

function isIndiaLike(culture: CultureProfile) {
  const country = normalizeName(culture.country || '');
  return country.includes('india') || country.includes('bharat');
}

function attendanceNotesForSchedule(schedule: MealAttendanceDraft, members: HouseholdMember[], labels: typeof plannerCopy.en.meals) {
  return dailyScheduleMealTimes.map((mealTime) => {
    const entry = schedule[mealTime] ?? { participatingMemberIds: [], tiffinMemberIds: [] };
    const home = members
      .filter((member) => entry.participatingMemberIds.includes(member.id) && !entry.tiffinMemberIds.includes(member.id))
      .map((member) => member.name);
    const tiffin = members
      .filter((member) => entry.tiffinMemberIds.includes(member.id))
      .map((member) => member.name);
    const away = members
      .filter((member) => !entry.participatingMemberIds.includes(member.id))
      .map((member) => member.name);
    return `${mealLabel(mealTime, labels)} attendance today - Home: ${home.join(', ') || 'none'}; Tiffin: ${tiffin.join(', ') || 'none'}; Not eating this meal: ${away.join(', ') || 'none'}.`;
  });
}

function weeklySlotFor(plan: WeeklyFamilyMealPlan | null, targetDate: string, mealTime: MealTime) {
  return plan?.days
    .find((day) => day.date === targetDate)
    ?.meals.find((slot) => slot.mealTime === mealTime) ?? null;
}

function weeklyDayLabel(day: string, language: string) {
  const labels: Record<string, Record<string, string>> = {
    en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' },
    hi: { monday: 'सोमवार', tuesday: 'मंगलवार', wednesday: 'बुधवार', thursday: 'गुरुवार', friday: 'शुक्रवार', saturday: 'शनिवार', sunday: 'रविवार' },
    kn: { monday: 'ಸೋಮವಾರ', tuesday: 'ಮಂಗಳವಾರ', wednesday: 'ಬುಧವಾರ', thursday: 'ಗುರುವಾರ', friday: 'ಶುಕ್ರವಾರ', saturday: 'ಶನಿವಾರ', sunday: 'ಭಾನುವಾರ' },
  };
  return labels[language]?.[day] ?? labels.en[day] ?? day;
}

function alignMealPlanToActiveRequest(plan: FamilyMealPlan, mealTime: MealTime, targetDate: string): FamilyMealPlan {
  if (plan.commonMeal.mealTime === mealTime && plan.targetDate === targetDate) return plan;
  return {
    ...plan,
    targetDate,
    commonMeal: {
      ...plan.commonMeal,
      mealTime,
    },
  };
}

function readLocalLearningSignals(): Array<{
  mealName: string;
  mealTime: MealTime;
  outcome: 'cooked' | 'liked' | 'rejected';
  createdAt: string;
}> {
  try {
    const raw = window.localStorage.getItem(FAMILY_LEARNING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((signal) => signal?.mealName && signal?.mealTime);
  } catch {
    return [];
  }
}

function previousMealsForPlanning(mealTime: MealTime, currentMealName?: string) {
  const learnedMeals = readLocalLearningSignals()
    .filter((signal) => signal.mealTime === mealTime && (signal.outcome === 'rejected' || signal.outcome === 'cooked'))
    .map((signal) => signal.mealName);
  return [...new Set([currentMealName, ...learnedMeals].filter(Boolean) as string[])].slice(-10);
}

function saveLocalLearningSignal(signal: {
  mealName: string;
  mealTime: MealTime;
  outcome: 'cooked' | 'liked' | 'rejected';
  createdAt: string;
}) {
  try {
    const raw = window.localStorage.getItem(FAMILY_LEARNING_KEY);
    const existing = raw ? (JSON.parse(raw) as typeof signal[]) : [];
    window.localStorage.setItem(FAMILY_LEARNING_KEY, JSON.stringify([...existing.slice(-30), signal]));
  } catch {
    // Learning signal write error ignored
  }
}

export default function PlannerPage() {
  const { language } = useLanguage();
  const t = plannerCopy[language] ?? plannerCopy.en;

  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [customer, setCustomer] = useState<CustomerAccount>({});
  const [culture, setCulture] = useState<CultureProfile>({});
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  // Interactive Planning States
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('next_meal');
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>(() => nextMealTimeForHour(currentLocalHour()));
  const [mealAttendance, setMealAttendance] = useState<MealAttendanceDraft>(() => emptyAttendanceDraft());
  const [guestCountBySlot, setGuestCountBySlot] = useState<Partial<Record<MealSlot, number>>>({
    breakfast: 0,
    lunch: 0,
    snacks: 0,
    dinner: 0,
  });

  // Plan Lifecycle State
  const [mealPlan, setMealPlan] = useState<FamilyMealPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyFamilyMealPlan | null>(null);
  const [nextWeekPlan, setNextWeekPlan] = useState<WeeklyFamilyMealPlan | null>(null);
  const [weekPlanStatus, setWeekPlanStatus] = useState<WeekPlanState>('IDLE');
  const [nextWeekStatus, setNextWeekStatus] = useState('');
  const [plannerView, setPlannerView] = useState<'today' | 'week'>('today');
  const [isStalePlan, setIsStalePlan] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingServerProfile, setIsLoadingServerProfile] = useState(true);
  const [lastPlan, setLastPlan] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  const nextWeekStart = useMemo(() => nextMondayLocalDate(), []);

  // 1. Resolve Local Time on Mount
  useEffect(() => {
    const nextSlot = nextMealInfoForCurrentTime(customer.mealTimings).mealTime;
    if (plannerMode === 'next_meal') {
      setSelectedMealTime(nextSlot);
    }
  }, [customer.mealTimings, plannerMode]);

  // 2. Hydrate Client Storage & Backend Profile
  useEffect(() => {
    let cancelled = false;

    try {
      const savedMembers = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) setMembers(parsed.filter((m) => m?.name));
      }

      const savedCustomer = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (savedCustomer) setCustomer(JSON.parse(savedCustomer));

      const savedCulture = window.localStorage.getItem(CULTURE_STORAGE_KEY);
      if (savedCulture) setCulture(JSON.parse(savedCulture));

      const savedPantry = window.localStorage.getItem(PANTRY_STORAGE_KEY);
      if (savedPantry) {
        const parsedPantry = JSON.parse(savedPantry);
        if (Array.isArray(parsedPantry)) setPantryItems(parsedPantry.filter((item) => item?.name));
      }

      setLastPlan(window.localStorage.getItem(LAST_PLAN_KEY) ?? '');

      const savedWeeklyRaw = window.localStorage.getItem(WEEKLY_MASTER_PLAN_KEY);
      if (savedWeeklyRaw) setWeeklyPlan(JSON.parse(savedWeeklyRaw));

      const savedNextWeeklyRaw = window.localStorage.getItem(NEXT_WEEK_MASTER_PLAN_KEY);
      if (savedNextWeeklyRaw) {
        const parsedNextWeek = JSON.parse(savedNextWeeklyRaw);
        setNextWeekPlan(parsedNextWeek);
        if (parsedNextWeek?.days?.length === 7) setWeekPlanStatus('READY');
      }

      const savedPlanRaw = window.localStorage.getItem(CURRENT_MEAL_PLAN_KEY);
      if (savedPlanRaw) {
        const parsedPlan: FamilyMealPlan = JSON.parse(savedPlanRaw);
        if (parsedPlan?.targetDate === todayLocalDate()) {
          setMealPlan(parsedPlan);
          setIsStalePlan(false);
        } else {
          setMealPlan(parsedPlan);
          setIsStalePlan(true);
        }
      }
    } catch {
      setMembers([]);
    }

    async function loadServerProfile() {
      try {
        const response = await fetch('/api/customer/session', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !data.authenticated) return;

        if (data.customer) {
          setCustomer((prev) => ({
            ...prev,
            ...data.customer,
            familyId: data.familyProfile?.familyId || prev.familyId,
            mealSchedule: data.familyProfile?.mealSchedule || prev.mealSchedule,
          }));
          window.localStorage.setItem(
            CUSTOMER_STORAGE_KEY,
            JSON.stringify({ ...data.customer, familyId: data.familyProfile?.familyId })
          );
        }

        if (Array.isArray(data.familyProfile?.members) && data.familyProfile.members.length) {
          const normalized: HouseholdMember[] = data.familyProfile.members.map((m: any) => ({
            id: m.memberId || m.id,
            name: m.name,
            relation: m.relationship || m.relation || 'Family member',
            age: m.age,
            activityLevel: m.activityLevel,
            foodPreference: m.dietType || m.foodPreference,
            allergies: m.allergies || [],
            doctorAdvisedRestrictions: m.doctorRestrictions || m.doctorAdvisedRestrictions || [],
            dislikes: m.dislikes || [],
            mealStrategyPreference: m.mealStrategyPreference ?? 'common',
          }));
          setMembers(normalized);
          window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        // Fallback active
      } finally {
        if (!cancelled) setIsLoadingServerProfile(false);
      }
    }

    loadServerProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // 3. Load Pantry Items from Server
  useEffect(() => {
    let cancelled = false;

    async function loadServerPantry() {
      try {
        const response = await fetch('/api/pantry', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled || !Array.isArray(data.items) || !data.items.length) return;
        const serverItems = data.items
          .map((item: PantryItem & { ingredientName?: string }) => ({
            id: item.id,
            name: item.name || item.ingredientName || '',
            category: item.category,
            quantity: Number(item.quantity || 0),
            unit: item.unit || 'unit',
          }))
          .filter((item: PantryItem) => item.name);
        setPantryItems(serverItems);
        window.localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(serverItems));
      } catch {
        // Pantry fallback active
      }
    }

    loadServerPantry();
    return () => {
      cancelled = true;
    };
  }, []);

  // 4. Attendance Initialization
  useEffect(() => {
    setMealAttendance((current) => {
      const next = emptyAttendanceDraft();
      const memberIds = members.map((member) => member.id);
      dailyScheduleMealTimes.forEach((mealTime) => {
        const existing = current[mealTime] ?? { participatingMemberIds: [], tiffinMemberIds: [] };
        const participating = existing.participatingMemberIds.filter((memberId) => memberIds.includes(memberId));
        next[mealTime] = {
          participatingMemberIds: participating.length ? participating : memberIds,
          tiffinMemberIds: existing.tiffinMemberIds.filter((memberId) => memberIds.includes(memberId)),
        };
      });
      return next;
    });
  }, [members]);

  // 5. Restore Attendance from Storage
  useEffect(() => {
    if (!members.length) return;
    try {
      const today = todayLocalDate();
      const raw = window.localStorage.getItem(TODAY_ATTENDANCE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.date && parsed.date !== today && validAttendanceDraft(parsed.attendance)) {
        window.localStorage.setItem(YESTERDAY_ATTENDANCE_KEY, raw);
        return;
      }
      if (parsed?.date === today && validAttendanceDraft(parsed.attendance)) {
        const memberIds = new Set(members.map((member) => member.id));
        setMealAttendance((current) => {
          const next = { ...current };
          dailyScheduleMealTimes.forEach((mealTime) => {
            const entry = parsed.attendance[mealTime];
            next[mealTime] = {
              participatingMemberIds: entry.participatingMemberIds.filter((memberId: string) => memberIds.has(memberId)),
              tiffinMemberIds: entry.tiffinMemberIds.filter((memberId: string) => memberIds.has(memberId)),
            };
          });
          return next;
        });
      }
    } catch {
      // Ignore cache restore errors
    }
  }, [members]);

  // 6. Persist Attendance Changes
  useEffect(() => {
    if (!members.length) return;
    try {
      const today = todayLocalDate();
      window.localStorage.setItem(
        TODAY_ATTENDANCE_KEY,
        JSON.stringify({ date: today, attendance: mealAttendance })
      );
    } catch {
      // Ignore write errors
    }
  }, [mealAttendance, members.length]);

  const detectedMealInfo = useMemo(() => nextMealInfoForCurrentTime(customer.mealTimings), [customer.mealTimings]);
  const activeMealSlot = plannerMode === 'next_meal' ? detectedMealInfo.mealTime : selectedMealTime;
  const activeTargetDate = plannerMode === 'next_meal' ? detectedMealInfo.targetDate : todayLocalDate();
  const activeScheduledTime = plannerMode === 'next_meal' ? detectedMealInfo.scheduledTime : undefined;
  const activeMealLabel = mealLabel(activeMealSlot, t.meals);
  const activeGenerateLabel = t.planMealNow.replace('{meal}', activeMealLabel);
  const activeWeeklySlot = useMemo(() => weeklySlotFor(weeklyPlan, activeTargetDate, activeMealSlot), [weeklyPlan, activeTargetDate, activeMealSlot]);

  useEffect(() => {
    if (!mealPlan) return;
    if (mealPlan.commonMeal.mealTime !== activeMealSlot || mealPlan.targetDate !== activeTargetDate) {
      setMealPlan(null);
      setIsStalePlan(false);
      setStatus('');
    }
  }, [activeMealSlot, activeTargetDate, mealPlan]);

  const selectMealToPlan = (mealTime: MealTime) => {
    setPlannerMode('specific_meal');
    setSelectedMealTime(mealTime);
    setMealPlan(null);
    setIsStalePlan(false);
    setStatus('');
    setError('');
  };

  const setMealAvailability = (mealTime: MealTime, memberId: string, status: MemberMealAvailability) => {
    setMealAttendance((current) => {
      const existing = current[mealTime] ?? { participatingMemberIds: [], tiffinMemberIds: [] };
      return {
        ...current,
        [mealTime]: patchMealAvailability(existing, memberId, status),
      };
    });
  };

  const setMealForEveryone = (mealTime: MealTime, status: MemberMealAvailability) => {
    setMealAttendance((current) => ({
      ...current,
      [mealTime]: attendanceForAllMembers(members, status)[mealTime],
    }));
  };

  const activeSlotKey = mealSlotForMealTime(activeMealSlot);
  const currentGuestCount = guestCountBySlot[activeSlotKey] || 0;

  const setGuestCount = (count: number) => {
    const nextVal = Math.max(0, count);
    setGuestCountBySlot((prev) => ({
      ...prev,
      [activeSlotKey]: nextVal,
    }));
  };

  const saveRegularWeekdayPattern = async () => {
    const regularAttendancePattern = attendanceDraftToDayPlan(mealAttendance, members, guestCountBySlot);
    try {
      window.localStorage.setItem(REGULAR_WEEKDAY_ATTENDANCE_KEY, JSON.stringify(mealAttendance));
    } catch {
      // Local cache fallback
    }

    try {
      const response = await fetch('/api/customer/attendance-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regularAttendancePattern }),
      });
      if (!response.ok) throw new Error('Attendance pattern save failed');
      setCustomer((current) => ({ ...current, regularAttendancePattern }));
      setStatus(t.scheduleSaved);
    } catch {
      setStatus(t.scheduleSaved);
    }
  };

  const loadStoredAttendance = async (storageKey: string) => {
    try {
      if (storageKey === REGULAR_WEEKDAY_ATTENDANCE_KEY) {
        const response = await fetch('/api/customer/attendance-pattern', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data.regularAttendancePattern) {
            setMealAttendance(dayPlanToAttendanceDraft(data.regularAttendancePattern, members));
            if (data.regularAttendancePattern.guestCountBySlot) {
              setGuestCountBySlot(data.regularAttendancePattern.guestCountBySlot);
            }
            setCustomer((current) => ({ ...current, regularAttendancePattern: data.regularAttendancePattern }));
            return;
          }
        }
      }

      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const attendance = validAttendanceDraft(parsed?.attendance) ? parsed.attendance : parsed;
      if (!validAttendanceDraft(attendance)) return;
      const memberIds = new Set(members.map((member) => member.id));
      setMealAttendance((current) => {
        const next = { ...current };
        dailyScheduleMealTimes.forEach((mealTime) => {
          const entry = attendance[mealTime];
          next[mealTime] = {
            participatingMemberIds: entry.participatingMemberIds.filter((memberId: string) => memberIds.has(memberId)),
            tiffinMemberIds: entry.tiffinMemberIds.filter((memberId: string) => memberIds.has(memberId)),
          };
        });
        return next;
      });
    } catch {
      // Ignore invalid saved patterns
    }
  };

  const suggestedPlan = useMemo(() => planFromMemberCount(members.length), [members.length]);
  const canGenerate = members.length > 0;
  const membersMissingAge = members.filter((member) => typeof member.age !== 'number' || Number.isNaN(member.age));

  // 7. Active Generation Action
  const generatePlan = async (cravingOverride?: string) => {
    if (!canGenerate || isGenerating) return;
    if (membersMissingAge.length) {
      setError(t.incompleteText);
      return;
    }

    const activeAttendanceForValidation = mealAttendance[activeMealSlot] ?? {
      participatingMemberIds: members.map((member) => member.id),
      tiffinMemberIds: [],
    };

    if (!activeAttendanceForValidation.participatingMemberIds.length) {
      setError(t.selectOneMember);
      return;
    }

    setIsGenerating(true);
    setError('');
    setStatus(t.weeklyGenerating);
    setMealPlan(null);
    setIsStalePlan(false);

    try {
      const userId = customer.userId || `customer_${Date.now()}`;
      const targetDate = activeTargetDate;
      const activeAttendance = mealAttendance[activeMealSlot] ?? {
        participatingMemberIds: members.map((member) => member.id),
        tiffinMemberIds: [],
      };

      const country = culture.country?.trim() || 'Not specified';
      const region = culture.region?.trim() || 'Home region';
      const city = culture.city?.trim() || region;
      const cuisinePreferences = Array.from(
        new Set([
          ...(culture.preferredCuisines?.filter(Boolean) ?? []),
          ...(Object.values(customer.mealTypePreferences ?? {}).flat().filter(Boolean) as string[]),
          customer.cookingHabit ?? 'fresh_home_cooked',
        ])
      ).slice(0, 12);

      const dayAttendancePayload = attendanceDraftToDayPlan(mealAttendance, members, guestCountBySlot);

      const familyResponse = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          family: {
            name: `${customer.name || members[0]?.name || 'MAMAAI'} Household`,
            country,
            state: region,
            city,
            dietPreference: familyDietPreferenceFor(customer, members),
            cuisinePreferences: cuisinePreferences.length ? cuisinePreferences : ['Home-style'],
            localIngredientAvailabilityNotes: [
              ...cultureNotes(culture),
              ...cookingHabitNotes(customer.cookingHabit),
              ...budgetNotes(customer),
              ...mealTypePreferenceNotes(customer, activeMealSlot),
              ...recentMealHistoryNotes(customer, activeMealSlot),
              ...weeklyRoutineNotes(customer, activeMealSlot, targetDate),
              ...(pantryItems.length
                ? [`Saved pantry stock available: ${pantrySummary(pantryItems)}. Prefer using available pantry items where safe.`]
                : []),
              ...(customer.nonVegPreferredFoods?.length
                ? [`Explicit non-veg preferences: ${customer.nonVegPreferredFoods.join(', ')}.`]
                : []),
              ...attendanceNotesForSchedule(mealAttendance, members, t.meals),
              activeAttendance.tiffinMemberIds.length
                ? `Packed meal/tiffin needed for: ${members
                  .filter((member) => activeAttendance.tiffinMemberIds.includes(member.id))
                  .map((member) => member.name)
                  .join(', ')}.`
                : 'No packed meal/tiffin requested for this selected meal.',
            ],
            weeklyFoodRoutineStatus: customer.weeklyFoodRoutineStatus ?? 'skip',
            weeklyFoodRoutine: customer.weeklyFoodRoutine ?? [],
            mealTypePreferences: customer.mealTypePreferences ?? {},
            recentMealHistory: customer.recentMealHistory ?? [],
            mealTimings: customer.mealTimings ?? {},
            mealSchedule: customer.mealSchedule,
            nonVegPreferredFoods: customer.nonVegPreferredFoods ?? [],
            cultureProfile: {
              country,
              region,
              city,
              cookingStyle: culture.cookingStyle,
              preferredCuisines: culture.preferredCuisines ?? [],
            },
            budget: budgetProfileFor(customer),
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
              goals: ['Balanced home meal', ...nonVegNotes(member, activeMealSlot)],
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

      const familyParsed = await safeParseJsonResponse<{
        family: { familyId: string };
        members?: Array<{ memberId: string; name: string }>;
      }>(familyResponse);

      if (!familyParsed.success || !familyParsed.data?.family?.familyId) {
        throw new Error(familyParsed.errorText || 'We could not prepare your family profile. Please try again.');
      }

      const createdMembers = familyParsed.data.members ?? [];
      const excludeDishes = mealPlan?.commonMeal?.name ? [mealPlan.commonMeal.name] : [];
      const mealAttendancePayload = [
        {
          mealTime: activeMealSlot,
          participatingMemberIds: createdMembers
            .filter((member: { name: string }) => {
              const original = members.find((item) => item.name === member.name);
              return original ? activeAttendance.participatingMemberIds.includes(original.id) : true;
            })
            .map((member: { memberId: string }) => member.memberId),
          absentMemberIds: createdMembers
            .filter((member: { name: string }) => {
              const original = members.find((item) => item.name === member.name);
              return original ? !activeAttendance.participatingMemberIds.includes(original.id) : false;
            })
            .map((member: { memberId: string }) => member.memberId),
          fastingMemberIds: [],
          guestCount: currentGuestCount,
          enabled: true,
        },
      ];

      const mealPlanRequestBody = {
        familyId: familyParsed.data.family.familyId,
        planType: 'weekly',
        mealTime: activeMealSlot,
        preferredLanguage: language,
        userPromptOverride: cravingOverride,
        previousMeals: previousMealsForPlanning(activeMealSlot, mealPlan?.commonMeal?.name),
        excludeDishes,
        userLocalTime: new Date().toISOString(),
        userTimeZone: browserTimeZone(),
        targetDate,
        scheduledTime: activeScheduledTime,
        dayAttendancePlan: dayAttendancePayload,
        mealTimeContext: {
          timeZone: browserTimeZone(),
          locale: language,
          country,
          region,
          city,
          localHour: currentLocalHour(),
        },
        mealAttendance: mealAttendancePayload,
      };

      let alignedPlan: FamilyMealPlan;

      try {
        const weeklyResponse = await fetchWithTimeout('/api/weekly-meal-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mealPlanRequestBody),
        }, 45000);

        const weeklyParsed = await safeParseJsonResponse<{ weeklyPlan: WeeklyFamilyMealPlan; reusedExisting?: boolean }>(
          weeklyResponse
        );

        if (!weeklyParsed.success || !weeklyParsed.data?.weeklyPlan) {
          throw new Error(weeklyParsed.errorText || 'Weekly plan unavailable.');
        }

        const freshWeeklyPlan = weeklyParsed.data.weeklyPlan;
        setWeeklyPlan(freshWeeklyPlan);
        window.localStorage.setItem(WEEKLY_MASTER_PLAN_KEY, JSON.stringify(freshWeeklyPlan));
        const selectedWeeklySlot = weeklySlotFor(freshWeeklyPlan, targetDate, activeMealSlot);
        if (!selectedWeeklySlot) throw new Error('Selected meal was not found in the weekly master plan.');
        alignedPlan = alignMealPlanToActiveRequest(selectedWeeklySlot.selectedOption, activeMealSlot, targetDate);
        setStatus(t.weeklyReady);
      } catch (weeklyError) {
        console.warn('Weekly meal plan failed; falling back to direct meal generator.', weeklyError);
        const dailyResponse = await fetchWithTimeout('/api/meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...mealPlanRequestBody, planType: 'daily' }),
        }, 30000);

        const dailyParsed = await safeParseJsonResponse<{ mealPlan: FamilyMealPlan }>(dailyResponse);
        if (!dailyParsed.success || !dailyParsed.data?.mealPlan) {
          throw new Error(dailyParsed.errorText || 'Direct generation failed.');
        }

        alignedPlan = alignMealPlanToActiveRequest(dailyParsed.data.mealPlan, activeMealSlot, targetDate);
        setStatus(t.weeklyFallbackReady);
      }

      const pantryAdjustedPlan = adjustGroceryForPantry(alignedPlan, pantryItems, t.alreadyInPantry, language);
      setMealPlan(pantryAdjustedPlan);
      setIsStalePlan(false);
      window.localStorage.setItem(CURRENT_MEAL_PLAN_KEY, JSON.stringify(pantryAdjustedPlan));
      window.localStorage.setItem(LAST_PLAN_KEY, suggestedPlan);
      setLastPlan(suggestedPlan);

      trackAnalyticsEvent('meal_plan_generated', {
        category: suggestedPlan,
        label: activeMealSlot,
      });
    } catch (err: any) {
      setStatus('');
      console.error('Meal plan request failed:', err);
      setError(mealGenerationFailureMessage(language));
    } finally {
      setIsGenerating(false);
    }
  };

  // 8. Single-Slot Meal Replacement
  const handleShowAnotherOption = async (userCraving?: string) => {
    if (!mealPlan) return;
    setError('');

    try {
      const res = await fetch(`/api/meal-plans/${mealPlan.mealPlanId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: userCraving ? 'dont_like_it' : 'ate_recently',
          userPromptOverride: userCraving,
          previousMeals: previousMealsForPlanning(activeMealSlot, mealPlan.commonMeal.name),
          excludeDishes: [mealPlan.commonMeal.name],
          preferredLanguage: language,
        }),
      });

      const parsed = await safeParseJsonResponse<{ mealPlan: FamilyMealPlan }>(res);
      if (!parsed.success || !parsed.data?.mealPlan) throw new Error(parsed.errorText || 'Replacement failed');

      const updatedPlan = adjustGroceryForPantry(parsed.data.mealPlan, pantryItems, t.alreadyInPantry, language);
      setMealPlan(updatedPlan);
      setIsStalePlan(false);
      window.localStorage.setItem(CURRENT_MEAL_PLAN_KEY, JSON.stringify(updatedPlan));

      const activeSlot = weeklySlotFor(weeklyPlan, updatedPlan.targetDate, updatedPlan.commonMeal.mealTime);
      if (weeklyPlan && activeSlot) {
        const weeklyUpdate = await fetch('/api/weekly-meal-plans', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familyId: weeklyPlan.familyId,
            weekStartDate: weeklyPlan.weekStartDate,
            slotId: activeSlot.slotId,
            selectedMealPlan: updatedPlan,
            reason: userCraving || 'show_another_option',
          }),
        });
        if (weeklyUpdate.ok) {
          const weeklyUpdateData = await weeklyUpdate.json();
          if (weeklyUpdateData.weeklyPlan) {
            setWeeklyPlan(weeklyUpdateData.weeklyPlan);
            window.localStorage.setItem(WEEKLY_MASTER_PLAN_KEY, JSON.stringify(weeklyUpdateData.weeklyPlan));
          }
        }
      }

      setStatus(t.anotherOptionSuccess);
    } catch (err: any) {
      console.error('Meal replacement request failed:', err);
      setError(mealGenerationFailureMessage(language));
    }
  };

  const handleSelectAlternative = async (alt: AlternativeOption) => {
    await handleShowAnotherOption(alt.title);
  };

  // 9. Next Week Plan Generation
  const handleGenerateNextWeek = async () => {
    setWeekPlanStatus('GENERATING');
    setNextWeekStatus('');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/weekly-meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          familyId: customer.familyId || 'fam_primary',
          targetWeekStart: nextWeekStart,
          locale: language,
          preferredLanguage: language,
        }),
      });

      clearTimeout(timer);
      const parsed = await safeParseJsonResponse<{ weeklyPlan: WeeklyFamilyMealPlan }>(res);

      if (parsed.success && parsed.data?.weeklyPlan) {
        setNextWeekPlan(parsed.data.weeklyPlan);
        window.localStorage.setItem(NEXT_WEEK_MASTER_PLAN_KEY, JSON.stringify(parsed.data.weeklyPlan));
        setWeekPlanStatus('READY');
      } else {
        setWeekPlanStatus('FAILED');
      }
    } catch {
      setWeekPlanStatus('FAILED');
    }
  };

  // 10. Feedback Submission
  const submitMealFeedback = async (outcome: 'cooked' | 'liked' | 'rejected') => {
    if (!mealPlan) return;
    const rating = outcome === 'liked' ? 'loved' : outcome === 'rejected' ? 'dont_suggest_again' : 'good';
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: customer.userId,
        mealPlanId: mealPlan.mealPlanId,
        mealName: mealPlan.commonMeal.name,
        mealTime: mealPlan.commonMeal.mealTime,
        outcome,
        rating,
        notes: `${outcome}: ${mealPlan.commonMeal.name}`,
      }),
    });
    saveLocalLearningSignal({
      mealName: mealPlan.commonMeal.name,
      mealTime: mealPlan.commonMeal.mealTime,
      outcome,
      createdAt: new Date().toISOString(),
    });
    setFeedbackStatus(t.feedbackSaved);
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

        {isLoadingServerProfile && !canGenerate ? (
          <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-emerald-800">{t.loadingProfile}</p>
          </section>
        ) : !canGenerate ? (
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

              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-sm font-black text-emerald-900">{t.nextMealTitle}</p>
                <div className="mt-3 rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">{t.nextMealDetected}</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">{activeMealLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t.basedOnTiming} {activeScheduledTime ? `${activeScheduledTime} | ${activeTargetDate}` : activeTargetDate}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-black text-slate-800">{t.chooseAnotherMeal}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {dailyScheduleMealTimes.map((mealTime) => (
                      <button
                        key={`choose-${mealTime}`}
                        type="button"
                        onClick={() => selectMealToPlan(mealTime)}
                        className={`rounded-2xl px-3 py-3 text-sm font-black ring-1 ${activeMealSlot === mealTime
                            ? 'bg-emerald-800 text-white ring-emerald-800 shadow-sm'
                            : 'bg-white text-slate-700 ring-slate-200'
                          }`}
                      >
                        {mealLabel(mealTime, t.meals)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Today Attendance Matrix */}
                <div className="mt-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-sm font-black text-slate-800">{t.todayScheduleTitle}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{t.todayScheduleHelp}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => loadStoredAttendance(YESTERDAY_ATTENDANCE_KEY)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                        {t.sameAsYesterday}
                      </button>
                      <button type="button" onClick={() => loadStoredAttendance(REGULAR_WEEKDAY_ATTENDANCE_KEY)} className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                        {t.useWeekdayPattern}
                      </button>
                      <button type="button" onClick={saveRegularWeekdayPattern} className="rounded-full bg-emerald-700 px-3 py-2 text-xs font-black text-white">
                        {t.saveWeekdayPattern}
                      </button>
                      {weeklyPlan ? (
                        <button
                          type="button"
                          onClick={() => setPlannerView('week')}
                          className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 ring-1 ring-amber-200"
                        >
                          {t.viewThisWeekPlan}
                        </button>
                      ) : null}
                      {nextWeekPlan ? (
                        <button
                          type="button"
                          onClick={() => {
                            setWeeklyPlan(nextWeekPlan);
                            setPlannerView('week');
                            window.localStorage.setItem(WEEKLY_MASTER_PLAN_KEY, JSON.stringify(nextWeekPlan));
                          }}
                          className="rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-900 ring-1 ring-sky-200"
                        >
                          {t.viewNextWeekPlan}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Guest Stepper */}
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                    <div>
                      <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span>👥</span>
                        <span>{t.guests}</span>
                      </p>
                      <p className="text-[10px] text-amber-800 mt-0.5">{t.guestHelp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuestCount(currentGuestCount - 1)}
                        disabled={currentGuestCount === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-300 bg-white text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-amber-950">{currentGuestCount}</span>
                      <button
                        type="button"
                        onClick={() => setGuestCount(currentGuestCount + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white shadow-sm hover:bg-amber-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {[activeMealSlot].map((mealTime) => {
                      const entry = mealAttendance[mealTime] ?? { participatingMemberIds: [], tiffinMemberIds: [] };
                      return (
                        <article key={`schedule-${mealTime}`} className={`rounded-2xl p-4 ring-1 ${mealTime === activeMealSlot ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'}`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => selectMealToPlan(mealTime)}
                              className="text-left text-base font-black text-slate-950"
                            >
                              {mealLabel(mealTime, t.meals)}
                            </button>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => setMealForEveryone(mealTime, 'home')} className="rounded-full bg-white px-3 py-2 text-xs font-black text-emerald-800 ring-1 ring-emerald-100">
                                {t.everyone}
                              </button>
                              <button type="button" onClick={() => setMealForEveryone(mealTime, 'away')} className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                                {t.noOne}
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3">
                            {members.map((member) => {
                              const availability = availabilityForMember(entry, member.id);
                              return (
                                <div key={`${mealTime}-${member.id}`} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                  <p className="text-sm font-black text-slate-800">{member.name}</p>
                                  <div className="mt-2 grid grid-cols-3 gap-2">
                                    {(['home', 'tiffin', 'away'] as MemberMealAvailability[]).map((avail) => (
                                      <button
                                        key={`${mealTime}-${member.id}-${avail}`}
                                        type="button"
                                        onClick={() => setMealAvailability(mealTime, member.id, avail)}
                                        className={`rounded-xl px-2 py-2 text-xs font-black ring-1 ${availability === avail
                                            ? 'bg-emerald-700 text-white ring-emerald-700'
                                            : 'bg-white text-slate-700 ring-slate-200'
                                          }`}
                                      >
                                        {avail === 'home' ? t.homeMeal : avail === 'tiffin' ? t.tiffinMeal : t.awayMeal}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => generatePlan()}
                    disabled={isGenerating}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-900 disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{t.generating}</span>
                      </>
                    ) : (
                      <span>{activeGenerateLabel}</span>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {status ? (
              <p className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{status}</p>
            ) : null}
            {error ? (
              <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
            ) : null}

            {/* Next Week Preview Card with Explicit State Machine */}
            <section className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
              <span className="rounded-full bg-emerald-200/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {nextWeekStart}
              </span>

              {weekPlanStatus === 'READY' ? (
                <>
                  <h2 className="mt-2 text-lg font-bold text-slate-950">{t.nextWeekCardReadyTitle}</h2>
                  <p className="mt-1 text-xs text-slate-600">{t.nextWeekCardReadyDesc}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!nextWeekPlan) return;
                      setWeeklyPlan(nextWeekPlan);
                      setPlannerView('week');
                      window.localStorage.setItem(WEEKLY_MASTER_PLAN_KEY, JSON.stringify(nextWeekPlan));
                    }}
                    className="mt-4 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900"
                  >
                    {t.nextWeekCardViewBtn}
                  </button>
                </>
              ) : weekPlanStatus === 'GENERATING' ? (
                <>
                  <h2 className="mt-2 text-lg font-bold text-slate-950">{t.nextWeekCardGenTitle}</h2>
                  <p className="mt-1 text-xs text-slate-600">{t.nextWeekCardGenDesc}</p>
                  <button
                    disabled
                    className="mt-4 flex cursor-not-allowed items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white opacity-75"
                  >
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{t.nextWeekCardGenBtn}</span>
                  </button>
                </>
              ) : weekPlanStatus === 'FAILED' ? (
                <>
                  <h2 className="mt-2 text-lg font-bold text-red-950">{t.nextWeekCardFailTitle}</h2>
                  <p className="mt-1 text-xs text-red-600">{t.nextWeekCardFailDesc}</p>
                  <button
                    type="button"
                    onClick={handleGenerateNextWeek}
                    className="mt-4 rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-800"
                  >
                    {t.tryAgain}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-lg font-bold text-slate-950">{t.nextWeekCardIdleTitle}</h2>
                  <p className="mt-1 text-xs text-slate-600">{t.nextWeekCardIdleDesc}</p>
                  <button
                    type="button"
                    onClick={handleGenerateNextWeek}
                    className="mt-4 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    {t.nextWeekCardIdleBtn}
                  </button>
                </>
              )}
            </section>

            {/* Stale Cache Alert */}
            {isStalePlan && mealPlan && (
              <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
                <span className="text-xs text-amber-900 font-medium">{t.staleWarning}</span>
                <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-1 rounded-full">
                  {t.staleBadge} ({mealPlan.targetDate})
                </span>
              </div>
            )}

            {/* Weekly Plan View */}
            {weeklyPlan ? (
              <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-950">{t.weeklyPlanTitle}</h2>
                  <div className="flex rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setPlannerView('today')}
                      className={`rounded-full px-4 py-2 text-xs font-black ${plannerView === 'today' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
                    >
                      {t.viewToday}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlannerView('week')}
                      className={`rounded-full px-4 py-2 text-xs font-black ${plannerView === 'week' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
                    >
                      {t.viewWeek}
                    </button>
                  </div>
                </div>

                {plannerView === 'week' ? (
                  <div className="mt-4 grid gap-3">
                    {weeklyPlan.days.map((day) => (
                      <details key={day.date} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100" open={day.date === activeTargetDate}>
                        <summary className="cursor-pointer text-sm font-black text-slate-900">
                          {weeklyDayLabel(day.day, language)} | {day.date}
                        </summary>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {day.meals.map((slot) => (
                            <button
                              key={slot.slotId}
                              type="button"
                              onClick={() => {
                                setPlannerView('today');
                                setPlannerMode('specific_meal');
                                setSelectedMealTime(slot.mealTime);
                                setMealPlan(adjustGroceryForPantry(slot.selectedOption, pantryItems, t.alreadyInPantry, language));
                              }}
                              className="rounded-xl bg-white p-3 text-left ring-1 ring-slate-200"
                            >
                              <span className="block text-xs font-black uppercase tracking-wide text-emerald-700">{mealLabel(slot.mealTime, t.meals)}</span>
                              <span className="mt-1 block text-sm font-black text-slate-950">{slot.selectedMealName}</span>
                              {slot.alternatives.slice(0, 2).map((alternative, index) => (
                                <span key={`${slot.slotId}-alt-${alternative.title}`} className="mt-1 block text-xs text-slate-600">
                                  {index + 1}. {alternative.title}
                                </span>
                              ))}
                              <span className="mt-1 block text-xs font-bold text-emerald-700">{slot.alternatives.length + 1} options</span>
                            </button>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : activeWeeklySlot ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{mealLabel(activeWeeklySlot.mealTime, t.meals)} | {activeWeeklySlot.date}</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{activeWeeklySlot.selectedMealName}</p>
                    {activeWeeklySlot.alternatives.length ? (
                      <div className="mt-3 grid gap-2">
                        {activeWeeklySlot.alternatives.slice(0, 2).map((alternative) => (
                          <button
                            key={`${activeWeeklySlot.slotId}-${alternative.title}`}
                            type="button"
                            onClick={() => handleSelectAlternative(alternative)}
                            className="rounded-xl bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 ring-1 ring-emerald-100"
                          >
                            {alternative.title}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {weeklyPlan.weeklyGroceryRequirements.length ? (
                  <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                    <h3 className="text-sm font-black text-amber-950">{t.weeklyGroceryTitle}</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {weeklyPlan.weeklyGroceryRequirements.slice(0, 10).map((item) => (
                        <div key={item.itemId} className="rounded-xl bg-white p-3 text-xs ring-1 ring-amber-100">
                          <span className="font-black text-slate-900">{item.name}</span>
                          <span className="block text-slate-600">{item.quantityToPurchase}</span>
                          {item.freshnessNote ? <span className="mt-1 block text-[11px] leading-4 text-amber-800">{item.freshnessNote}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {weeklyPlan.procurementSchedule?.length ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                    <h3 className="text-sm font-black text-emerald-950">{t.procurementTitle}</h3>
                    <div className="mt-3 grid gap-3">
                      {weeklyPlan.procurementSchedule.map((group) => (
                        <details key={group.groupId} className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100" open={group.recommendedWindow === 'buy_this_weekend'}>
                          <summary className="cursor-pointer text-sm font-black text-emerald-950">
                            {group.title}{group.recommendedPurchaseDate ? ` | ${group.recommendedPurchaseDate}` : ''}
                          </summary>
                          <p className="mt-2 text-xs leading-5 text-emerald-900">{group.description}</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {group.items.slice(0, 12).map((item) => (
                              <div key={`${group.groupId}-${item.itemId}`} className="rounded-lg bg-white p-2 text-xs ring-1 ring-emerald-100">
                                <span className="font-black text-slate-900">{item.name}</span>
                                <span className="block text-slate-600">{item.quantityToPurchase}</span>
                                <span className="block text-[11px] text-slate-500">{item.plannedConsumptionDates?.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-600">{weeklyPlan.procurementSafetyNote || t.procurementSafety}</p>
                  </div>
                ) : null}

                {weeklyPlan.tomorrowIngredientReminder?.stillToArrange?.length ? (
                  <div className="mt-4 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                    <h3 className="text-sm font-black text-sky-950">{t.tomorrowReminderTitle} | {weeklyPlan.tomorrowIngredientReminder.date}</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {weeklyPlan.tomorrowIngredientReminder.stillToArrange.slice(0, 12).map((item) => (
                        <div key={`tomorrow-${item.itemId}`} className="rounded-xl bg-white p-3 text-xs ring-1 ring-sky-100">
                          <span className="font-black text-slate-900">{item.name}</span>
                          <span className="block text-slate-600">{item.quantityToPurchase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {isIndiaLike(culture) && weeklyPlan.sabSewaShoppingRequirement?.length ? (
                  <div className="mt-4 rounded-2xl bg-lime-50 p-4 ring-1 ring-lime-100">
                    <h3 className="text-sm font-black text-lime-950">{t.sabsewaProcurementTitle}</h3>
                    <p className="mt-2 text-xs leading-5 text-lime-900">{t.sabsewaText}</p>
                    <a href="https://www.sabsewa.in" target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-full bg-lime-700 px-4 py-2 text-xs font-black text-white">
                      {t.sabsewaCta}
                    </a>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Output Meal Plan Display */}
            {mealPlan && (
              <section className="space-y-6">
                <MealCard
                  dishName={mealPlan.commonMeal.name}
                  description={mealPlan.commonMeal.description}
                  mealLabel={mealLabel(mealPlan.commonMeal.mealTime, t.meals)}
                  targetDate={mealPlan.targetDate}
                  prepTimeMinutes={mealPlan.commonMeal.prepTimeMinutes}
                  difficulty={difficultyLabel(mealPlan.commonMeal.difficulty, t.difficulties)}
                  costInr={mealPlan.estimatedCost.mealCost.amount}
                  recipeSteps={mealPlan.commonMeal.recipe.steps}
                  alternatives={mealPlan.commonMeal.alternativeOptions}
                  language={language}
                  onSelectAlternative={handleSelectAlternative}
                  onShowAnotherOption={handleShowAnotherOption}
                />

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-base font-bold text-slate-950">{t.recipe}</h3>
                    <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                      {mealPlan.commonMeal.recipe.steps.map((step, index) => (
                        <li key={`${step}-${index}`}>{index + 1}. {step}</li>
                      ))}
                    </ol>

                    {/* Feedback Options */}
                    <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <h3 className="text-sm font-black text-slate-950">{t.feedbackTitle}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => submitMealFeedback('cooked')}
                          className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200"
                        >
                          {t.cooked}
                        </button>
                        <button
                          type="button"
                          onClick={() => submitMealFeedback('liked')}
                          className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white"
                        >
                          {t.liked}
                        </button>
                        <button
                          type="button"
                          onClick={() => submitMealFeedback('rejected')}
                          className="rounded-full bg-white px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-100"
                        >
                          {t.rejected}
                        </button>
                      </div>
                      {feedbackStatus ? <p className="mt-3 text-xs font-semibold text-emerald-800">{feedbackStatus}</p> : null}
                    </div>
                  </article>

                  <div className="grid gap-6">
                    {/* Portion Guidance */}
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

                    {/* Grocery Deficit Engine */}
                    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h3 className="text-lg font-bold text-slate-950">{t.grocery}</h3>
                      {pantryItems.length ? (
                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                          {t.pantryUsed}: {pantryItems.length}
                        </p>
                      ) : null}
                      <div className="mt-4 grid gap-3">
                        {mealPlan.groceryItems.slice(0, 8).map((item) => (
                          <div key={item.itemId} className="flex items-start justify-between gap-3 rounded-2xl bg-emerald-50 p-3 text-sm">
                            <span className="font-bold text-emerald-950">{item.name}</span>
                            <span className="text-right text-emerald-800">
                              {item.quantityToPurchase}
                              {item.pantryQuantity ? (
                                <small className="block text-[11px] text-emerald-700">{t.pantryUsed}: {item.pantryQuantity}</small>
                              ) : null}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* SabSewa Local Hand-Off */}
                      {isIndiaLike(culture) ? (
                        <div className="mt-5 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                          <h4 className="text-sm font-black text-amber-950">{t.sabsewaTitle}</h4>
                          <p className="mt-2 text-xs leading-5 text-amber-900">{t.sabsewaText}</p>
                          <a
                            href="https://www.sabsewa.in"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-full bg-amber-600 px-4 py-2 text-xs font-black text-white"
                          >
                            {t.sabsewaCta}
                          </a>
                        </div>
                      ) : null}
                    </article>

                    {/* Fruits & Hydration */}
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
                </div>
              </section>
            )}

            {/* Upcoming Meal Reminder */}
            <UpcomingMealReminder
              schedule={customer.mealSchedule}
              attendance={attendanceDraftToDayPlan(mealAttendance, members, guestCountBySlot)}
              language={language}
              onViewPlan={(slot) => {
                const mapSlotToMealTime: Record<MealSlot, MealTime> = {
                  breakfast: 'breakfast',
                  lunch: 'lunch',
                  snacks: 'high_tea',
                  dinner: 'dinner',
                };
                selectMealToPlan(mapSlotToMealTime[slot]);
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}