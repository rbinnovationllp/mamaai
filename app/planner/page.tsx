'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { MealCard } from '@/components/planner/MealCard';
import type {
  DayFoodPreference,
  DayWiseFoodRoutinePreference,
  DietType,
  FamilyDietPreference,
  FamilyMealPlan,
  MealAlternativeOption,
  MealSlot,
  MealTime,
  RecentMealHistoryDay,
  RecipeVideoSearchResponse,
  WeeklyFoodRoutineStatus,
} from '@/lib/shared/contracts';
import { trackAnalyticsEvent } from '@/lib/shared/client-analytics';

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';
const CULTURE_STORAGE_KEY = 'mamaai_culture_profile_v1';
const LAST_PLAN_KEY = 'mamaai_last_successful_plan';
const DAILY_PLAN_CACHE_KEY = 'mamaai_daily_meal_plan_cache_v1';
const CURRENT_MEAL_PLAN_KEY = 'mamaai_current_meal_plan';
const PANTRY_STORAGE_KEY = 'mamaai_pantry_items_v1';
const FAMILY_LEARNING_KEY = 'mamaai_family_learning_signals_v1';
const TODAY_ATTENDANCE_KEY = 'mamaai_today_meal_attendance_v1';
const YESTERDAY_ATTENDANCE_KEY = 'mamaai_yesterday_meal_attendance_v1';
const REGULAR_WEEKDAY_ATTENDANCE_KEY = 'mamaai_regular_weekday_attendance_v1';

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
  budgetPreference?: 'economical' | 'moderate' | 'flexible' | 'no_specific_limit' | 'custom_monthly';
  customMonthlyFoodBudget?: number;
  weeklyFoodRoutineStatus?: WeeklyFoodRoutineStatus;
  weeklyFoodRoutine?: DayWiseFoodRoutinePreference[];
  mealTypePreferences?: Partial<Record<MealSlot, string[]>>;
  recentMealHistory?: RecentMealHistoryDay[];
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

const dailyScheduleMealTimes: MealTime[] = ['breakfast', 'lunch', 'high_tea', 'dinner'];

