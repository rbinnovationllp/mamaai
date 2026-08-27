'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';
import type {
  ActivityLevel,
  DayFoodPreference,
  DayWiseFoodRoutinePreference,
  MealSlot,
  WeeklyFoodRoutineStatus,
} from '@/lib/shared/contracts';

export interface FamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  age?: number;
  activityLevel?: ActivityLevel;
  foodPreference?: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'semi_vegetarian' | 'vegan' | 'other';
  nonVegFrequency?: 'occasionally' | '1_2_days_per_week' | '3_4_days_per_week' | '4_5_days_per_week' | 'most_days' | 'custom';
  nonVegAvoidDays?: string[];
  nonVegCustomRule?: string;
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: 'common' | 'allow_separate';
}

type HouseholdFoodPreference = 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'semi_vegetarian' | 'vegan' | 'mixed' | 'other';
type CookingHabit = 'fresh_home_cooked' | 'ready_frozen' | 'fresh_ready_mix' | 'takeaway_prepared' | 'other';
type NonVegFrequency = NonNullable<FamilyMemberProfile['nonVegFrequency']>;
type MealPreferenceInputs = Record<MealSlot, string>;
type NonVegFoodOption = 'chicken' | 'fish' | 'eggs' | 'mutton_goat' | 'seafood';

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';
const FAMILY_PROFILE_DRAFT_KEY = 'mamaai_family_profile_draft_v1';

