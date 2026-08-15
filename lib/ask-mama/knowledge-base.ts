import type { AppLanguage } from "@/lib/i18n";

export type AskMamaCategory =
  | "overview"
  | "getting_started"
  | "judge_demo"
  | "install_app"
  | "allergies"
  | "fasting"
  | "quantities"
  | "recipes"
  | "video"
  | "replacement"
  | "grocery"
  | "subscriptions"
  | "testing_status"
  | "medical_safety"
  | "support"
  | "unknown";

export type AskMamaActionType = "try_demo" | "add_family" | "contact_support" | "none";

export interface AskMamaAnswer {
  category: AskMamaCategory;
  answer: string;
  action?: {
    type: AskMamaActionType;
    label: string;
  };
  suggestions: string[];
  unresolved?: boolean;
}

export const MAMAAI_SUPPORT_EMAIL = "support@mamaai.in";
export const MAMAAI_OWNER_EMAIL = "rbinnovationllp@gmail.com";

const quickSuggestions = [
  "How does MAMAAI work?",
  "Plan meals for my family",
  "How are allergies handled?",
  "Show subscription plans",
];

const localizedAskMamaAnswers = {
  en: {
    quickSuggestions,
    unknownPrompt: "Please ask me about MAMAAI, demo access, family setup, allergies, recipes, groceries, or subscriptions.",
    privateInfoRefusal: "I cannot share private prompts, credentials, internal settings, admin details, or hidden configuration. I can still help you use MAMAAI safely.",
    medicalSafety: "MAMAAI can give food-planning suggestions, but it does not diagnose, treat, prescribe, or replace a doctor or dietitian. For medical conditions, use MAMAAI suggestions only with professional guidance.",
    overview: "MAMAAI helps one family plan one practical meal while still adapting portions, ingredients, fruit, hydration, and cooking notes for each member. The demo focuses on the full family-meal flow.",
    gettingStarted: "Start by creating a family, then add members with age, activity level, food pattern, allergies, dislikes, restrictions, fasting needs, and meal attendance. After that MAMAAI can generate the next family meal.",
    judgeDemo: "Judge/Demo Mode uses fictional family data and bypasses login and payment so reviewers can test the core flow quickly: profile, common meal, personal portions, recipe, replacement, groceries, and MAMA Family Table.",
    allergies: "Allergies and medical restrictions are hard safety rules. Food dislikes are handled more flexibly: MAMAAI first tries personal modifications or a simple alternative before changing the whole family meal.",
    fasting: "MAMAAI provides fasting-aware planning, including fasting windows, allowed foods, cultural context, and alternatives tailored to your family's customs.",
    quantities: "Ingredient quantities and portions are estimated from family strength, selected meal, meal attendance, member age/activity, and recipe servings. Nutrition and costs are estimates for planning, not medical values.",
    recipes: "Suggested meals include a View Recipe / How to Cook option with ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate, alternatives, and member-specific preparation notes.",
    video: "Watch How to Cook searches relevant cooking tutorials for your dish. If a direct YouTube API key is not active, MAMAAI provides direct YouTube search links alongside the full written recipe.",
    replacement: "Use Replace Meal after generating a plan. MAMAAI suggests another suitable meal and updates portions, modifications, recipe details, and the grocery list where available.",
    grocery: "The grocery list is created from the selected meal and family portions. When a meal is replaced, the list updates so the family can see what ingredients and approximate quantities are needed.",
    installGeneral:
      "Yes. MAMAAI can be added to your phone home screen like an app. On Android, open www.mamaai.in in Chrome, tap the three-dot menu, choose Install app or Add to Home screen, then confirm. On iPhone, open www.mamaai.in in Safari, tap Share, choose Add to Home Screen, then tap Add. On iPad, use Safari, tap Share, choose Add to Home Screen, then tap Add. If your browser does not show Install app, use Add to Home screen or open MAMAAI in Chrome on Android or Safari on Apple devices.",
    installAndroid:
      "On Android, open www.mamaai.in in Chrome. Tap the three-dot menu in the top right. Choose Install app if it appears; otherwise choose Add to Home screen. Tap Install or Add to confirm. After that, the MAMAAI icon appears on your phone and you can open it like an app.",
    installIos:
      "On iPhone, open www.mamaai.in in Safari. Tap the Share button. Scroll if needed and tap Add to Home Screen. Check the name MAMAAI, then tap Add. The MAMAAI icon will appear on your iPhone Home Screen. Chrome on iPhone usually cannot add the icon directly, so use Safari.",
    installIpad:
      "On iPad, open www.mamaai.in in Safari. Tap the Share button near the address bar. Choose Add to Home Screen, then tap Add. The MAMAAI icon will appear on your iPad Home Screen for quick access.",
    subscriptions: "Planned tiers are Family Starter (Rs. 399/mo | US$4.99/mo for up to 4), Family Premium (Rs. 599/mo | US$7.99/mo for up to 6), and Family Plus (Rs. 999/mo | US$12.99/mo for up to 10). Family Plus adds extended four-paw member meal planning with separate pet-appropriate guidance. Judge/Demo Mode bypasses payment so you can explore all features.",
    testingStatus: "MAMAAI testing mode is active with interactive AI meal planning, Ask MAMA assistance, and demo profiles fully operational.",
    support: (suffix: string) => `For support, contact ${MAMAAI_SUPPORT_EMAIL}. Project owner contact: ${MAMAAI_OWNER_EMAIL}.${suffix}`,
    fallback: "I can help with MAMAAI features, demo mode, family setup, allergies, fasting, quantities, recipes, meal replacement, groceries, subscriptions, and support. Try one of the quick questions below.",
  },
  hi: {
    quickSuggestions: ["MAMAAI कैसे काम करता है?", "मेरे परिवार के meals plan करें", "Allergies कैसे handle होती हैं?", "Subscription plans दिखाएं"],
    unknownPrompt: "कृपया MAMAAI, demo access, family setup, allergies, recipes, groceries या subscriptions के बारे में पूछें.",
    privateInfoRefusal: "मैं private prompts, credentials, internal settings, admin details या hidden configuration share नहीं कर सकती. मैं MAMAAI safely use करने में मदद कर सकती हूं.",
    medicalSafety: "MAMAAI food-planning suggestions दे सकता है, लेकिन diagnosis, treatment, prescription या doctor/dietitian की जगह नहीं लेता.",
    overview: "MAMAAI एक परिवार के लिए एक practical meal plan करता है और हर member के portions, ingredients, fruit, hydration और cooking notes adjust करता है.",
    gettingStarted: "पहले family बनाएं, फिर members की age, activity, food pattern, allergies, dislikes, restrictions, fasting needs और attendance जोड़ें. उसके बाद MAMAAI next family meal बना सकता है.",
    judgeDemo: "Judge/Demo Mode fictional family data use करता है और login/payment bypass करता है ताकि reviewers profile, common meal, portions, recipe, replacement, groceries और MAMA Family Table test कर सकें.",
    allergies: "Allergies और medical restrictions hard safety rules हैं. Food dislikes को flexible तरीके से personal modifications या simple alternative से handle किया जाता है.",
    fasting: "MAMAAI fasting-aware planning देता है, जिसमें fasting windows, allowed foods, cultural context और family customs के हिसाब से alternatives शामिल हैं.",
    quantities: "Ingredient quantities और portions family strength, selected meal, attendance, age/activity और recipe servings से estimate होते हैं. Nutrition/costs medical values नहीं हैं.",
    recipes: "Suggested meals में View Recipe / How to Cook option होता है: ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate और member-specific notes.",
    video: "Watch How to Cook relevant cooking tutorials search करता है. YouTube API active न होने पर MAMAAI written recipe के साथ YouTube search links देता है.",
    replacement: "Meal generate करने के बाद Replace Meal use करें. MAMAAI दूसरा suitable meal suggest करता है और portions, recipe details और grocery list update करता है.",
    grocery: "Grocery list selected meal और family portions से बनती है. Meal replace करने पर list update होती है.",
    installGeneral:
      "हां. MAMAAI को आप phone की Home Screen पर app की तरह add कर सकते हैं. Android पर Chrome में www.mamaai.in खोलें, तीन-dot menu दबाएं, Install app या Add to Home screen चुनें, फिर confirm करें. iPhone पर Safari में www.mamaai.in खोलें, Share button दबाएं, Add to Home Screen चुनें, फिर Add दबाएं. iPad पर भी Safari में Share button से Add to Home Screen चुनें. अगर आपके browser में Install app नहीं दिखता, तो Add to Home screen use करें या Android पर Chrome और Apple device पर Safari खोलें.",
    installAndroid:
      "Android phone पर Chrome खोलें और www.mamaai.in पर जाएं. ऊपर right side में तीन-dot menu दबाएं. Install app दिखे तो उसे चुनें; नहीं तो Add to Home screen चुनें. Install या Add दबाकर confirm करें. इसके बाद MAMAAI icon आपके phone पर आ जाएगा और आप इसे app की तरह खोल सकेंगे.",
    installIos:
      "iPhone पर Safari खोलें और www.mamaai.in पर जाएं. नीचे या ऊपर दिखने वाला Share button दबाएं. जरूरत हो तो list में scroll करके Add to Home Screen चुनें. नाम MAMAAI रहने दें और Add दबाएं. MAMAAI icon आपके iPhone Home Screen पर आ जाएगा. iPhone पर Chrome से यह option अक्सर नहीं मिलता, इसलिए Safari use करें.",
    installIpad:
      "iPad पर Safari खोलें और www.mamaai.in पर जाएं. address bar के पास Share button दबाएं. Add to Home Screen चुनें, फिर Add दबाएं. MAMAAI icon iPad Home Screen पर आ जाएगा.",
    subscriptions: "Plans हैं Family Starter (Rs. 399/mo | US$4.99/mo, 4 members तक), Family Premium (Rs. 599/mo | US$7.99/mo, 6 members तक), और Family Plus (Rs. 999/mo | US$12.99/mo, 10 members तक). Family Plus में separate pet-appropriate four-paw meal planning शामिल है.",
    testingStatus: "MAMAAI testing mode active है, जिसमें interactive meal planning, Ask MAMA assistance और demo profiles काम कर रहे हैं.",
    support: (suffix: string) => `Support के लिए ${MAMAAI_SUPPORT_EMAIL} पर contact करें. Project owner: ${MAMAAI_OWNER_EMAIL}.${suffix}`,
    fallback: "मैं MAMAAI features, demo mode, family setup, allergies, fasting, quantities, recipes, meal replacement, groceries, subscriptions और support में मदद कर सकती हूं.",
  },
  kn: {
    quickSuggestions: ["MAMAAI ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?", "ನನ್ನ ಕುಟುಂಬಕ್ಕೆ meals plan ಮಾಡಿ", "Allergies ಹೇಗೆ handle ಆಗುತ್ತವೆ?", "Subscription plans ತೋರಿಸಿ"],
    unknownPrompt: "ದಯವಿಟ್ಟು MAMAAI, demo access, family setup, allergies, recipes, groceries ಅಥವಾ subscriptions ಬಗ್ಗೆ ಕೇಳಿ.",
    privateInfoRefusal: "ನಾನು private prompts, credentials, internal settings, admin details ಅಥವಾ hidden configuration share ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. MAMAAI ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸಲು ಸಹಾಯ ಮಾಡಬಹುದು.",
    medicalSafety: "MAMAAI food-planning suggestions ನೀಡಬಹುದು, ಆದರೆ diagnosis, treatment, prescription ಅಥವಾ doctor/dietitian ಗೆ ಬದಲಾವಣೆ ಅಲ್ಲ.",
    overview: "MAMAAI ಒಂದು ಕುಟುಂಬಕ್ಕೆ practical meal plan ಮಾಡುತ್ತದೆ ಮತ್ತು ಪ್ರತಿ member ಗೆ portions, ingredients, fruit, hydration ಮತ್ತು cooking notes adjust ಮಾಡುತ್ತದೆ.",
    gettingStarted: "ಮೊದಲು family ರಚಿಸಿ, ನಂತರ members age, activity, food pattern, allergies, dislikes, restrictions, fasting needs ಮತ್ತು attendance ಸೇರಿಸಿ. ನಂತರ MAMAAI next family meal ರಚಿಸುತ್ತದೆ.",
    judgeDemo: "Judge/Demo Mode fictional family data ಬಳಸುತ್ತದೆ ಮತ್ತು login/payment bypass ಮಾಡುತ್ತದೆ, reviewers profile, common meal, portions, recipe, replacement, groceries ಮತ್ತು MAMA Family Table test ಮಾಡಬಹುದು.",
    allergies: "Allergies ಮತ್ತು medical restrictions hard safety rules. Food dislikes ಅನ್ನು personal modifications ಅಥವಾ simple alternative ಮೂಲಕ flexible ಆಗಿ handle ಮಾಡಲಾಗುತ್ತದೆ.",
    fasting: "MAMAAI fasting-aware planning ನೀಡುತ್ತದೆ: fasting windows, allowed foods, cultural context ಮತ್ತು family customs ಗೆ ಹೊಂದಿದ alternatives.",
    quantities: "Ingredient quantities ಮತ್ತು portions family strength, selected meal, attendance, age/activity ಮತ್ತು recipe servings ಆಧಾರಿತ estimates. Nutrition/costs medical values ಅಲ್ಲ.",
    recipes: "Suggested meals ನಲ್ಲಿ View Recipe / How to Cook option ಇದೆ: ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate ಮತ್ತು member-specific notes.",
    video: "Watch How to Cook relevant cooking tutorials search ಮಾಡುತ್ತದೆ. YouTube API active ಇಲ್ಲದಿದ್ದರೆ written recipe ಜೊತೆಗೆ YouTube search links ನೀಡುತ್ತದೆ.",
    replacement: "Meal generate ಆದ ನಂತರ Replace Meal ಬಳಸಿ. MAMAAI suitable meal suggest ಮಾಡಿ portions, recipe details ಮತ್ತು grocery list update ಮಾಡುತ್ತದೆ.",
    grocery: "Grocery list selected meal ಮತ್ತು family portions ಆಧರಿಸಿ ರಚಿಸಲಾಗುತ್ತದೆ. Meal replace ಮಾಡಿದಾಗ list update ಆಗುತ್ತದೆ.",
    installGeneral:
      "ಹೌದು. MAMAAI ಅನ್ನು ನಿಮ್ಮ phone Home Screen ಗೆ app ತರಹ add ಮಾಡಬಹುದು. Android ನಲ್ಲಿ Chrome ತೆರೆದು www.mamaai.in ಗೆ ಹೋಗಿ, ಮೂರು-dot menu ಒತ್ತಿ, Install app ಅಥವಾ Add to Home screen ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ confirm ಮಾಡಿ. iPhone ನಲ್ಲಿ Safari ತೆರೆದು www.mamaai.in ಗೆ ಹೋಗಿ, Share button ಒತ್ತಿ, Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ Add ಒತ್ತಿ. iPad ನಲ್ಲೂ Safari ಬಳಸಿ Share button ಮೂಲಕ Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ. ನಿಮ್ಮ browser ನಲ್ಲಿ Install app ಕಾಣಿಸದಿದ್ದರೆ Add to Home screen ಬಳಸಿ, ಅಥವಾ Android ನಲ್ಲಿ Chrome ಮತ್ತು Apple devices ನಲ್ಲಿ Safari ಬಳಸಿ.",
    installAndroid:
      "Android phone ನಲ್ಲಿ Chrome ತೆರೆಯಿರಿ ಮತ್ತು www.mamaai.in ಗೆ ಹೋಗಿ. ಮೇಲೆ right side ಇರುವ ಮೂರು-dot menu ಒತ್ತಿ. Install app ಕಾಣಿಸಿದರೆ ಅದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ; ಇಲ್ಲದಿದ್ದರೆ Add to Home screen ಆಯ್ಕೆ ಮಾಡಿ. Install ಅಥವಾ Add ಒತ್ತಿ confirm ಮಾಡಿ. ನಂತರ MAMAAI icon ನಿಮ್ಮ phone ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ ಮತ್ತು app ತರಹ ತೆರೆಯಬಹುದು.",
    installIos:
      "iPhone ನಲ್ಲಿ Safari ತೆರೆಯಿರಿ ಮತ್ತು www.mamaai.in ಗೆ ಹೋಗಿ. Share button ಒತ್ತಿ. ಬೇಕಾದರೆ list ನಲ್ಲಿ scroll ಮಾಡಿ Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ. ಹೆಸರು MAMAAI ಆಗಿಯೇ ಇರಲಿ, ನಂತರ Add ಒತ್ತಿ. MAMAAI icon iPhone Home Screen ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ. iPhone ನಲ್ಲಿ Chrome ಸಾಮಾನ್ಯವಾಗಿ icon add ಮಾಡಲು ಬಿಡುವುದಿಲ್ಲ, ಆದ್ದರಿಂದ Safari ಬಳಸಿ.",
    installIpad:
      "iPad ನಲ್ಲಿ Safari ತೆರೆಯಿರಿ ಮತ್ತು www.mamaai.in ಗೆ ಹೋಗಿ. address bar ಹತ್ತಿರದ Share button ಒತ್ತಿ. Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ Add ಒತ್ತಿ. MAMAAI icon iPad Home Screen ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.",
    subscriptions: "Plans: Family Starter (Rs. 399/mo | US$4.99/mo, 4 members ವರೆಗೆ), Family Premium (Rs. 599/mo | US$7.99/mo, 6 members ವರೆಗೆ), Family Plus (Rs. 999/mo | US$12.99/mo, 10 members ವರೆಗೆ). Family Plus ನಲ್ಲಿ separate pet-appropriate four-paw meal planning ಸೇರಿದೆ.",
    testingStatus: "MAMAAI testing mode active ಇದೆ: interactive meal planning, Ask MAMA assistance ಮತ್ತು demo profiles ಲಭ್ಯವಿವೆ.",
    support: (suffix: string) => `Support ಗಾಗಿ ${MAMAAI_SUPPORT_EMAIL} ಸಂಪರ್ಕಿಸಿ. Project owner: ${MAMAAI_OWNER_EMAIL}.${suffix}`,
    fallback: "ನಾನು MAMAAI features, demo mode, family setup, allergies, fasting, quantities, recipes, meal replacement, groceries, subscriptions ಮತ್ತು support ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಹುದು.",
  },
} satisfies Record<AppLanguage, typeof localizedAskMamaAnswers.en>;