const plannerCopy = {
  en: {
    title: "Plan Today's Family Meal",
    subtitle: 'Generate and view the next practical family food plan from your saved household profile.',
    readyTitle: 'Your saved household is ready',
    missingTitle: 'Complete your family profile first',
    loadingProfile: 'Checking your saved family profile...',
    missingText:
      'Add at least one family member with relation and any allergies, restrictions or dislikes. Then return here to generate the food plan.',
    incompleteText: 'Please complete age for every family member before generating a portion-aware meal plan.',
    completeProfile: 'Complete Family Profile',
    subscription: 'Choose Subscription / Trial',
    meal: 'Meal to plan',
    generate: "Plan Today's Family Meal",
    generating: 'Generating family food plan...',
    success: "Today's family food plan is ready.",
    staleWarning: '⚠️ Showing previously saved meal plan. Tap the button above to generate a fresh recommendation for today.',
    staleBadge: 'Previous Plan',
    noSubscription:
      'If payment or trial is not completed yet, choose a subscription first. Judges can use evaluator access from the subscription page.',
    subscriptionSuccess: 'Subscription verified. You can now generate your family food plan.',
    plannerMode: 'Planning mode',
    nextMealMode: 'Plan next meal from current time',
    specificMealMode: 'Plan a specific meal',
    mealAttendanceTitle: 'Who will eat this meal?',
    tiffinTitle: 'Packed meal / tiffin',
    tiffinHelp: 'Select only members who need this meal packed for office, school or travel.',
    selectedByTime: 'Auto-selected from your local time',
    selectOneMember: 'Select at least one family member for this meal.',
    todayScheduleTitle: 'Who will be eating each meal today?',
    todayScheduleHelp: 'Choose Home, Tiffin or Not eating for each member. This controls portions, dietary checks, pantry use and grocery quantities.',
    everyone: 'Everyone',
    noOne: 'No One',
    sameAsYesterday: 'Same as Yesterday',
    useWeekdayPattern: 'Use Regular Weekday Pattern',
    saveWeekdayPattern: 'Save as Regular Weekday Pattern',
    homeMeal: 'Home',
    tiffinMeal: 'Tiffin',
    awayMeal: 'Not eating',
    scheduleSaved: 'Regular weekday pattern saved on this device.',
    pantryUsed: 'Pantry considered',
    alreadyInPantry: 'Already in pantry',
    sabsewaTitle: 'Support Your Local Vendor',
    sabsewaText: 'For Indian households, use this grocery list with your nearby shop. Future SabSewa Local handoff will connect ingredients to participating local vendors.',
    sabsewaCta: 'Find on SabSewa Local',
    sabsewaInvite: "Can't find your favourite local shop? Invite them to join SabSewa Local.",
    feedbackTitle: 'Help MAMAAI learn',
    cooked: 'Cooked this',
    liked: 'Liked it',
    rejected: 'Do not suggest again',
    mealWishLabel: 'What kind of food would you like today?',
    mealWishPlaceholder: 'Example: not light food today, paneer dinner, South Indian, quick dinner...',
    showAnotherOption: 'Show Me Another Option',
    anotherOptionLoading: 'Finding another suitable meal...',
    anotherOptionSuccess: 'Another suitable meal is ready.',
    feedbackSaved: 'Thanks. This signal was saved for future personalization.',
    commonMeal: "Today's Family Meal",
    portions: 'Member guidance',
    grocery: 'Grocery list',
    fruit: 'Fruit and hydration',
    profile: 'Family Profile',
    members: 'members',
    suggestedPlan: 'Suggested plan',
    lastSelected: 'Last selected',
    recipe: 'Recipe',
    mealComponents: 'Meal components',
    servesMembers: 'For',
    watchVideo: 'Watch How to Cook',
    videoLoading: 'Searching suitable cooking videos...',
    videoEmpty: "We couldn't find a suitable cooking video for this dish right now. Please use the written recipe.",
    sponsoredVideo: 'Sponsored Recipe Video / Paid Promotion',
    videoMatch: {
      exact: 'exact',
      close: 'close',
      fallback: 'fallback',
      approved: 'Approved',
      sponsored: 'Sponsored',
      youtube: 'YouTube',
      fallback_search: 'fallback search',
    },
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
    loadingProfile: 'आपकी सेव की हुई family profile check हो रही है...',
    missingText:
      'कम से कम एक सदस्य, रिश्ता और कोई एलर्जी, डॉक्टर की पाबंदी या नापसंद जोड़ें। फिर भोजन योजना बनाने के लिए यहां लौटें।',
    incompleteText: 'हिस्से के अनुसार भोजन योजना बनाने से पहले हर परिवार सदस्य की उम्र भरें।',
    completeProfile: 'परिवार प्रोफाइल पूरी करें',
    subscription: 'सब्सक्रिप्शन / ट्रायल चुनें',
    meal: 'कौन सा भोजन प्लान करना है',
    generate: 'आज का पारिवारिक भोजन प्लान करें',
    generating: 'पारिवारिक भोजन योजना बन रही है...',
    success: 'आज का पारिवारिक भोजन तैयार है।',
    staleWarning: '⚠️ यह पिछला सेव किया हुआ प्लान है। आज का नया भोजन बनाने के लिए ऊपर बटन दबाएं।',
    staleBadge: 'पिछला प्लान',
    noSubscription:
      'अगर भुगतान या ट्रायल पूरा नहीं है, तो पहले सब्सक्रिप्शन चुनें। जज सब्सक्रिप्शन पेज से मूल्यांकन एक्सेस इस्तेमाल कर सकते हैं।',
    subscriptionSuccess: 'सब्सक्रिप्शन सत्यापित हो गया है। अब आप अपने परिवार का भोजन प्लान बना सकते हैं।',
    plannerMode: 'प्लानिंग मोड',
    nextMealMode: 'मौजूदा समय के अनुसार अगला भोजन प्लान करें',
    specificMealMode: 'कोई खास भोजन प्लान करें',
    mealAttendanceTitle: 'यह भोजन कौन खाएगा?',
    tiffinTitle: 'पैक्ड मील / टिफिन',
    tiffinHelp: 'केवल उन सदस्यों को चुनें जिन्हें ऑफिस, स्कूल या यात्रा के लिए यह भोजन पैक चाहिए।',
    selectedByTime: 'आपके स्थानीय समय से अपने-आप चुना गया',
    selectOneMember: 'इस भोजन के लिए कम से कम एक परिवार सदस्य चुनें।',
    todayScheduleTitle: 'आज हर भोजन कौन खाएगा?',
    todayScheduleHelp: 'हर सदस्य के लिए Home, Tiffin या Not eating चुनें। इसी से portions, dietary checks, pantry और grocery quantity तय होगी।',
    everyone: 'सभी',
    noOne: 'कोई नहीं',
    sameAsYesterday: 'कल जैसा',
    useWeekdayPattern: 'Regular weekday pattern लगाएं',
    saveWeekdayPattern: 'Regular weekday pattern सेव करें',
    homeMeal: 'घर पर',
    tiffinMeal: 'टिफिन',
    awayMeal: 'नहीं खाएंगे',
    scheduleSaved: 'Regular weekday pattern इस device पर सेव हो गया।',
    pantryUsed: 'पैंट्री को ध्यान में रखा गया',
    alreadyInPantry: 'पैंट्री में पहले से है',
    sabsewaTitle: 'अपने local vendor को support करें',
    sabsewaText: 'भारतीय परिवार इस किराने की सूची को अपने नजदीकी दुकानदार के साथ इस्तेमाल कर सकते हैं। आगे SabSewa Local सामग्री को भाग लेने वाले स्थानीय विक्रेताओं से जोड़ सकेगा।',
    sabsewaCta: 'SabSewa Local पर देखें',
    sabsewaInvite: 'आपकी पसंदीदा स्थानीय दुकान नहीं दिख रही? उन्हें SabSewa Local से जुड़ने के लिए आमंत्रित करें।',
    feedbackTitle: 'MAMAAI को सीखने में मदद करें',
    cooked: 'यह बनाया',
    liked: 'पसंद आया',
    rejected: 'फिर न सुझाएं',
    mealWishLabel: 'आज आप किस तरह का खाना चाहते हैं?',
    mealWishPlaceholder: 'जैसे: आज हल्का नहीं, पनीर डिनर, South Indian, जल्दी बनने वाला खाना...',
    showAnotherOption: 'दूसरा भोजन सुझाएँ',
    anotherOptionLoading: 'दूसरा उपयुक्त भोजन खोज रहे हैं...',
    anotherOptionSuccess: 'दूसरा उपयुक्त भोजन तैयार है।',
    feedbackSaved: 'धन्यवाद। यह संकेत आगे की व्यक्तिगत योजना के लिए सेव हो गया।',
    commonMeal: 'आज का पारिवारिक भोजन',
    portions: 'सदस्य-विशेष मार्गदर्शन',
    grocery: 'किराने की सूची',
    fruit: 'फल और पानी',
    profile: 'परिवार प्रोफाइल',
    members: 'सदस्य',
    suggestedPlan: 'सुझाया गया प्लान',
    lastSelected: 'पिछली बार चुना गया',
    recipe: 'रेसिपी',
    mealComponents: 'भोजन के हिस्से',
    servesMembers: 'इनके लिए',
    watchVideo: 'कैसे बनाएं वीडियो देखें',
    videoLoading: 'उपयुक्त खाना बनाने का वीडियो खोज रहे हैं...',
    videoEmpty: 'इस व्यंजन के लिए अभी उपयुक्त खाना बनाने का वीडियो नहीं मिला। कृपया लिखी हुई रेसिपी इस्तेमाल करें।',
    sponsoredVideo: 'प्रायोजित रेसिपी वीडियो / पेड प्रमोशन',
    videoMatch: {
      exact: 'सटीक',
      close: 'निकट',
      fallback: 'वैकल्पिक खोज',
      approved: 'स्वीकृत',
      sponsored: 'प्रायोजित',
      youtube: 'YouTube',
      fallback_search: 'वैकल्पिक खोज',
    },
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
    loadingProfile: 'ನಿಮ್ಮ ಉಳಿಸಿದ family profile ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    missingText:
      'ಕನಿಷ್ಠ ಒಬ್ಬ ಸದಸ್ಯ, ಸಂಬಂಧ ಮತ್ತು ಯಾವುದೇ ಅಲರ್ಜಿ, ವೈದ್ಯರ ನಿರ್ಬಂಧ ಅಥವಾ ಇಷ್ಟವಿಲ್ಲದ ಪದಾರ್ಥಗಳನ್ನು ಸೇರಿಸಿ. ನಂತರ ಊಟದ ಯೋಜನೆ ಮಾಡಲು ಇಲ್ಲಿ ಮರಳಿ ಬನ್ನಿ.',
    incompleteText: 'ಭಾಗಕ್ಕೆ ಅನುಗುಣವಾದ ಊಟದ ಯೋಜನೆ ಮಾಡಲು ಮೊದಲು ಪ್ರತಿ ಕುಟುಂಬ ಸದಸ್ಯರ ವಯಸ್ಸು ಭರ್ತಿ ಮಾಡಿ.',
    completeProfile: 'ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    subscription: 'ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ / ಟ್ರಯಲ್ ಆಯ್ಕೆಮಾಡಿ',
    meal: 'ಯಾವ ಊಟವನ್ನು ಯೋಜಿಸಬೇಕು',
    generate: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    generating: 'ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    success: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟ ಸಿದ್ಧವಾಗಿದೆ.',
    staleWarning: '⚠️ ಇದು ಹಿಂದಿನ ಊಟದ ಪ್ಲಾನ್ ಆಗಿದೆ. ಇಂದಿನ ಹೊಸ ಊಟವನ್ನು ಯೋಜಿಸಲು ಮೇಲಿನ ಬಟನ್ ಒತ್ತಿರಿ.',
    staleBadge: 'ಹಿಂದಿನ ಪ್ಲಾನ್',
    noSubscription:
      'ಪಾವತಿ ಅಥವಾ ಟ್ರಯಲ್ ಪೂರ್ಣವಾಗಿರದಿದ್ದರೆ ಮೊದಲು ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಆಯ್ಕೆಮಾಡಿ. ಜಡ್ಜ್‌ಗಳು ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಪೇಜ್‌ನಿಂದ ಮೌಲ್ಯಮಾಪನ ಪ್ರವೇಶ ಬಳಸಬಹುದು.',
    subscriptionSuccess: 'ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಈಗ ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆ ರಚಿಸಬಹುದು.',
    plannerMode: 'ಯೋಜನೆ ಮೋಡ್',
    nextMealMode: 'ಪ್ರಸ್ತುತ ಸಮಯದ ಪ್ರಕಾರ ಮುಂದಿನ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    specificMealMode: 'ನಿರ್ದಿಷ್ಟ ಊಟವನ್ನು ಯೋಜಿಸಿ',
    mealAttendanceTitle: 'ಈ ಊಟವನ್ನು ಯಾರು ತಿನ್ನುತ್ತಾರೆ?',
    tiffinTitle: 'ಪ್ಯಾಕ್ ಮಾಡಿದ ಊಟ / ಟಿಫಿನ್',
    tiffinHelp: 'ಆಫೀಸ್, ಶಾಲೆ ಅಥವಾ ಪ್ರಯಾಣಕ್ಕೆ ಈ ಊಟವನ್ನು ಪ್ಯಾಕ್ ಮಾಡಿಸಬೇಕಾದ ಸದಸ್ಯರನ್ನು ಮಾತ್ರ ಆಯ್ಕೆಮಾಡಿ.',
    selectedByTime: 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ಸಮಯದಿಂದ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ',
    selectOneMember: 'ಈ ಊಟಕ್ಕೆ ಕನಿಷ್ಠ ಒಬ್ಬ ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    todayScheduleTitle: 'ಇಂದು ಪ್ರತಿ ಊಟವನ್ನು ಯಾರು ತಿನ್ನುತ್ತಾರೆ?',
    todayScheduleHelp: 'ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ Home, Tiffin ಅಥವಾ Not eating ಆಯ್ಕೆಮಾಡಿ. ಇದರಿಂದ portions, dietary checks, pantry ಮತ್ತು grocery quantity ನಿರ್ಧಾರವಾಗುತ್ತದೆ.',
    everyone: 'ಎಲ್ಲರೂ',
    noOne: 'ಯಾರೂ ಇಲ್ಲ',
    sameAsYesterday: 'ನಿನ್ನೆ ಇದ್ದಂತೆ',
    useWeekdayPattern: 'Regular weekday pattern ಬಳಸಿ',
    saveWeekdayPattern: 'Regular weekday pattern ಉಳಿಸಿ',
    homeMeal: 'ಮನೆಯಲ್ಲಿ',
    tiffinMeal: 'ಟಿಫಿನ್',
    awayMeal: 'ತಿನ್ನುವುದಿಲ್ಲ',
    scheduleSaved: 'Regular weekday pattern ಈ device ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
    pantryUsed: 'ಪ್ಯಾಂಟ್ರಿಯನ್ನು ಪರಿಗಣಿಸಲಾಗಿದೆ',
    alreadyInPantry: 'ಈಗಾಗಲೇ ಪ್ಯಾಂಟ್ರಿಯಲ್ಲಿದೆ',
    sabsewaTitle: 'ನಿಮ್ಮ local vendor ಅನ್ನು support ಮಾಡಿ',
    sabsewaText: 'ಭಾರತೀಯ ಕುಟುಂಬಗಳು ಈ ಕಿರಾಣಿ ಪಟ್ಟಿಯನ್ನು ಹತ್ತಿರದ ಅಂಗಡಿಯವರೊಂದಿಗೆ ಬಳಸಬಹುದು. ಮುಂದೆ SabSewa Local ಪದಾರ್ಥಗಳನ್ನು ಭಾಗವಹಿಸುವ ಸ್ಥಳೀಯ ಮಾರಾಟಗಾರರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಬಹುದು.',
    sabsewaCta: 'SabSewa Local ನಲ್ಲಿ ನೋಡಿ',
    sabsewaInvite: 'ನಿಮ್ಮ ಇಷ್ಟದ ಸ್ಥಳೀಯ ಅಂಗಡಿ ಕಾಣುತ್ತಿಲ್ಲವೇ? ಅವರನ್ನು SabSewa Local ಗೆ ಸೇರಲು ಆಹ್ವಾನಿಸಿ.',
    feedbackTitle: 'MAMAAI ಕಲಿಯಲು ಸಹಾಯ ಮಾಡಿ',
    cooked: 'ಇದನ್ನು ಅಡುಗೆ ಮಾಡಿದೆವು',
    liked: 'ಇಷ್ಟವಾಯಿತು',
    rejected: 'ಮತ್ತೆ ಸೂಚಿಸಬೇಡಿ',
    mealWishLabel: 'ಇಂದು ಯಾವ ರೀತಿಯ ಆಹಾರ ಬೇಕು?',
    mealWishPlaceholder: 'ಉದಾ: ಇಂದು ಹಗುರ ಬೇಡ, ಪನೀರ್ ಡಿನ್ನರ್, South Indian, ಬೇಗ ಆಗುವ ಊಟ...',
    showAnotherOption: 'ಮತ್ತೊಂದು ಊಟ ಸೂಚಿಸಿ',
    anotherOptionLoading: 'ಇನ್ನೊಂದು ಸೂಕ್ತ ಊಟ ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    anotherOptionSuccess: 'ಇನ್ನೊಂದು ಸೂಕ್ತ ಊಟ ಸಿದ್ಧವಾಗಿದೆ.',
    feedbackSaved: 'ಧನ್ಯವಾದಗಳು. ಈ ಸೂಚನೆ ಮುಂದಿನ ವೈಯಕ್ತಿಕ ಯೋಜನೆಗಾಗಿ ಉಳಿಸಲಾಗಿದೆ.',
    commonMeal: 'ಇಂದಿನ ಕುಟುಂಬದ ಊಟ',
    portions: 'ಸದಸ್ಯರಿಗನುಗುಣ ಮಾರ್ಗದರ್ಶನ',
    grocery: 'ಕಿರಾಣಿ ಪಟ್ಟಿ',
    fruit: 'ಹಣ್ಣು ಮತ್ತು ನೀರು',
    profile: 'ಕುಟುಂಬ ಪ್ರೊಫೈಲ್',
    members: 'ಸದಸ್ಯರು',
    suggestedPlan: 'ಸೂಚಿಸಿದ ಪ್ಲ್ಯಾನ್',
    lastSelected: 'ಕೊನೆಯದಾಗಿ ಆಯ್ಕೆಮಾಡಿದದು',
    recipe: 'ರೆಸಿಪಿ',
    mealComponents: 'ಊಟದ ಭಾಗಗಳು',
    servesMembers: 'ಇವರಿಗೆ',
    watchVideo: 'ಹೇಗೆ ಅಡುಗೆ ಮಾಡುವುದು ನೋಡಿ',
    videoLoading: 'ಸೂಕ್ತ ಅಡುಗೆ ವಿಡಿಯೋ ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    videoEmpty: 'ಈ ತಿನಿಸಿಗೆ ಈಗ ಸೂಕ್ತ ಅಡುಗೆ ವಿಡಿಯೋ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬರಹದ ರೆಸಿಪಿ ಬಳಸಿ.',
    sponsoredVideo: 'ಪ್ರಾಯೋಜಿತ ರೆಸಿಪಿ ವಿಡಿಯೋ / ಪೇಡ್ ಪ್ರಮೋಶನ್',
    videoMatch: {
      exact: 'ಸರಿಯಾಗಿ ಹೊಂದಿದೆ',
      close: 'ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆ',
      fallback: 'ಪರ್ಯಾಯ ಹುಡುಕಾಟ',
      approved: 'ಅನುಮೋದಿತ',
      sponsored: 'ಪ್ರಾಯೋಜಿತ',
      youtube: 'YouTube',
      fallback_search: 'ಪರ್ಯಾಯ ಹುಡುಕಾಟ',
    },
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

function currentLocalHour() {
  return new Date().getHours();
}

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
}

function nextMealTimeForHour(hour: number): MealTime {
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 18) return 'high_tea';
  return 'dinner';
}