const copy = {
  en: {
    title: 'Create Family Profile',
    subtitle:
      'Add each household member so MAMAAI can plan meals around allergies, health needs, dislikes and family preferences.',
    name: 'Member name',
    relation: 'Relation',
    age: 'Age',
    ageHint: 'Example: 33',
    activity: 'Activity level',
    allergies: 'Medical allergies',
    allergiesHint: 'Example: peanuts, milk, gluten',
    doctor: 'Doctor restrictions',
    doctorHint: 'Example: low sodium, diabetic friendly',
    dislikes: 'Taste dislikes',
    dislikesHint: 'Example: karela, mushroom',
    strategy: 'Meal Strategy Preference',
    memberFood: 'Member food preference',
    householdFood: 'Household food preference',
    cookingHabit: 'How does your family usually prepare meals?',
    nonVegFrequency: 'How often does this member prefer non-vegetarian food?',
    nonVegAvoidDays: 'Days this member avoids non-vegetarian food',
    nonVegCustomRule: 'Other non-veg rule',
    noFixedRestriction: 'No fixed restriction',
    routineTitle: 'Optional family food routine',
    routineQuestion: 'Does your family normally follow any preferred food routine or day-wise meal schedule?',
    routineHelp: 'Use this only if your family already has regular day-wise habits. You can edit it later.',
    routineStatusOptions: {
      add: 'Yes, I would like to add it',
      no_fixed_routine: 'No fixed routine',
      skip: 'Skip for now',
    },
    editRoutine: 'Edit Family Food Routine',
    dayPreference: 'Day preference',
    mealPreferences: 'Meal-level preferences (optional)',
    note: 'Short note',
    notePlaceholder: 'Example: family normally prefers chicken for Sunday lunch',
    mealSlots: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      snacks: 'Snacks',
      dinner: 'Dinner',
    },
    routineOptions: {
      vegetarian: 'Vegetarian',
      non_vegetarian: 'Non-Vegetarian',
      eggetarian: 'Eggetarian',
      vegan: 'Vegan',
      light_meal: 'Light meal',
      fasting_vrat: 'Fasting / Vrat',
      special_family_meal: 'Special family meal',
      eating_out_takeaway: 'Eating out / Takeaway',
      ready_frozen: 'Ready/Frozen meal preferred',
      no_preference: 'No particular preference',
      custom: 'Custom preference',
    },
    usualFoodTitle: 'What kinds of food does your family usually prefer?',
    usualFoodHelp: 'Optional but recommended. Write examples your family actually likes; location is only supporting context.',
    mealPreferenceHints: {
      breakfast: 'Example: idli, poha, eggs, oats, toast',
      lunch: 'Example: North Indian, Bengali, pasta, rice bowl, mixed',
      dinner: 'Example: light vegetarian, dal-rice, chicken curry, soup',
      snacks: 'Example: fruit, chilla, sandwich, high tea, takeaway',
    },
    nonVegFoodTitle: 'Which non-vegetarian foods do you prefer?',
    nonVegFoodHelp: 'Select only what your family actually eats. Sensitive/custom foods can be added under Other.',
    nonVegFoodOptions: {
      chicken: 'Chicken',
      fish: 'Fish',
      eggs: 'Eggs',
      mutton_goat: 'Mutton / Goat',
      seafood: 'Seafood',
    },
    otherNonVeg: 'Other preferred non-vegetarian foods',
    otherNonVegPlaceholder: 'Example: duck, shellfish, or another family preference',
    addOtherFood: '+ Add another food item',
    commonMeal: 'Prefer One Common Family Meal',
    separateMeal: 'Allow Separate / Alternative Meal',
    foodOptions: {
      vegetarian: 'Vegetarian',
      eggetarian: 'Eggetarian',
      non_vegetarian: 'Non-Vegetarian',
      semi_vegetarian: 'Mostly Vegetarian / Semi-Vegetarian',
      vegan: 'Vegan - no meat, eggs, milk or dairy',
      mixed: 'Mixed household preferences',
      other: 'Other / Custom Preference',
    },
    cookingOptions: {
      fresh_home_cooked: 'Mostly cook fresh meals at home',
      ready_frozen: 'Mostly use ready-made / frozen cooked meals',
      fresh_ready_mix: 'Mix of fresh cooking and ready-made / frozen foods',
      takeaway_prepared: 'Mostly buy prepared meals / takeaway',
      other: 'Other',
    },
    activityOptions: {
      sedentary: 'Sedentary',
      light: 'Light',
      moderate: 'Moderate',
      heavy: 'Heavy',
      athlete: 'Athlete',
    },
    nonVegFrequencyOptions: {
      occasionally: 'Occasionally',
      '1_2_days_per_week': '1-2 days per week',
      '3_4_days_per_week': '3-4 days per week',
      '4_5_days_per_week': '4-5 days per week',
      most_days: 'Most days',
      custom: 'Custom',
    },
    weekdays: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },
    add: 'Add Member Profile',
    accountTitle: 'Your account details',
    accountText: 'Used to save this family profile and connect it with your subscription.',
    customerName: 'Your name',
    customerMobile: 'Mobile number',
    customerEmail: 'Email address',
    saveContinue: 'Save Family & Continue',
    saving: 'Saving...',
    saved: 'Family profile saved. Opening subscription options...',
    configured: 'Configured Household Members',
    empty: 'No family members added yet. Add your first member to continue.',
    remove: 'Remove',
    nextTitle: 'Next: choose a plan for this household',
    nextText:
      'Your family profile is ready. Continue to subscription and choose the plan that fits this household.',
    recommended: 'Suggested plan',
    continue: 'View checkout options',
    demo: 'Open home demo',
    clear: 'Clear saved household',
    savedNote: 'Only members you add here are shown. Demo data is not used in this flow.',
  },
  hi: {
    title: 'Family Profile बनाएं',
    subtitle:
      'हर household member को जोड़ें ताकि MAMAAI allergies, health needs, dislikes और preferences के अनुसार meal plan बना सके.',
    name: 'Member name',
    relation: 'Relation',
    age: 'उम्र',
    ageHint: 'उदाहरण: 33',
    activity: 'गतिविधि स्तर',
    allergies: 'Medical allergies',
    allergiesHint: 'Example: peanuts, milk, gluten',
    doctor: 'Doctor restrictions',
    doctorHint: 'Example: low sodium, diabetic friendly',
    dislikes: 'Taste dislikes',
    dislikesHint: 'Example: karela, mushroom',
    strategy: 'Meal Strategy Preference',
    memberFood: 'Member food preference',
    householdFood: 'Household food preference',
    cookingHabit: 'आपका परिवार आम तौर पर meals कैसे prepare करता है?',
    nonVegFrequency: 'यह member सामान्य रूप से non-veg कितनी बार पसंद करता है?',
    nonVegAvoidDays: 'कौन से दिन यह member non-veg avoid करता है?',
    nonVegCustomRule: 'अन्य non-veg rule',
    noFixedRestriction: 'कोई fixed restriction नहीं',
    routineTitle: 'Optional family food routine',
    routineQuestion: 'क्या आपका परिवार कोई preferred day-wise food routine follow करता है?',
    routineHelp: 'यह optional है. अगर आपके घर की regular day-wise habit है तो add करें, बाद में edit कर सकते हैं.',
    routineStatusOptions: {
      add: 'Yes, I would like to add it',
      no_fixed_routine: 'No fixed routine',
      skip: 'अभी skip करें',
    },
    editRoutine: 'Family Food Routine edit करें',
    dayPreference: 'Day preference',
    mealPreferences: 'Meal-level preferences (optional)',
    note: 'Short note',
    notePlaceholder: 'Example: Sunday lunch में family chicken पसंद करती है',
    mealSlots: {
      breakfast: 'नाश्ता',
      lunch: 'दोपहर का भोजन',
      snacks: 'स्नैक्स',
      dinner: 'रात का खाना',
    },
    routineOptions: {
      vegetarian: 'शाकाहारी',
      non_vegetarian: 'मांसाहारी',
      eggetarian: 'अंडा खाते हैं / Eggetarian',
      vegan: 'Vegan',
      light_meal: 'हल्का भोजन',
      fasting_vrat: 'उपवास / व्रत',
      special_family_meal: 'Special family meal',
      eating_out_takeaway: 'Eating out / Takeaway',
      ready_frozen: 'Ready/Frozen meal preferred',
      no_preference: 'No particular preference',
      custom: 'Custom preference',
    },
    usualFoodTitle: 'आपका परिवार आम तौर पर किस तरह का खाना पसंद करता है?',
    usualFoodHelp: 'Optional but recommended. परिवार की वास्तविक पसंद लिखें; location केवल context है.',
    mealPreferenceHints: {
      breakfast: 'Example: idli, poha, eggs, oats, toast',
      lunch: 'Example: North Indian, Bengali, pasta, rice bowl, mixed',
      dinner: 'Example: light vegetarian, dal-rice, chicken curry, soup',
      snacks: 'Example: fruit, chilla, sandwich, high tea, takeaway',
    },
    nonVegFoodTitle: 'आप कौन से non-vegetarian foods prefer करते हैं?',
    nonVegFoodHelp: 'केवल वही चुनें जो परिवार सच में खाता है. Sensitive/custom foods Other में जोड़ें.',
    nonVegFoodOptions: {
      chicken: 'Chicken',
      fish: 'Fish',
      eggs: 'Eggs',
      mutton_goat: 'Mutton / Goat',
      seafood: 'Seafood',
    },
    otherNonVeg: 'Other preferred non-vegetarian foods',
    otherNonVegPlaceholder: 'Example: duck, shellfish, or another family preference',
    addOtherFood: '+ Add another food item',
    commonMeal: 'Prefer One Common Family Meal',
    separateMeal: 'Allow Separate / Alternative Meal',
    foodOptions: {
      vegetarian: 'शाकाहारी',
      eggetarian: 'अंडा खाते हैं / Eggetarian',
      non_vegetarian: 'मांसाहारी',
      semi_vegetarian: 'ज्यादातर शाकाहारी / Semi-Vegetarian',
      vegan: 'Vegan - meat, egg, milk या dairy नहीं',
      mixed: 'घर में अलग-अलग food preferences',
      other: 'Other / Custom Preference',
    },
    cookingOptions: {
      fresh_home_cooked: 'ज्यादातर ताजा घर का खाना',
      ready_frozen: 'ज्यादातर ready-made / frozen cooked meals',
      fresh_ready_mix: 'Fresh cooking और ready-made / frozen foods का mix',
      takeaway_prepared: 'ज्यादातर prepared meals / takeaway',
      other: 'Other',
    },
    activityOptions: {
      sedentary: 'कम सक्रिय',
      light: 'हल्की activity',
      moderate: 'मध्यम activity',
      heavy: 'अधिक activity',
      athlete: 'Athlete',
    },
    nonVegFrequencyOptions: {
      occasionally: 'कभी-कभी',
      '1_2_days_per_week': 'सप्ताह में 1-2 दिन',
      '3_4_days_per_week': 'सप्ताह में 3-4 दिन',
      '4_5_days_per_week': 'सप्ताह में 4-5 दिन',
      most_days: 'अधिकतर दिन',
      custom: 'Custom',
    },
    weekdays: {
      monday: 'सोमवार',
      tuesday: 'मंगलवार',
      wednesday: 'बुधवार',
      thursday: 'गुरुवार',
      friday: 'शुक्रवार',
      saturday: 'शनिवार',
      sunday: 'रविवार',
    },
    add: 'Add Member Profile',
    accountTitle: 'Your account details',
    accountText: 'इससे आपका family profile और subscription एक ही account से जुड़ेंगे.',
    customerName: 'Your name',
    customerMobile: 'Mobile number',
    customerEmail: 'Email address',
    saveContinue: 'Save Family & Continue',
    saving: 'Saving...',
    saved: 'Family profile saved. Subscription options खुल रहे हैं...',
    configured: 'Configured Household Members',
    empty: 'अभी कोई family member add नहीं है. Continue करने के लिए पहला member add करें.',
    remove: 'Remove',
    nextTitle: 'Next: इस household के लिए plan चुनें',
    nextText:
      'आपका family profile ready है. Subscription पर continue करके इस household के लिए सही plan चुनें.',
    recommended: 'Suggested plan',
    continue: 'View checkout options',
    demo: 'Home demo खोलें',
    clear: 'Clear saved household',
    savedNote: 'यहां केवल वही members दिखेंगे जिन्हें आप add करेंगे. Demo data इस flow में use नहीं होता.',
  },
  kn: {
    title: 'Family Profile ರಚಿಸಿ',
    subtitle:
      'Allergies, health needs, dislikes ಮತ್ತು preferences ಪ್ರಕಾರ MAMAAI meal plan ಮಾಡಲು household members ಸೇರಿಸಿ.',
    name: 'Member name',
    relation: 'Relation',
    age: 'ವಯಸ್ಸು',
    ageHint: 'ಉದಾಹರಣೆ: 33',
    activity: 'ಚಟುವಟಿಕೆ ಮಟ್ಟ',
    allergies: 'Medical allergies',
    allergiesHint: 'Example: peanuts, milk, gluten',
    doctor: 'Doctor restrictions',
    doctorHint: 'Example: low sodium, diabetic friendly',
    dislikes: 'Taste dislikes',
    dislikesHint: 'Example: karela, mushroom',
    strategy: 'Meal Strategy Preference',
    memberFood: 'Member food preference',
    householdFood: 'Household food preference',
    cookingHabit: 'ನಿಮ್ಮ ಕುಟುಂಬ ಸಾಮಾನ್ಯವಾಗಿ meals ಹೇಗೆ prepare ಮಾಡುತ್ತದೆ?',
    nonVegFrequency: 'ಈ member ಸಾಮಾನ್ಯವಾಗಿ non-veg ಎಷ್ಟು ಬಾರಿ ಇಷ್ಟಪಡುತ್ತಾರೆ?',
    nonVegAvoidDays: 'ಈ member non-veg ತಪ್ಪಿಸುವ ದಿನಗಳು',
    nonVegCustomRule: 'ಇತರೆ non-veg rule',
    noFixedRestriction: 'ನಿಶ್ಚಿತ restriction ಇಲ್ಲ',
    routineTitle: 'Optional family food routine',
    routineQuestion: 'ನಿಮ್ಮ ಕುಟುಂಬ preferred day-wise food routine follow ಮಾಡುತ್ತದೆಯೇ?',
    routineHelp: 'ಇದು optional. ಮನೆಯ regular day-wise habit ಇದ್ದರೆ add ಮಾಡಿ, ನಂತರ edit ಮಾಡಬಹುದು.',
    routineStatusOptions: {
      add: 'Yes, I would like to add it',
      no_fixed_routine: 'No fixed routine',
      skip: 'ಈಗ skip ಮಾಡಿ',
    },
    editRoutine: 'Family Food Routine edit ಮಾಡಿ',
    dayPreference: 'Day preference',
    mealPreferences: 'Meal-level preferences (optional)',
    note: 'Short note',
    notePlaceholder: 'Example: Sunday lunch ಗೆ family chicken ಇಷ್ಟಪಡುತ್ತದೆ',
    mealSlots: {
      breakfast: 'ಉಪಹಾರ',
      lunch: 'ಮಧ್ಯಾಹ್ನದ ಊಟ',
      snacks: 'ತಿಂಡಿ',
      dinner: 'ರಾತ್ರಿ ಊಟ',
    },
    routineOptions: {
      vegetarian: 'ಸಸ್ಯಾಹಾರಿ',
      non_vegetarian: 'ಮಾಂಸಾಹಾರಿ',
      eggetarian: 'ಮೊಟ್ಟೆ ತಿನ್ನುವವರು / Eggetarian',
      vegan: 'Vegan',
      light_meal: 'ಹಗುರ ಊಟ',
      fasting_vrat: 'ಉಪವಾಸ / ವ್ರತ',
      special_family_meal: 'Special family meal',
      eating_out_takeaway: 'Eating out / Takeaway',
      ready_frozen: 'Ready/Frozen meal preferred',
      no_preference: 'No particular preference',
      custom: 'Custom preference',
    },
    usualFoodTitle: 'ನಿಮ್ಮ ಕುಟುಂಬ ಸಾಮಾನ್ಯವಾಗಿ ಯಾವ ರೀತಿಯ ಆಹಾರ ಇಷ್ಟಪಡುತ್ತದೆ?',
    usualFoodHelp: 'Optional but recommended. ಕುಟುಂಬದ ನಿಜವಾದ ಇಷ್ಟಗಳನ್ನು ಬರೆಯಿರಿ; location ಕೇವಲ context.',
    mealPreferenceHints: {
      breakfast: 'Example: idli, poha, eggs, oats, toast',
      lunch: 'Example: North Indian, Bengali, pasta, rice bowl, mixed',
      dinner: 'Example: light vegetarian, dal-rice, chicken curry, soup',
      snacks: 'Example: fruit, chilla, sandwich, high tea, takeaway',
    },
    nonVegFoodTitle: 'ನೀವು ಯಾವ non-vegetarian foods prefer ಮಾಡುತ್ತೀರಿ?',
    nonVegFoodHelp: 'ಕುಟುಂಬ ನಿಜವಾಗಿ ತಿನ್ನುವುದನ್ನೇ ಆಯ್ಕೆಮಾಡಿ. Sensitive/custom foods ಅನ್ನು Other ನಲ್ಲಿ ಸೇರಿಸಿ.',
    nonVegFoodOptions: {
      chicken: 'Chicken',
      fish: 'Fish',
      eggs: 'Eggs',
      mutton_goat: 'Mutton / Goat',
      seafood: 'Seafood',
    },
    otherNonVeg: 'Other preferred non-vegetarian foods',
    otherNonVegPlaceholder: 'Example: duck, shellfish, or another family preference',
    addOtherFood: '+ Add another food item',
    commonMeal: 'Prefer One Common Family Meal',
    separateMeal: 'Allow Separate / Alternative Meal',
    foodOptions: {
      vegetarian: 'ಸಸ್ಯಾಹಾರಿ',
      eggetarian: 'ಮೊಟ್ಟೆ ತಿನ್ನುವವರು / Eggetarian',
      non_vegetarian: 'ಮಾಂಸಾಹಾರಿ',
      semi_vegetarian: 'ಹೆಚ್ಚಾಗಿ ಸಸ್ಯಾಹಾರಿ / Semi-Vegetarian',
      vegan: 'Vegan - meat, egg, milk ಅಥವಾ dairy ಇಲ್ಲ',
      mixed: 'ಮನೆಯಲ್ಲಿ ಬೇರೆ ಬೇರೆ food preferences',
      other: 'Other / Custom Preference',
    },
    cookingOptions: {
      fresh_home_cooked: 'ಹೆಚ್ಚಾಗಿ ತಾಜಾ ಮನೆಯಲ್ಲಿ ಅಡುಗೆ',
      ready_frozen: 'ಹೆಚ್ಚಾಗಿ ready-made / frozen cooked meals',
      fresh_ready_mix: 'Fresh cooking ಮತ್ತು ready-made / frozen foods mix',
      takeaway_prepared: 'ಹೆಚ್ಚಾಗಿ prepared meals / takeaway',
      other: 'Other',
    },
    activityOptions: {
      sedentary: 'ಕಡಿಮೆ ಚಟುವಟಿಕೆ',
      light: 'ಹಗುರ ಚಟುವಟಿಕೆ',
      moderate: 'ಮಧ್ಯಮ ಚಟುವಟಿಕೆ',
      heavy: 'ಹೆಚ್ಚು ಚಟುವಟಿಕೆ',
      athlete: 'Athlete',
    },
    nonVegFrequencyOptions: {
      occasionally: 'ಕೆಲವೊಮ್ಮೆ',
      '1_2_days_per_week': 'ವಾರಕ್ಕೆ 1-2 ದಿನ',
      '3_4_days_per_week': 'ವಾರಕ್ಕೆ 3-4 ದಿನ',
      '4_5_days_per_week': 'ವಾರಕ್ಕೆ 4-5 ದಿನ',
      most_days: 'ಹೆಚ್ಚಿನ ದಿನಗಳು',
      custom: 'Custom',
    },
    weekdays: {
      monday: 'ಸೋಮವಾರ',
      tuesday: 'ಮಂಗಳವಾರ',
      wednesday: 'ಬುಧವಾರ',
      thursday: 'ಗುರುವಾರ',
      friday: 'ಶುಕ್ರವಾರ',
      saturday: 'ಶನಿವಾರ',
      sunday: 'ಭಾನುವಾರ',
    },
    add: 'Add Member Profile',
    accountTitle: 'Your account details',
    accountText: 'ಇದರಿಂದ family profile ಮತ್ತು subscription ಒಂದೇ account ಗೆ ಜೋಡಿಸಲಾಗುತ್ತದೆ.',
    customerName: 'Your name',
    customerMobile: 'Mobile number',
    customerEmail: 'Email address',
    saveContinue: 'Save Family & Continue',
    saving: 'Saving...',
    saved: 'Family profile saved. Subscription options ತೆರೆಯುತ್ತಿದೆ...',
    configured: 'Configured Household Members',
    empty: 'ಇನ್ನೂ family member add ಮಾಡಿಲ್ಲ. Continue ಮಾಡಲು ಮೊದಲ member add ಮಾಡಿ.',
    remove: 'Remove',
    nextTitle: 'Next: ಈ household ಗೆ plan ಆಯ್ಕೆಮಾಡಿ',
    nextText:
      'ನಿಮ್ಮ family profile ready ಆಗಿದೆ. Subscription ಗೆ continue ಮಾಡಿ ಸರಿಯಾದ plan ಆಯ್ಕೆಮಾಡಿ.',
    recommended: 'Suggested plan',
    continue: 'View checkout options',
    demo: 'Home demo ತೆರೆಯಿರಿ',
    clear: 'Clear saved household',
    savedNote: 'ಇಲ್ಲಿ ನೀವು add ಮಾಡಿದ members ಮಾತ್ರ ಕಾಣುತ್ತಾರೆ. Demo data ಈ flow ನಲ್ಲಿ use ಆಗುವುದಿಲ್ಲ.',
  },
};

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSuggestedPlan(memberCount: number): string {
  if (memberCount >= 7) return 'Family Plus - Rs. 999';
  if (memberCount >= 5) return 'Family Premium - Rs. 599';
  return 'Family Starter - Rs. 399';
}

const weekdayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const nonVegFoodPreferences = new Set(['non_vegetarian', 'semi_vegetarian', 'eggetarian']);
const routinePreferenceOptions: DayFoodPreference[] = [
  'no_preference',
  'vegetarian',
  'non_vegetarian',
  'eggetarian',
  'vegan',
  'light_meal',
  'fasting_vrat',
  'special_family_meal',
  'eating_out_takeaway',
  'ready_frozen',
  'custom',
];
const mealSlotOptions: MealSlot[] = ['breakfast', 'lunch', 'snacks', 'dinner'];
const nonVegFoodOptions: NonVegFoodOption[] = ['chicken', 'fish', 'eggs', 'mutton_goat', 'seafood'];

function defaultMealPreferenceInputs(): MealPreferenceInputs {
  return { breakfast: '', lunch: '', snacks: '', dinner: '' };
}

function mealPreferenceInputsFromSaved(saved: unknown): MealPreferenceInputs {
  const source = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  return {
    breakfast: Array.isArray(source.breakfast) ? source.breakfast.join(', ') : '',
    lunch: Array.isArray(source.lunch) ? source.lunch.join(', ') : '',
    snacks: Array.isArray(source.snacks) ? source.snacks.join(', ') : '',
    dinner: Array.isArray(source.dinner) ? source.dinner.join(', ') : '',
  };
}