const promptAttackTerms = [
  "system prompt",
  "developer message",
  "api key",
  "secret key",
  "password",
  "internal config",
  "ignore previous",
  "bypass",
  "admin token",
];

const medicalTerms = [
  "diagnose",
  "diagnosis",
  "treatment",
  "medicine",
  "medication",
  "dose",
  "insulin",
  "cure",
  "blood sugar medicine",
  "blood pressure medicine",
  "pregnancy complication",
];

const installQuestionTerms = [
  "install mamaai",
  "install app",
  "install on android",
  "install on iphone",
  "install on ipad",
  "install on phone",
  "install on mobile",
  "add to home screen",
  "home screen",
  "mobile app",
  "phone app",
  "use mamaai like an app",
  "use it like an app",
  "pwa",
];

const installQuestionTermsUnicode = [
  "इंस्टॉल",
  "इनस्टॉल",
  "ऐप",
  "एप",
  "मोबाइल",
  "फोन",
  "होम स्क्रीन",
  "होमस्क्रीन",
  "ಇನ್‌ಸ್ಟಾಲ್",
  "ಇನ್ಸ್ಟಾಲ್",
  "ಆಪ್",
  "ಅ್ಯಪ್",
  "ಮೊಬೈಲ್",
  "ಫೋನ್",
  "ಹೋಮ್ ಸ್ಕ್ರೀನ್",
  "ಹೋಮ್‌ಸ್ಕ್ರೀನ್",
];