function remainingMealTimesForHour(hour: number): MealTime[] {
  if (hour < 10) return ['breakfast', 'lunch', 'high_tea', 'dinner'];
  if (hour < 15) return ['lunch', 'high_tea', 'dinner'];
  if (hour < 18) return ['high_tea', 'dinner'];
  return ['dinner'];
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

function normalizeServerFamilyMembers(rawMembers: unknown): HouseholdMember[] {
  if (!Array.isArray(rawMembers)) return [];
  return rawMembers
    .map((member) => {
      const item = member as Partial<HouseholdMember> & {
        memberId?: string;
        relationship?: string;
        doctorRestrictions?: string[];
      };
      return {
        id: String(item.id || item.memberId || ''),
        name: String(item.name || '').trim(),
        relation: String(item.relation || item.relationship || 'Family member').trim(),
        age: typeof item.age === 'number' ? item.age : undefined,
        activityLevel: item.activityLevel,
        foodPreference: item.foodPreference,
        nonVegFrequency: item.nonVegFrequency,
        nonVegAvoidDays: Array.isArray(item.nonVegAvoidDays) ? item.nonVegAvoidDays : [],
        nonVegCustomRule: item.nonVegCustomRule,
        allergies: Array.isArray(item.allergies) ? item.allergies : [],
        doctorAdvisedRestrictions: Array.isArray(item.doctorAdvisedRestrictions)
          ? item.doctorAdvisedRestrictions
          : Array.isArray(item.doctorRestrictions)
            ? item.doctorRestrictions
            : [],
        dislikes: Array.isArray(item.dislikes) ? item.dislikes : [],
        mealStrategyPreference: item.mealStrategyPreference ?? 'common',
      } satisfies HouseholdMember;
    })
    .filter((member) => member.id && member.name);
}

function hydrateCustomerFromServer(rawCustomer: unknown): CustomerAccount {
  return rawCustomer && typeof rawCustomer === 'object' ? (rawCustomer as CustomerAccount) : {};
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
    `Saved weekly food routine for ${weekday}: day preference ${routineLabel(entry.preference)}${mealPreference ? `; ${slot} preference ${routineLabel(mealPreference)}` : ''
    }. Treat this as an important preference, not an absolute command.`,
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

function videoLanguageLabel(value: string | undefined, language: string) {
  if (!value) return '';
  const labels: Record<string, Record<string, string>> = {
    en: { en: 'English', hi: 'Hindi', kn: 'Kannada' },
    hi: { en: 'अंग्रेजी', hi: 'हिन्दी', kn: 'कन्नड़' },
    kn: { en: 'ಇಂಗ್ಲಿಷ್', hi: 'ಹಿಂದಿ', kn: 'ಕನ್ನಡ' },
  };
  return labels[language]?.[value] ?? value;
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
  return !country || country.includes('india') || country.includes('bharat');
}

function stableContextSignature(input: {
  members: HouseholdMember[];
  customer: CustomerAccount;
  culture: CultureProfile;
  language: string;
}) {
  return JSON.stringify({
    language: input.language,
    members: input.members.map((member) => ({
      name: member.name,
      relation: member.relation,
      age: member.age,
      foodPreference: member.foodPreference,
      allergies: member.allergies ?? [],
      restrictions: member.doctorAdvisedRestrictions ?? [],
      dislikes: member.dislikes ?? [],
      nonVegFrequency: member.nonVegFrequency,
      nonVegAvoidDays: member.nonVegAvoidDays ?? [],
    })),
    householdFoodPreference: input.customer.householdFoodPreference,
    cookingHabit: input.customer.cookingHabit,
    budgetPreference: input.customer.budgetPreference,
    customMonthlyFoodBudget: input.customer.customMonthlyFoodBudget,
    mealTypePreferences: input.customer.mealTypePreferences ?? {},
    recentMealHistory: input.customer.recentMealHistory ?? [],
    weeklyFoodRoutineStatus: input.customer.weeklyFoodRoutineStatus,
    weeklyFoodRoutine: input.customer.weeklyFoodRoutine ?? [],
    nonVegPreferredFoods: input.customer.nonVegPreferredFoods ?? [],
    culture: input.culture,
  });
}

function dailyPlanCacheKey(input: {
  userId: string;
  targetDate: string;
  mealTime: MealTime;
  signature: string;
}) {
  return `${input.userId}|${input.targetDate}|${input.mealTime}|${input.signature}`;
}

function attendanceSignatureForSchedule(schedule: MealAttendanceDraft) {
  return JSON.stringify(
    Object.fromEntries(
      dailyScheduleMealTimes.map((mealTime) => [
        mealTime,
        {
          participatingMemberIds: [...(schedule[mealTime]?.participatingMemberIds ?? [])].sort(),
          tiffinMemberIds: [...(schedule[mealTime]?.tiffinMemberIds ?? [])].sort(),
        },
      ])
    )
  );
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

function readCachedMealPlan(cacheKey: string, expected: { targetDate: string; mealTime: MealTime; signature: string }): FamilyMealPlan | null {
  try {
    const raw = window.localStorage.getItem(DAILY_PLAN_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { savedAt: string; signature?: string; mealPlan: FamilyMealPlan }>;
    const entry = cache[cacheKey];
    if (!entry?.mealPlan) return null;
    if (entry.signature !== expected.signature) return null;
    if (entry.mealPlan.targetDate !== expected.targetDate) return null;
    if (entry.mealPlan.commonMeal.mealTime !== expected.mealTime) return null;
    const ageMs = Date.now() - new Date(entry.savedAt).getTime();
    return ageMs < 24 * 60 * 60 * 1000 ? entry.mealPlan : null;
  } catch {
    return null;
  }
}

function writeCachedMealPlan(cacheKey: string, mealPlan: FamilyMealPlan, signature: string) {
  try {
    const raw = window.localStorage.getItem(DAILY_PLAN_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as Record<string, { savedAt: string; signature?: string; mealPlan: FamilyMealPlan }>) : {};
    const nextCache = Object.fromEntries(Object.entries(cache).slice(-24));
    nextCache[cacheKey] = { savedAt: new Date().toISOString(), signature, mealPlan };
    window.localStorage.setItem(DAILY_PLAN_CACHE_KEY, JSON.stringify(nextCache));
  } catch {
    // Cache write error ignored
  }
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
  const [autoMealTime, setAutoMealTime] = useState<MealTime>(() => nextMealTimeForHour(currentLocalHour()));
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>(() => nextMealTimeForHour(currentLocalHour()));
  const [mealAttendance, setMealAttendance] = useState<MealAttendanceDraft>(() => emptyAttendanceDraft());

  // Plan Lifecycle State
  const [mealPlan, setMealPlan] = useState<FamilyMealPlan | null>(null);
  const [isStalePlan, setIsStalePlan] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [mealWish, setMealWish] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReplacingMeal, setIsReplacingMeal] = useState(false);
  const [isLoadingServerProfile, setIsLoadingServerProfile] = useState(true);
  const [lastPlan, setLastPlan] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [videoSearch, setVideoSearch] = useState<RecipeVideoSearchResponse | null>(null);
  const [videoStatus, setVideoStatus] = useState('');

  const remainingMealTimes = useMemo(() => remainingMealTimesForHour(currentLocalHour()), []);

  // 1. Resolve Local Time on Mount
  useEffect(() => {
    const nextSlot = nextMealTimeForHour(currentLocalHour());
    setAutoMealTime(nextSlot);
    if (plannerMode === 'next_meal') {
      setSelectedMealTime(nextSlot);
    }
  }, [plannerMode]);

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

      // Check current plan and validate against today's date
      const savedPlanRaw = window.localStorage.getItem(CURRENT_MEAL_PLAN_KEY);
      if (savedPlanRaw) {
        const parsedPlan: FamilyMealPlan = JSON.parse(savedPlanRaw);
        if (parsedPlan?.targetDate === todayLocalDate()) {
          setMealPlan(parsedPlan);
          setIsStalePlan(false);
        } else {
          setMealPlan(parsedPlan);
          setIsStalePlan(true); // Tag previous day's plan
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
          setCustomer(data.customer);
          window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data.customer));
        }

        if (Array.isArray(data.familyProfile?.members) && data.familyProfile.members.length) {
          const normalized = data.familyProfile.members.map((m: any) => ({
            id: m.memberId || m.id,
            name: m.name,
            relation: m.relationship || m.relation || 'Family member',
            age: m.age,
            activityLevel: m.activityLevel,
            foodPreference: m.dietType || m.foodPreference,
            allergies: m.allergies || [],
            doctorAdvisedRestrictions: m.doctorRestrictions || m.doctorAdvisedRestrictions || [],
            dislikes: m.dislikes || [],
          }));
          setMembers(normalized);
          window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        // Local state fallback active
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

  const activeMealSlot = plannerMode === 'next_meal' ? autoMealTime : selectedMealTime;

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

  const saveRegularWeekdayPattern = () => {
    try {
      window.localStorage.setItem(REGULAR_WEEKDAY_ATTENDANCE_KEY, JSON.stringify(mealAttendance));
      setStatus(t.scheduleSaved);
    } catch {
      setStatus('');
    }
  };

  const loadStoredAttendance = (storageKey: string) => {
    try {
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
    setStatus(t.generating);
    setVideoSearch(null);
    setVideoStatus('');

    try {
      const userId = customer.userId || `customer_${Date.now()}`;
      const targetDate = todayLocalDate();
      const activeAttendance = mealAttendance[activeMealSlot] ?? {
        participatingMemberIds: members.map((member) => member.id),
        tiffinMemberIds: [],
      };

      const country = culture.country?.trim() || 'India';
      const region = culture.region?.trim() || 'Karnataka';
      const city = culture.city?.trim() || region;
      const cuisinePreferences = Array.from(
        new Set([
          ...(culture.preferredCuisines?.filter(Boolean) ?? []),
          ...(Object.values(customer.mealTypePreferences ?? {}).flat().filter(Boolean) as string[]),
          customer.cookingHabit ?? 'fresh_home_cooked',
        ])
      ).slice(0, 12);

      // Create/Sync Family Context
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

      const familyData = await familyResponse.json();
      if (!familyResponse.ok) {
        throw new Error(familyData.error?.message || 'Unable to prepare family profile for planning.');
      }

      const createdMembers = familyData.members ?? [];
      const excludeDishes = mealPlan?.commonMeal?.name ? [mealPlan.commonMeal.name] : [];

      // Generate Fresh Meal Plan
      const mealResponse = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: familyData.family.familyId,
          planType: 'daily',
          mealTime: activeMealSlot,
          userPromptOverride: cravingOverride || mealWish,
          excludeDishes,
          userLocalTime: new Date().toISOString(),
          userTimeZone: browserTimeZone(),
          targetDate,
          mealAttendance: [
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
              guestCount: 0,
              enabled: true,
            },
          ],
        }),
      });

      const mealData = await mealResponse.json();
      if (!mealResponse.ok) {
        throw new Error(mealData.error?.message || 'Unable to generate family food plan.');
      }

      const pantryAdjustedPlan = adjustGroceryForPantry(mealData.mealPlan, pantryItems, t.alreadyInPantry, language);
      setMealPlan(pantryAdjustedPlan);
      setIsStalePlan(false);
      window.localStorage.setItem(CURRENT_MEAL_PLAN_KEY, JSON.stringify(pantryAdjustedPlan));
      window.localStorage.setItem(LAST_PLAN_KEY, suggestedPlan);
      setLastPlan(suggestedPlan);

      trackAnalyticsEvent('meal_plan_generated', {
        category: suggestedPlan,
        label: activeMealSlot,
      });
      setStatus(t.success);
    } catch (err: any) {
      setStatus('');
      setError(err.message || 'Unable to generate family food plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 8. Single-Slot Meal Replacement
  const handleShowAnotherOption = async (userCraving?: string) => {
    if (!mealPlan) return;
    setIsReplacingMeal(true);
    setError('');

    try {
      const res = await fetch('/api/meal-plan/replace-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: mealPlan.familyId,
          mealPlanId: mealPlan.mealPlanId,
          rejectedDish: mealPlan.commonMeal.name,
          targetSlot: activeMealSlot,
          userPromptOverride: userCraving || mealWish,
          language,
        }),
      });

      if (!res.ok) throw new Error('Replacement failed');
      const data = await res.json();
      const updatedPlan = adjustGroceryForPantry(data.mealPlan, pantryItems, t.alreadyInPantry, language);
      setMealPlan(updatedPlan);
      setIsStalePlan(false);
      window.localStorage.setItem(CURRENT_MEAL_PLAN_KEY, JSON.stringify(updatedPlan));
      setStatus(t.anotherOptionSuccess);
    } catch (err: any) {
      setError(err.message || 'Could not find another option');
    } finally {
      setIsReplacingMeal(false);
    }
  };

  const handleSelectAlternative = (alt: MealAlternativeOption) => {
    if (!mealPlan) return;
    const updated: FamilyMealPlan = {
      ...mealPlan,
      commonMeal: {
        ...mealPlan.commonMeal,
        name: alt.title,
        description: alt.description,
        prepTimeMinutes: alt.prepTimeMinutes,
      },
    };
    setMealPlan(updated);
    window.localStorage.setItem(CURRENT_MEAL_PLAN_KEY, JSON.stringify(updated));
  };

  // 9. Recipe Video Search
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
        country: culture.country?.trim() || 'India',
        region: culture.region?.trim() || 'Karnataka',
        preferredLanguage: language,
        cuisine: culture.preferredCuisines?.length ? culture.preferredCuisines : ['Home-style'],
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

              {/* Meal Selection Controls */}
              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">{t.meal}</span>
                  <select
                    value={selectedMealTime}
                    onChange={(event) => {
                      setPlannerMode('specific_meal');
                      setSelectedMealTime(event.target.value as MealTime);
                    }}
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
                  onClick={() => generatePlan()}
                  disabled={isGenerating}
                  className="rounded-2xl bg-emerald-800 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-900 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.generating}</span>
                    </>
                  ) : (
                    <span>{t.generate}</span>
                  )}
                </button>
              </div>

              {/* Planning Mode Selector */}
              <div className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div>
                  <p className="text-sm font-black text-slate-800">{t.plannerMode}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPlannerMode('next_meal');
                        setSelectedMealTime(nextMealTimeForHour(currentLocalHour()));
                      }}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 ${plannerMode === 'next_meal'
                        ? 'bg-emerald-800 text-white ring-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 ring-slate-200'
                        }`}
                    >
                      {t.nextMealMode}
                      <span className="mt-1 block text-xs opacity-80">
                        {t.selectedByTime}: {mealLabel(nextMealTimeForHour(currentLocalHour()), t.meals)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlannerMode('specific_meal')}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ring-1 ${plannerMode === 'specific_meal'
                        ? 'bg-emerald-800 text-white ring-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 ring-slate-200'
                        }`}
                    >
                      {t.specificMealMode}
                      <span className="mt-1 block text-xs opacity-80">
                        {remainingMealTimes.map((mealTime) => mealLabel(mealTime, t.meals)).join(' | ')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Today Attendance Matrix */}
                <div>
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
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {dailyScheduleMealTimes.map((mealTime) => {
                      const entry = mealAttendance[mealTime] ?? { participatingMemberIds: [], tiffinMemberIds: [] };
                      return (
                        <article key={`schedule-${mealTime}`} className={`rounded-2xl p-4 ring-1 ${mealTime === activeMealSlot ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'
                          }`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setPlannerMode('specific_meal');
                                setSelectedMealTime(mealTime);
                              }}
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
                </div>
              </div>
            </section>

            {status ? (
              <p className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{status}</p>
            ) : null}
            {error ? (
              <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>
            ) : null}

            {/* Stale Cache Alert */}
            {isStalePlan && mealPlan && (
              <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between">
                <span className="text-xs text-amber-900 font-medium">{t.staleWarning}</span>
                <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-1 rounded-full">
                  {t.staleBadge} ({mealPlan.targetDate})
                </span>
              </div>
            )}

            {/* Render Output Meal Plan */}
            {mealPlan && (
              <section className="space-y-6">
                <MealCard
                  dishName={mealPlan.commonMeal.name}
                  description={mealPlan.commonMeal.description}
                  prepTimeMinutes={mealPlan.commonMeal.prepTimeMinutes}
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

                    {/* YouTube Video Assist */}
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
                              className="rounded-xl bg-white p-3 text-sm font-semibold text-emerald-950 ring-1 ring-emerald-100 block"
                            >
                              {video.sponsored ? <span className="mb-1 block text-xs uppercase text-amber-700">{t.sponsoredVideo}</span> : null}
                              <span>{video.title}</span>
                              <small className="mt-1 block text-slate-600">
                                {video.channelTitle} {video.language ? `| ${videoLanguageLabel(video.language, language)}` : ''}
                              </small>
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>

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
          </>
        )}
      </div>
    </main>
  );
}