function cleanMealTypePreferences(inputs: MealPreferenceInputs) {
  return Object.fromEntries(
    mealSlotOptions.map((slot) => [slot, splitCsv(inputs[slot])])
  );
}

function defaultWeeklyRoutine(): DayWiseFoodRoutinePreference[] {
  return weekdayOptions.map((day) => ({
    day,
    preference: 'no_preference',
    note: '',
    meals: {},
  }));
}

function mergeWeeklyRoutine(saved: unknown): DayWiseFoodRoutinePreference[] {
  const savedEntries = Array.isArray(saved) ? saved : [];
  return weekdayOptions.map((day) => {
    const match = savedEntries.find((entry) => entry?.day === day);
    return {
      day,
      preference: routinePreferenceOptions.includes(match?.preference)
        ? match.preference
        : 'no_preference',
      note: typeof match?.note === 'string' ? match.note : '',
      meals: typeof match?.meals === 'object' && match?.meals ? match.meals : {},
    };
  });
}

function cleanWeeklyRoutine(entries: DayWiseFoodRoutinePreference[]) {
  return entries.map((entry) => ({
    day: entry.day,
    preference: entry.preference,
    note: entry.note?.trim() || undefined,
    meals: Object.fromEntries(
      Object.entries(entry.meals ?? {}).filter(([, value]) => value && value !== 'no_preference')
    ),
  }));
}