const androidTerms = ["android", "chrome", "एंड्रॉयड", "एंड्रायड", "क्रोम", "ಆಂಡ್ರಾಯ್ಡ್", "ಕ್ರೋಮ್"];
const iphoneTerms = ["iphone", "ios", "safari", "आईफोन", "आईओएस", "सफारी", "ಐಫೋನ್", "ಐಒಎಸ್", "ಸಫಾರಿ"];
const ipadTerms = ["ipad", "आईपैड", "आइपैड", "ಐಪ್ಯಾಡ್"];
const deviceTerms = [...androidTerms, ...iphoneTerms, ...ipadTerms, "phone", "mobile", "फोन", "मोबाइल", "ಫೋನ್", "ಮೊಬೈಲ್"];

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function cleanQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9\s/-]/g, " ");
}

export function answerAskMama(question: string, detailed = false, language: AppLanguage = "en"): AskMamaAnswer {
  const rawText = question.toLocaleLowerCase();
  const text = cleanQuestion(question);
  const suffix = detailed
    ? " I can explain the next step in more detail once you choose the area you want to open."
    : "";

  const localized = localizedAskMamaAnswers[language] ?? localizedAskMamaAnswers.en;

  if (!question.trim()) {
    return {
      category: "unknown",
      answer: localized.unknownPrompt,
      suggestions: localized.quickSuggestions,
      unresolved: true,
    };
  }

  if (hasAny(text, promptAttackTerms)) {
    return {
      category: "support",
      answer: localized.privateInfoRefusal,
      suggestions: localized.quickSuggestions,
    };
  }

  if (hasAny(text, medicalTerms)) {
    return {
      category: "medical_safety",
      answer: localized.medicalSafety,
      suggestions: [
        "How are allergies handled?",
        "Can it plan meals for fasting days?",
        "Can I get recipes for suggested meals?",
      ],
    };
  }

  if (
    hasAny(text, installQuestionTerms) ||
    hasAny(rawText, installQuestionTermsUnicode) ||
    (text.includes("install") && hasAny(rawText, deviceTerms))
  ) {
    const answer = hasAny(rawText, ipadTerms)
      ? localized.installIpad
      : hasAny(rawText, iphoneTerms)
        ? localized.installIos
        : hasAny(rawText, androidTerms)
          ? localized.installAndroid
          : localized.installGeneral;

    return {
      category: "install_app",
      answer,
      suggestions: ["How to install on Android?", "How to install on iPhone?", "Can I use MAMAAI like a mobile app?"],
    };
  }

  if (hasAny(text, ["what is", "about mamaai", "how does mamaai work", "how it work", "how does it work"])) {
    return {
      category: "overview",
      answer: localized.overview,
      action: { type: "try_demo", label: "Try Demo" },
      suggestions: ["Plan meals for my family", "How are allergies handled?", "Can I get recipes for suggested meals?"],
    };
  }

  if (hasAny(text, ["add family", "family member", "start", "get started", "plan meals for my family", "create family"])) {
    return {
      category: "getting_started",
      answer: localized.gettingStarted,
      action: { type: "add_family", label: "Add Family" },
      suggestions: ["How are allergies handled?", "How are ingredient quantities calculated?", "How do I replace a meal?"],
    };
  }

  if (hasAny(text, ["judge", "demo", "devpost", "try demo"])) {
    return {
      category: "judge_demo",
      answer: localized.judgeDemo,
      action: { type: "try_demo", label: "Open Judge Demo" },
      suggestions: ["Can I get recipes for suggested meals?", "How does grocery planning work?", "Show subscription plans"],
    };
  }

  if (hasAny(text, ["allergy", "allergies", "dislike", "never include", "restriction", "avoid food"])) {
    return {
      category: "allergies",
      answer: localized.allergies,
      suggestions: ["Plan meals for my family", "How are ingredient quantities calculated?", "Can I get recipes for suggested meals?"],
    };
  }

  if (hasAny(text, ["fast", "fasting", "vrat", "upvas", "festival"])) {
    return {
      category: "fasting",
      answer: localized.fasting,
      suggestions: ["How are allergies handled?", "Can I get recipes for suggested meals?", "Show subscription plans"],
    };
  }

  if (hasAny(text, ["quantity", "quantities", "portion", "serving", "nutrition", "protein", "calorie", "cost"])) {
    return {
      category: "quantities",
      answer: localized.quantities,
      suggestions: ["Can I get recipes for suggested meals?", "How does grocery planning work?", "How are allergies handled?"],
    };
  }

  if (hasAny(text, ["recipe", "cook", "how to cook", "ingredients", "instruction"])) {
    return {
      category: "recipes",
      answer: localized.recipes,
      suggestions: ["Watch cooking video", "How do I replace a meal?", "How does grocery planning work?"],
    };
  }

  if (hasAny(text, ["youtube", "video", "watch"])) {
    return {
      category: "video",
      answer: localized.video,
      suggestions: ["Can I get recipes for suggested meals?", "How does MAMAAI work?"],
    };
  }

  if (hasAny(text, ["replace", "change meal", "another meal", "swap"])) {
    return {
      category: "replacement",
      answer: localized.replacement,
      suggestions: ["How does grocery planning work?", "How are allergies handled?", "Plan meals for my family"],
    };
  }

  if (hasAny(text, ["grocery", "shopping", "list", "ingredients to buy"])) {
    return {
      category: "grocery",
      answer: localized.grocery,
      suggestions: ["How are ingredient quantities calculated?", "Can I get recipes for suggested meals?", "Show subscription plans"],
    };
  }

  if (hasAny(text, ["subscription", "price", "pricing", "plan", "revenuecat", "payment"])) {
    return {
      category: "subscriptions",
      answer: localized.subscriptions,
      suggestions: ["How does MAMAAI work?", "Plan meals for my family"],
    };
  }

  if (hasAny(text, ["testing", "unavailable", "coming", "production", "api", "status"])) {
    return {
      category: "testing_status",
      answer: localized.testingStatus,
      suggestions: ["Can I get recipes for suggested meals?", "Watch cooking video", "Show subscription plans"],
    };
  }

  if (hasAny(text, ["support", "contact", "owner", "email", "help"])) {
    return {
      category: "support",
      answer: localized.support(suffix),
      action: { type: "contact_support", label: "Email Support" },
      suggestions: quickSuggestions,
    };
  }

  return {
    category: "unknown",
    answer: localized.fallback,
    suggestions: localized.quickSuggestions,
    unresolved: true,
  };
}