const inputClassName =
  'rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

export default function FamilyProfilePage() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;

  const [members, setMembers] = useState<FamilyMemberProfile[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [allergyInput, setAllergyInput] = useState('');
  const [doctorInput, setDoctorInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [memberFoodPreference, setMemberFoodPreference] =
    useState<NonNullable<FamilyMemberProfile['foodPreference']>>('vegetarian');
  const [householdFoodPreference, setHouseholdFoodPreference] =
    useState<HouseholdFoodPreference>('vegetarian');
  const [cookingHabit, setCookingHabit] = useState<CookingHabit>('fresh_home_cooked');
  const [weeklyFoodRoutineStatus, setWeeklyFoodRoutineStatus] =
    useState<WeeklyFoodRoutineStatus>('skip');
  const [weeklyFoodRoutine, setWeeklyFoodRoutine] =
    useState<DayWiseFoodRoutinePreference[]>(() => defaultWeeklyRoutine());
  const [mealPreferenceInputs, setMealPreferenceInputs] =
    useState<MealPreferenceInputs>(() => defaultMealPreferenceInputs());
  const [nonVegPreferredFoods, setNonVegPreferredFoods] = useState<string[]>([]);
  const [otherNonVegInput, setOtherNonVegInput] = useState('');
  const [nonVegFrequency, setNonVegFrequency] = useState<NonVegFrequency>('occasionally');
  const [nonVegAvoidDays, setNonVegAvoidDays] = useState<string[]>([]);
  const [nonVegCustomRule, setNonVegCustomRule] = useState('');
  const [formError, setFormError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [mealStrategy, setMealStrategy] =
    useState<FamilyMemberProfile['mealStrategyPreference']>('common');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMembers(parsed);
        }
      }

      const savedCustomer = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (savedCustomer) {
        const parsedCustomer = JSON.parse(savedCustomer);
        setCustomerName(String(parsedCustomer.name ?? ''));
        setCustomerMobile(String(parsedCustomer.mobile ?? ''));
        setCustomerEmail(String(parsedCustomer.email ?? ''));
        setWeeklyFoodRoutineStatus(parsedCustomer.weeklyFoodRoutineStatus ?? 'skip');
        setWeeklyFoodRoutine(mergeWeeklyRoutine(parsedCustomer.weeklyFoodRoutine));
        setMealPreferenceInputs(mealPreferenceInputsFromSaved(parsedCustomer.mealTypePreferences));
        setNonVegPreferredFoods(Array.isArray(parsedCustomer.nonVegPreferredFoods) ? parsedCustomer.nonVegPreferredFoods : []);
      }

      const savedDraft = window.localStorage.getItem(FAMILY_PROFILE_DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setName(String(draft.name ?? ''));
        setRelation(String(draft.relation ?? ''));
        setAgeInput(String(draft.ageInput ?? ''));
        setActivityLevel(draft.activityLevel ?? 'moderate');
        setAllergyInput(String(draft.allergyInput ?? ''));
        setDoctorInput(String(draft.doctorInput ?? ''));
        setDislikeInput(String(draft.dislikeInput ?? ''));
        setMemberFoodPreference(draft.memberFoodPreference ?? 'vegetarian');
        setHouseholdFoodPreference(draft.householdFoodPreference ?? 'vegetarian');
        setCookingHabit(draft.cookingHabit ?? 'fresh_home_cooked');
        setWeeklyFoodRoutineStatus(draft.weeklyFoodRoutineStatus ?? 'skip');
        setWeeklyFoodRoutine(mergeWeeklyRoutine(draft.weeklyFoodRoutine));
        setMealPreferenceInputs(draft.mealPreferenceInputs ?? defaultMealPreferenceInputs());
        setNonVegPreferredFoods(Array.isArray(draft.nonVegPreferredFoods) ? draft.nonVegPreferredFoods : []);
        setOtherNonVegInput(String(draft.otherNonVegInput ?? ''));
        setNonVegFrequency(draft.nonVegFrequency ?? 'occasionally');
        setNonVegAvoidDays(Array.isArray(draft.nonVegAvoidDays) ? draft.nonVegAvoidDays : []);
        setNonVegCustomRule(String(draft.nonVegCustomRule ?? ''));
        setCustomerName((current) => current || String(draft.customerName ?? ''));
        setCustomerMobile((current) => current || String(draft.customerMobile ?? ''));
        setCustomerEmail((current) => current || String(draft.customerEmail ?? ''));
        if (draft.mealStrategy === 'common' || draft.mealStrategy === 'allow_separate') {
          setMealStrategy(draft.mealStrategy);
        }
      }
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(members));
    } catch {
      // Local persistence is helpful, but the form should still work without it.
    }
  }, [members]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAMILY_PROFILE_DRAFT_KEY,
        JSON.stringify({
          name,
          relation,
          ageInput,
          activityLevel,
          allergyInput,
          doctorInput,
          dislikeInput,
          memberFoodPreference,
          householdFoodPreference,
          cookingHabit,
          weeklyFoodRoutineStatus,
          weeklyFoodRoutine,
          mealPreferenceInputs,
          nonVegPreferredFoods,
          otherNonVegInput,
          nonVegFrequency,
          nonVegAvoidDays,
          nonVegCustomRule,
          customerName,
          customerMobile,
          customerEmail,
          mealStrategy,
        })
      );
    } catch {
      // Draft persistence is helpful, but the page still works without it.
    }
  }, [
    name,
    relation,
    ageInput,
    activityLevel,
    allergyInput,
    doctorInput,
    dislikeInput,
    memberFoodPreference,
    householdFoodPreference,
    cookingHabit,
    weeklyFoodRoutineStatus,
    weeklyFoodRoutine,
    mealPreferenceInputs,
    nonVegPreferredFoods,
    otherNonVegInput,
    nonVegFrequency,
    nonVegAvoidDays,
    nonVegCustomRule,
    customerName,
    customerMobile,
    customerEmail,
    mealStrategy,
  ]);

  const suggestedPlan = useMemo(() => getSuggestedPlan(members.length), [members.length]);

  const handleAddMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanRelation = relation.trim();
    const parsedAge = Number(ageInput);

    if (!cleanName || !cleanRelation || !Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      setFormError('Please enter member name, relation and valid age before adding.');
      return;
    }

    setFormError('');
    if (!customerName.trim()) {
      setCustomerName(cleanName);
    }

    const newMember: FamilyMemberProfile = {
      id: `m_${Date.now()}`,
      name: cleanName,
      relation: cleanRelation,
      age: parsedAge,
      activityLevel,
      foodPreference: memberFoodPreference,
      nonVegFrequency: nonVegFoodPreferences.has(memberFoodPreference) ? nonVegFrequency : undefined,
      nonVegAvoidDays: nonVegFoodPreferences.has(memberFoodPreference) ? nonVegAvoidDays : [],
      nonVegCustomRule: nonVegFoodPreferences.has(memberFoodPreference) ? nonVegCustomRule.trim() || undefined : undefined,
      allergies: splitCsv(allergyInput),
      doctorAdvisedRestrictions: splitCsv(doctorInput),
      dislikes: splitCsv(dislikeInput),
      mealStrategyPreference: mealStrategy,
    };

    setMembers((current) => [...current, newMember]);

    setName('');
    setRelation('');
    setAgeInput('');
    setActivityLevel('moderate');
    setAllergyInput('');
    setDoctorInput('');
    setDislikeInput('');
    setMemberFoodPreference(householdFoodPreference === 'mixed' ? 'vegetarian' : householdFoodPreference === 'other' ? 'other' : householdFoodPreference);
    setNonVegFrequency('occasionally');
    setNonVegAvoidDays([]);
    setNonVegCustomRule('');
    setMealStrategy('common');
    try {
      window.localStorage.removeItem(FAMILY_PROFILE_DRAFT_KEY);
    } catch {
      // Ignore draft cleanup failures.
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  };

  const handleClearHousehold = () => {
    setMembers([]);
    try {
      window.localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  };

  const toggleNonVegAvoidDay = (day: string) => {
    setNonVegAvoidDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    );
  };

  const updateRoutineDay = (
    day: string,
    patch: Partial<DayWiseFoodRoutinePreference>
  ) => {
    setWeeklyFoodRoutine((current) =>
      current.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry))
    );
  };

  const updateRoutineMeal = (day: string, meal: MealSlot, preference: DayFoodPreference) => {
    setWeeklyFoodRoutine((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              meals: {
                ...(entry.meals ?? {}),
                [meal]: preference,
              },
            }
          : entry
      )
    );
  };

  const updateMealPreferenceInput = (slot: MealSlot, value: string) => {
    setMealPreferenceInputs((current) => ({ ...current, [slot]: value }));
  };

  const toggleNonVegPreferredFood = (food: string) => {
    setNonVegPreferredFoods((current) =>
      current.includes(food) ? current.filter((item) => item !== food) : [...current, food]
    );
  };

  const addOtherNonVegFood = () => {
    const values = splitCsv(otherNonVegInput);
    if (!values.length) return;
    setNonVegPreferredFoods((current) => Array.from(new Set([...current, ...values])));
    setOtherNonVegInput('');
  };

  const handleSaveFamily = async () => {
    const cleanCustomerName = customerName.trim() || members[0]?.name?.trim();
    const cleanMobile = customerMobile.trim();
    const cleanEmail = customerEmail.trim();

    if (!members.length) {
      setFormError('Please add at least one family member before continuing.');
      return;
    }

    if (!cleanCustomerName || (!cleanMobile && !cleanEmail)) {
      setFormError('Please enter your name and either mobile number or email before continuing.');
      return;
    }

    setFormError('');
    setSaveStatus('');
    setSavingProfile(true);

    try {
      const customer = {
        name: cleanCustomerName,
        mobile: cleanMobile,
        email: cleanEmail,
        preferredLanguage: language,
        householdFoodPreference,
        cookingHabit,
        weeklyFoodRoutineStatus,
        weeklyFoodRoutine: weeklyFoodRoutineStatus === 'add' ? cleanWeeklyRoutine(weeklyFoodRoutine) : [],
        mealTypePreferences: cleanMealTypePreferences(mealPreferenceInputs),
        nonVegPreferredFoods,
      };
      const response = await fetch('/api/customer/family-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, members }),
      });
      const data = await response.json();

      if (!response.ok || !data.saved) {
        throw new Error(data.error?.message || data.message || 'Unable to save family profile.');
      }

      window.localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ ...customer, userId: data.userId }));
      window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(members));
      window.localStorage.removeItem(FAMILY_PROFILE_DRAFT_KEY);
      setSaveStatus(t.saved);
      window.setTimeout(() => {
        window.location.href = '/subscription';
      }, 500);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save family profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <AppPageNav />

        <div className="mb-6 flex items-center justify-end gap-4">
          <LanguageSelector />
        </div>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{t.subtitle}</p>
        </section>

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-100 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.householdFood}</span>
              <select
                value={householdFoodPreference}
                onChange={(event) => setHouseholdFoodPreference(event.target.value as HouseholdFoodPreference)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="vegetarian">{t.foodOptions.vegetarian}</option>
                <option value="eggetarian">{t.foodOptions.eggetarian}</option>
                <option value="non_vegetarian">{t.foodOptions.non_vegetarian}</option>
                <option value="semi_vegetarian">{t.foodOptions.semi_vegetarian}</option>
                <option value="vegan">{t.foodOptions.vegan}</option>
                <option value="mixed">{t.foodOptions.mixed}</option>
                <option value="other">{t.foodOptions.other}</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.cookingHabit}</span>
              <select
                value={cookingHabit}
                onChange={(event) => setCookingHabit(event.target.value as CookingHabit)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="fresh_home_cooked">{t.cookingOptions.fresh_home_cooked}</option>
                <option value="ready_frozen">{t.cookingOptions.ready_frozen}</option>
                <option value="fresh_ready_mix">{t.cookingOptions.fresh_ready_mix}</option>
                <option value="takeaway_prepared">{t.cookingOptions.takeaway_prepared}</option>
                <option value="other">{t.cookingOptions.other}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-100 sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">{t.usualFoodTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.usualFoodHelp}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {mealSlotOptions.map((slot) => (
              <label key={slot} className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{t.mealSlots[slot]}</span>
                <VoiceTextInput
                  value={mealPreferenceInputs[slot]}
                  onValueChange={(value) => updateMealPreferenceInput(slot, value)}
                  placeholder={t.mealPreferenceHints[slot]}
                  inputClassName={inputClassName}
                />
              </label>
            ))}
          </div>

          {nonVegFoodPreferences.has(householdFoodPreference) ? (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
              <h3 className="text-base font-bold text-amber-950">{t.nonVegFoodTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-amber-900">{t.nonVegFoodHelp}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {nonVegFoodOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleNonVegPreferredFood(option)}
                    className={`rounded-full px-3 py-2 text-sm font-bold ${
                      nonVegPreferredFoods.includes(option)
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-amber-950 ring-1 ring-amber-200'
                    }`}
                  >
                    {t.nonVegFoodOptions[option]}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-amber-950">{t.otherNonVeg}</span>
                  <VoiceTextInput
                    value={otherNonVegInput}
                    onValueChange={setOtherNonVegInput}
                    placeholder={t.otherNonVegPlaceholder}
                    inputClassName={inputClassName}
                  />
                </label>
                <button
                  type="button"
                  onClick={addOtherNonVegFood}
                  className="rounded-2xl bg-amber-700 px-4 py-3 text-sm font-bold text-white"
                >
                  {t.addOtherFood}
                </button>
              </div>

              {nonVegPreferredFoods.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {nonVegPreferredFoods.map((food) => (
                    <button
                      key={food}
                      type="button"
                      onClick={() => toggleNonVegPreferredFood(food)}
                      className="rounded-full bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-200"
                    >
                      {t.nonVegFoodOptions[food as NonVegFoodOption] ?? food} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mb-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-emerald-100 sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">{t.routineTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.routineHelp}</p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">{t.routineQuestion}</span>
            <select
              value={weeklyFoodRoutineStatus}
              onChange={(event) => setWeeklyFoodRoutineStatus(event.target.value as WeeklyFoodRoutineStatus)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="add">{t.routineStatusOptions.add}</option>
              <option value="no_fixed_routine">{t.routineStatusOptions.no_fixed_routine}</option>
              <option value="skip">{t.routineStatusOptions.skip}</option>
            </select>
          </label>

          {weeklyFoodRoutineStatus === 'add' ? (
            <div className="mt-5 grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-emerald-800">{t.editRoutine}</p>
              </div>

              {weeklyFoodRoutine.map((entry) => (
                <article
                  key={entry.day}
                  className="grid gap-4 rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        {t.weekdays[entry.day as keyof typeof t.weekdays]} - {t.dayPreference}
                      </span>
                      <select
                        value={entry.preference}
                        onChange={(event) =>
                          updateRoutineDay(entry.day, {
                            preference: event.target.value as DayFoodPreference,
                          })
                        }
                        className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        {routinePreferenceOptions.map((option) => (
                          <option key={option} value={option}>
                            {t.routineOptions[option]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-800">{t.note}</span>
                      <VoiceTextInput
                        value={entry.note ?? ''}
                        onValueChange={(value) => updateRoutineDay(entry.day, { note: value })}
                        placeholder={t.notePlaceholder}
                        inputClassName={inputClassName}
                      />
                    </label>
                  </div>

                  <div className="grid gap-2">
                    <span className="text-sm font-bold text-slate-800">{t.mealPreferences}</span>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {mealSlotOptions.map((slot) => (
                        <label key={`${entry.day}-${slot}`} className="grid gap-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {t.mealSlots[slot]}
                          </span>
                          <select
                            value={entry.meals?.[slot] ?? 'no_preference'}
                            onChange={(event) =>
                              updateRoutineMeal(entry.day, slot, event.target.value as DayFoodPreference)
                            }
                            className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          >
                            {routinePreferenceOptions.map((option) => (
                              <option key={option} value={option}>
                                {t.routineOptions[option]}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <form
          onSubmit={handleAddMember}
          className="mb-10 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.name}</span>
              <VoiceTextInput
                value={name}
                onValueChange={setName}
                placeholder="Example: Rajesh"
                inputClassName={inputClassName}
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.relation}</span>
              <VoiceTextInput
                value={relation}
                onValueChange={setRelation}
                placeholder="Example: Self / Parent / Child"
                inputClassName={inputClassName}
                required
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{t.age}</span>
                <VoiceTextInput
                  type="number"
                  value={ageInput}
                  onValueChange={setAgeInput}
                  placeholder={t.ageHint}
                  inputClassName={inputClassName}
                  min={0}
                  max={120}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{t.activity}</span>
                <select
                  value={activityLevel}
                  onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="sedentary">{t.activityOptions.sedentary}</option>
                  <option value="light">{t.activityOptions.light}</option>
                  <option value="moderate">{t.activityOptions.moderate}</option>
                  <option value="heavy">{t.activityOptions.heavy}</option>
                  <option value="athlete">{t.activityOptions.athlete}</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.allergies}</span>
              <VoiceTextInput
                value={allergyInput}
                onValueChange={setAllergyInput}
                placeholder={t.allergiesHint}
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.doctor}</span>
              <VoiceTextInput
                value={doctorInput}
                onValueChange={setDoctorInput}
                placeholder={t.doctorHint}
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.dislikes}</span>
              <VoiceTextInput
                value={dislikeInput}
                onValueChange={setDislikeInput}
                placeholder={t.dislikesHint}
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.strategy}</span>
              <select
                value={mealStrategy}
                onChange={(event) =>
                  setMealStrategy(event.target.value as FamilyMemberProfile['mealStrategyPreference'])
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="common">{t.commonMeal}</option>
                <option value="allow_separate">{t.separateMeal}</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.memberFood}</span>
              <select
                value={memberFoodPreference}
                onChange={(event) =>
                  setMemberFoodPreference(event.target.value as NonNullable<FamilyMemberProfile['foodPreference']>)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="vegetarian">{t.foodOptions.vegetarian}</option>
                <option value="eggetarian">{t.foodOptions.eggetarian}</option>
                <option value="non_vegetarian">{t.foodOptions.non_vegetarian}</option>
                <option value="semi_vegetarian">{t.foodOptions.semi_vegetarian}</option>
                <option value="vegan">{t.foodOptions.vegan}</option>
                <option value="other">{t.foodOptions.other}</option>
              </select>
            </label>

            {nonVegFoodPreferences.has(memberFoodPreference) ? (
              <section className="grid gap-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-amber-950">{t.nonVegFrequency}</span>
                  <select
                    value={nonVegFrequency}
                    onChange={(event) => setNonVegFrequency(event.target.value as NonVegFrequency)}
                    className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="occasionally">{t.nonVegFrequencyOptions.occasionally}</option>
                    <option value="1_2_days_per_week">{t.nonVegFrequencyOptions['1_2_days_per_week']}</option>
                    <option value="3_4_days_per_week">{t.nonVegFrequencyOptions['3_4_days_per_week']}</option>
                    <option value="4_5_days_per_week">{t.nonVegFrequencyOptions['4_5_days_per_week']}</option>
                    <option value="most_days">{t.nonVegFrequencyOptions.most_days}</option>
                    <option value="custom">{t.nonVegFrequencyOptions.custom}</option>
                  </select>
                </label>

                <div className="grid gap-2">
                  <span className="text-sm font-semibold text-amber-950">{t.nonVegAvoidDays}</span>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleNonVegAvoidDay(day)}
                        className={`rounded-full px-3 py-2 text-sm font-bold ${
                          nonVegAvoidDays.includes(day)
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-amber-950 ring-1 ring-amber-200'
                        }`}
                      >
                        {t.weekdays[day]}
                      </button>
                    ))}
                  </div>
                  {!nonVegAvoidDays.length ? <p className="text-xs font-semibold text-amber-800">{t.noFixedRestriction}</p> : null}
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-amber-950">{t.nonVegCustomRule}</span>
                  <VoiceTextInput
                    value={nonVegCustomRule}
                    onValueChange={setNonVegCustomRule}
                    placeholder="Example: avoid on festivals or fasting days"
                    inputClassName={inputClassName}
                  />
                </label>
              </section>
            ) : null}

            {formError ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              {t.add}
            </button>
          </div>
        </form>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">{t.configured}</h2>

            {members.length > 0 && (
              <button
                type="button"
                onClick={handleClearHousehold}
                className="text-sm font-semibold text-red-600"
              >
                {t.clear}
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
              {t.empty}
            </div>
          ) : (
            <div className="grid gap-5">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-950">{member.name}</h3>
                      <p className="mt-1 text-base font-semibold text-slate-500">{member.relation}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {t.age}: {member.age ?? '-'} | {t.activity}: {t.activityOptions[member.activityLevel ?? 'moderate']}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">
                        {t.memberFood}: {t.foodOptions[member.foodPreference ?? 'vegetarian']}
                      </p>
                      {nonVegFoodPreferences.has(member.foodPreference ?? '') ? (
                        <p className="mt-1 text-sm font-semibold text-amber-700">
                          {t.nonVegFrequency}: {t.nonVegFrequencyOptions[member.nonVegFrequency ?? 'occasionally']}
                          {member.nonVegAvoidDays?.length
                            ? ` | ${t.nonVegAvoidDays}: ${member.nonVegAvoidDays.map((day) => t.weekdays[day as keyof typeof t.weekdays] ?? day).join(', ')}`
                            : ` | ${t.noFixedRestriction}`}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-sm font-bold text-red-600"
                    >
                      {t.remove}
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {member.allergies.length > 0 && (
                      <InfoBlock title={t.allergies} tone="red" values={member.allergies} />
                    )}

                    {member.doctorAdvisedRestrictions.length > 0 && (
                      <InfoBlock
                        title={t.doctor}
                        tone="yellow"
                        values={member.doctorAdvisedRestrictions}
                      />
                    )}

                    {member.dislikes.length > 0 && (
                      <InfoBlock title={t.dislikes} tone="slate" values={member.dislikes} />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {members.length > 0 && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-950">{t.accountTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t.accountText}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{t.customerName}</span>
                <VoiceTextInput
                  value={customerName}
                  onValueChange={setCustomerName}
                  placeholder="Example: Rajesh"
                  inputClassName={inputClassName}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{t.customerMobile}</span>
                <VoiceTextInput
                  value={customerMobile}
                  onValueChange={setCustomerMobile}
                  placeholder="Example: 9876543210"
                  inputClassName={inputClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">{t.customerEmail}</span>
                <VoiceTextInput
                  value={customerEmail}
                  onValueChange={setCustomerEmail}
                  placeholder="Example: name@email.com"
                  inputClassName={inputClassName}
                />
              </label>
            </div>

            {formError ? (
              <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {formError}
              </p>
            ) : null}

            {saveStatus ? (
              <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {saveStatus}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSaveFamily}
              disabled={savingProfile}
              className="mt-6 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {savingProfile ? t.saving : t.saveContinue}
            </button>
          </section>
        )}

        {members.length > 0 && (
          <section className="mt-6 rounded-3xl bg-emerald-700 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
              {members.length} household member{members.length > 1 ? 's' : ''} added
            </p>

            <h2 className="mt-2 text-2xl font-bold">{t.nextTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-50">{t.nextText}</p>

            <div className="mt-5 rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
              <p className="text-sm text-emerald-100">{t.recommended}</p>
              <p className="mt-1 text-xl font-bold">{suggestedPlan}</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSaveFamily}
                disabled={savingProfile}
                className="rounded-2xl bg-white px-5 py-4 text-center text-base font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                {savingProfile ? t.saving : t.saveContinue}
              </button>

              <Link
                href="/planner"
                className="rounded-2xl border border-white/35 px-5 py-4 text-center text-base font-bold text-white transition hover:bg-white/10"
              >
                {t.demo}
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-emerald-100">{t.savedNote}</p>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoBlock({
  title,
  values,
  tone,
}: {
  title: string;
  values: string[];
  tone: 'red' | 'yellow' | 'slate';
}) {
  const styles = {
    red: 'bg-red-50 text-red-900 ring-red-100',
    yellow: 'bg-yellow-50 text-yellow-900 ring-yellow-100',
    slate: 'bg-slate-50 text-slate-900 ring-slate-100',
  };

  const chipStyles = {
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-900',
    slate: 'bg-slate-200 text-slate-800',
  };

  return (
    <div className={`rounded-2xl p-4 ring-1 ${styles[tone]}`}>
      <h4 className="mb-3 text-base font-bold">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${chipStyles[tone]}`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
