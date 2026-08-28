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
    unknownPrompt: `Sorry, I can answer only MAMAAI product, meal-planning, pantry, grocery, recipe, subscription and support questions here. For the correct answer, please contact ${MAMAAI_SUPPORT_EMAIL}.`,
    privateInfoRefusal: "I cannot share private prompts, credentials, internal settings, admin details, or hidden configuration. I can still help you use MAMAAI safely.",
    medicalSafety: "MAMAAI can give food-planning suggestions, but it does not diagnose, treat, prescribe, or replace a doctor or dietitian. For medical conditions, use MAMAAI suggestions only with professional guidance.",
    overview: "MAMAAI helps one family plan one practical meal while still adapting portions, ingredients, fruit, hydration, and cooking notes for each member. The demo focuses on the full family-meal flow.",
    gettingStarted: "To plan meals for your family, first create the family profile and add each member's food preference, allergies, dislikes, restrictions, cooking habit and meal needs. Then open Meal Planner and tap Plan Today's Family Meal. MAMAAI will generate one practical family meal with member-specific portions, recipe and grocery list.",
    judgeDemo: "Judge/Demo Mode uses fictional family data and bypasses login and payment so reviewers can test the core flow quickly: profile, common meal, personal portions, recipe, replacement, groceries, and MAMA Family Table.",
    allergies: "Allergies and medical restrictions are hard safety rules. Food dislikes are handled more flexibly: MAMAAI first tries personal modifications or a simple alternative before changing the whole family meal.",
    fasting: "MAMAAI provides fasting-aware planning, including fasting windows, allowed foods, cultural context, and alternatives tailored to your family's customs.",
    quantities: "Ingredient quantities and portions are estimated from family strength, selected meal, meal attendance, member age/activity, and recipe servings. Nutrition and costs are estimates for planning, not medical values.",
    recipes: "Suggested meals include a View Recipe / How to Cook option with ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate, alternatives, and member-specific preparation notes.",
    video: "Watch How to Cook searches relevant cooking tutorials for your dish. If a direct YouTube API key is not active, MAMAAI provides direct YouTube search links alongside the full written recipe.",
    replacement: "Use Replace Meal after generating a plan. MAMAAI suggests another suitable meal and updates portions, modifications, recipe details, and the grocery list where available.",
    grocery: "MAMAAI uses pantry and grocery information to plan around what you already have, what needs to be bought, and what can be substituted. If you ask what to cook with pantry staples, open Pantry, add available staples, then generate a meal plan so the grocery list and substitutions stay connected to your family profile.",
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
    fallback: `Sorry, I do not have a reliable MAMAAI answer for that question yet. Please contact ${MAMAAI_SUPPORT_EMAIL} for the correct answer.`,
  },
  hi: {
    quickSuggestions: ["MAMAAI कैसे काम करता है?", "मेरे परिवार का भोजन प्लान करें", "एलर्जी कैसे संभाली जाती है?", "सब्सक्रिप्शन प्लान दिखाएं"],
    unknownPrompt: `माफ कीजिए, मैं यहां केवल MAMAAI, भोजन योजना, पैंट्री, किराना, रेसिपी, सब्सक्रिप्शन और सपोर्ट से जुड़े प्रश्नों का उत्तर दे सकती हूं। सही उत्तर के लिए कृपया ${MAMAAI_SUPPORT_EMAIL} पर संपर्क करें।`,
    privateInfoRefusal: "मैं निजी prompts, credentials, internal settings, admin details या hidden configuration साझा नहीं कर सकती। मैं MAMAAI को सुरक्षित तरीके से इस्तेमाल करने में मदद कर सकती हूं।",
    medicalSafety: "MAMAAI भोजन योजना के सुझाव दे सकता है, लेकिन यह diagnosis, treatment, prescription या doctor/dietitian की जगह नहीं लेता।",
    overview: "MAMAAI एक परिवार के लिए एक व्यावहारिक भोजन योजना बनाता है और हर सदस्य के हिस्से, सामग्री, फल, पानी और cooking notes को अलग-अलग जरूरतों के अनुसार समायोजित करता है।",
    gettingStarted: "अपने परिवार का भोजन प्लान करने के लिए पहले परिवार प्रोफाइल बनाएं। हर सदस्य की भोजन पसंद, एलर्जी, नापसंद, डॉक्टर की पाबंदी, खाना बनाने की आदत और भोजन की जरूरतें जोड़ें। फिर Meal Planner खोलकर “आज का पारिवारिक भोजन प्लान करें” दबाएं। MAMAAI एक साझा भोजन, सदस्य-विशेष हिस्से, रेसिपी और किराने की सूची बनाएगा।",
    judgeDemo: "Judge/Demo Mode में काल्पनिक family data और payment bypass होता है, ताकि reviewers profile, common meal, portions, recipe, replacement, groceries और MAMA Family Table जल्दी test कर सकें।",
    allergies: "एलर्जी और डॉक्टर की पाबंदियां सख्त safety rules हैं। Food dislikes को पहले personal modification या simple alternative से handle किया जाता है, ताकि पूरी family meal unnecessarily न बदले।",
    fasting: "MAMAAI fasting-aware planning देता है, जिसमें व्रत का समय, allowed foods, cultural context और family customs के अनुसार alternatives शामिल होते हैं।",
    quantities: "Ingredient quantities और portions family strength, selected meal, attendance, age/activity और recipe servings से estimate होते हैं। Nutrition और cost planning estimates हैं, medical values नहीं।",
    recipes: "Suggested meals में recipe मिलती है: ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate और member-specific cooking notes।",
    video: "Watch How to Cook dish से जुड़े cooking tutorials खोजने में मदद करता है। YouTube API active न होने पर MAMAAI written recipe के साथ YouTube search link देता है।",
    replacement: "Meal generate होने के बाद Replace Meal इस्तेमाल करें। MAMAAI दूसरा suitable meal suggest करता है और portions, recipe details और grocery list update करता है।",
    grocery: "MAMAAI पैंट्री और किराने की जानकारी का उपयोग करके बताता है कि घर में मौजूद सामान से क्या बन सकता है, क्या खरीदना है और कौन-सा बदलाव व्यावहारिक है। पैंट्री में उपलब्ध items जोड़ें, फिर Meal Planner से भोजन योजना बनाएं ताकि किराने की सूची और substitutions परिवार प्रोफाइल से जुड़े रहें।",
    installGeneral:
      "हां. MAMAAI को आप phone की Home Screen पर app की तरह add कर सकते हैं. Android पर Chrome में www.mamaai.in खोलें, तीन-dot menu दबाएं, Install app या Add to Home screen चुनें, फिर confirm करें. iPhone पर Safari में www.mamaai.in खोलें, Share button दबाएं, Add to Home Screen चुनें, फिर Add दबाएं. iPad पर भी Safari में Share button से Add to Home Screen चुनें. अगर आपके browser में Install app नहीं दिखता, तो Add to Home screen use करें या Android पर Chrome और Apple device पर Safari खोलें.",
    installAndroid:
      "Android phone पर Chrome खोलें और www.mamaai.in पर जाएं. ऊपर right side में तीन-dot menu दबाएं. Install app दिखे तो उसे चुनें; नहीं तो Add to Home screen चुनें. Install या Add दबाकर confirm करें. इसके बाद MAMAAI icon आपके phone पर आ जाएगा और आप इसे app की तरह खोल सकेंगे.",
    installIos:
      "iPhone पर Safari खोलें और www.mamaai.in पर जाएं. नीचे या ऊपर दिखने वाला Share button दबाएं. जरूरत हो तो list में scroll करके Add to Home Screen चुनें. नाम MAMAAI रहने दें और Add दबाएं. MAMAAI icon आपके iPhone Home Screen पर आ जाएगा. iPhone पर Chrome से यह option अक्सर नहीं मिलता, इसलिए Safari use करें.",
    installIpad:
      "iPad पर Safari खोलें और www.mamaai.in पर जाएं. address bar के पास Share button दबाएं. Add to Home Screen चुनें, फिर Add दबाएं. MAMAAI icon iPad Home Screen पर आ जाएगा.",
    subscriptions: "Family Starter Rs. 399/mo या US$4.99/mo में 4 members तक, Family Premium Rs. 599/mo या US$7.99/mo में 6 members तक, और Family Plus Rs. 999/mo या US$12.99/mo में 10 members तक support करता है। Family Plus में four-paw family members के लिए अलग pet-appropriate meal planning शामिल है।",
    testingStatus: "MAMAAI में interactive meal planning, Ask MAMA assistance और demo profiles उपलब्ध हैं।",
    support: (suffix: string) => `Support के लिए ${MAMAAI_SUPPORT_EMAIL} पर संपर्क करें। Project owner: ${MAMAAI_OWNER_EMAIL}.${suffix}`,
    fallback: `माफ कीजिए, मेरे पास इस प्रश्न का भरोसेमंद MAMAAI उत्तर अभी नहीं है। सही उत्तर के लिए कृपया ${MAMAAI_SUPPORT_EMAIL} पर संपर्क करें।`,
  },
  kn: {
    quickSuggestions: ["MAMAAI ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?", "ನನ್ನ ಕುಟುಂಬದ ಊಟವನ್ನು ಪ್ಲ್ಯಾನ್ ಮಾಡಿ", "ಅಲರ್ಜಿ ಹೇಗೆ ನೋಡಿಕೊಳ್ಳಲಾಗುತ್ತದೆ?", "ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಪ್ಲ್ಯಾನ್‌ಗಳನ್ನು ತೋರಿಸಿ"],
    unknownPrompt: `ಕ್ಷಮಿಸಿ, ಇಲ್ಲಿ ನಾನು MAMAAI, ಊಟ ಯೋಜನೆ, ಪ್ಯಾಂಟ್ರಿ, ಕಿರಾಣಿ, ರೆಸಿಪಿ, ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್ ಮತ್ತು support ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಉತ್ತರಿಸಬಹುದು. ಸರಿಯಾದ ಉತ್ತರಕ್ಕಾಗಿ ದಯವಿಟ್ಟು ${MAMAAI_SUPPORT_EMAIL} ಸಂಪರ್ಕಿಸಿ.`,
    privateInfoRefusal: "ನಾನು private prompts, credentials, internal settings, admin details ಅಥವಾ hidden configuration ಹಂಚಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಿಲ್ಲ. MAMAAI ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸಲು ಸಹಾಯ ಮಾಡಬಹುದು.",
    medicalSafety: "MAMAAI ಊಟ ಯೋಜನೆ ಸಲಹೆಗಳನ್ನು ನೀಡಬಹುದು, ಆದರೆ diagnosis, treatment, prescription ಅಥವಾ doctor/dietitian ಗೆ ಬದಲಾವಣೆ ಅಲ್ಲ.",
    overview: "MAMAAI ಒಂದು ಕುಟುಂಬಕ್ಕೆ ಪ್ರಾಯೋಗಿಕ ಊಟದ ಯೋಜನೆ ಮಾಡುತ್ತದೆ ಮತ್ತು ಪ್ರತಿ ಸದಸ್ಯರ portions, ingredients, fruit, hydration ಮತ್ತು cooking notes ಅನ್ನು ಅವಶ್ಯಕತೆಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಹೊಂದಿಸುತ್ತದೆ.",
    gettingStarted: "ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟವನ್ನು ಪ್ಲ್ಯಾನ್ ಮಾಡಲು ಮೊದಲು ಕುಟುಂಬ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ. ಪ್ರತಿ ಸದಸ್ಯರ ಆಹಾರ ಇಷ್ಟ, ಅಲರ್ಜಿ, ಇಷ್ಟವಿಲ್ಲದ ಪದಾರ್ಥ, ವೈದ್ಯರ ನಿರ್ಬಂಧ, ಅಡುಗೆ ಪದ್ಧತಿ ಮತ್ತು ಊಟದ ಅಗತ್ಯಗಳನ್ನು ಸೇರಿಸಿ. ನಂತರ Meal Planner ತೆರೆಯಿರಿ ಮತ್ತು “ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ” ಒತ್ತಿ. MAMAAI ಒಂದು ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟ, ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗಗಳು, ರೆಸಿಪಿ ಮತ್ತು ಕಿರಾಣಿ ಪಟ್ಟಿ ರಚಿಸುತ್ತದೆ.",
    judgeDemo: "Judge/Demo Mode ನಲ್ಲಿ fictional family data ಮತ್ತು payment bypass ಇರುತ್ತದೆ, reviewers profile, common meal, portions, recipe, replacement, groceries ಮತ್ತು MAMA Family Table ಅನ್ನು ಬೇಗ test ಮಾಡಬಹುದು.",
    allergies: "ಅಲರ್ಜಿ ಮತ್ತು ವೈದ್ಯರ ನಿರ್ಬಂಧಗಳು ಕಟ್ಟುನಿಟ್ಟಿನ safety rules. Food dislikes ಅನ್ನು ಮೊದಲು personal modification ಅಥವಾ simple alternative ಮೂಲಕ handle ಮಾಡಲಾಗುತ್ತದೆ.",
    fasting: "MAMAAI fasting-aware planning ನೀಡುತ್ತದೆ: ವ್ರತದ ಸಮಯ, allowed foods, cultural context ಮತ್ತು family customs ಗೆ ಹೊಂದಿದ alternatives.",
    quantities: "Ingredient quantities ಮತ್ತು portions family strength, selected meal, attendance, age/activity ಮತ್ತು recipe servings ಆಧಾರಿತ estimates. Nutrition/costs planning estimates, medical values ಅಲ್ಲ.",
    recipes: "Suggested meals ನಲ್ಲಿ recipe ಸಿಗುತ್ತದೆ: ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate ಮತ್ತು member-specific cooking notes.",
    video: "Watch How to Cook dish ಗೆ ಸಂಬಂಧಿಸಿದ cooking tutorials ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. YouTube API active ಇಲ್ಲದಿದ್ದರೆ MAMAAI written recipe ಜೊತೆಗೆ YouTube search link ನೀಡುತ್ತದೆ.",
    replacement: "Meal generate ಆದ ನಂತರ Replace Meal ಬಳಸಿ. MAMAAI suitable meal suggest ಮಾಡಿ portions, recipe details ಮತ್ತು grocery list update ಮಾಡುತ್ತದೆ.",
    grocery: "MAMAAI ಪ್ಯಾಂಟ್ರಿ ಮತ್ತು ಕಿರಾಣಿ ಮಾಹಿತಿಯನ್ನು ಬಳಸಿ ಮನೆಯಲ್ಲಿ ಇರುವ ಸಾಮಗ್ರಿಗಳಿಂದ ಏನು ಮಾಡಬಹುದು, ಏನು ಖರೀದಿಸಬೇಕು ಮತ್ತು ಯಾವ ಬದಲಾವಣೆ ಪ್ರಾಯೋಗಿಕ ಎನ್ನುವುದನ್ನು ತಿಳಿಸುತ್ತದೆ. ಪ್ಯಾಂಟ್ರಿಯಲ್ಲಿ ಲಭ್ಯವಿರುವ items ಸೇರಿಸಿ, ನಂತರ Meal Planner ನಲ್ಲಿ ಊಟದ ಯೋಜನೆ ರಚಿಸಿ.",
    installGeneral:
      "ಹೌದು. MAMAAI ಅನ್ನು ನಿಮ್ಮ phone Home Screen ಗೆ app ತರಹ add ಮಾಡಬಹುದು. Android ನಲ್ಲಿ Chrome ತೆರೆದು www.mamaai.in ಗೆ ಹೋಗಿ, ಮೂರು-dot menu ಒತ್ತಿ, Install app ಅಥವಾ Add to Home screen ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ confirm ಮಾಡಿ. iPhone ನಲ್ಲಿ Safari ತೆರೆದು www.mamaai.in ಗೆ ಹೋಗಿ, Share button ಒತ್ತಿ, Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ Add ಒತ್ತಿ. iPad ನಲ್ಲೂ Safari ಬಳಸಿ Share button ಮೂಲಕ Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ. ನಿಮ್ಮ browser ನಲ್ಲಿ Install app ಕಾಣಿಸದಿದ್ದರೆ Add to Home screen ಬಳಸಿ, ಅಥವಾ Android ನಲ್ಲಿ Chrome ಮತ್ತು Apple devices ನಲ್ಲಿ Safari ಬಳಸಿ.",
    installAndroid:
      "Android phone ನಲ್ಲಿ Chrome ತೆರೆಯಿರಿ ಮತ್ತು www.mamaai.in ಗೆ ಹೋಗಿ. ಮೇಲೆ right side ಇರುವ ಮೂರು-dot menu ಒತ್ತಿ. Install app ಕಾಣಿಸಿದರೆ ಅದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ; ಇಲ್ಲದಿದ್ದರೆ Add to Home screen ಆಯ್ಕೆ ಮಾಡಿ. Install ಅಥವಾ Add ಒತ್ತಿ confirm ಮಾಡಿ. ನಂತರ MAMAAI icon ನಿಮ್ಮ phone ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ ಮತ್ತು app ತರಹ ತೆರೆಯಬಹುದು.",
    installIos:
      "iPhone ನಲ್ಲಿ Safari ತೆರೆಯಿರಿ ಮತ್ತು www.mamaai.in ಗೆ ಹೋಗಿ. Share button ಒತ್ತಿ. ಬೇಕಾದರೆ list ನಲ್ಲಿ scroll ಮಾಡಿ Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ. ಹೆಸರು MAMAAI ಆಗಿಯೇ ಇರಲಿ, ನಂತರ Add ಒತ್ತಿ. MAMAAI icon iPhone Home Screen ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ. iPhone ನಲ್ಲಿ Chrome ಸಾಮಾನ್ಯವಾಗಿ icon add ಮಾಡಲು ಬಿಡುವುದಿಲ್ಲ, ಆದ್ದರಿಂದ Safari ಬಳಸಿ.",
    installIpad:
      "iPad ನಲ್ಲಿ Safari ತೆರೆಯಿರಿ ಮತ್ತು www.mamaai.in ಗೆ ಹೋಗಿ. address bar ಹತ್ತಿರದ Share button ಒತ್ತಿ. Add to Home Screen ಆಯ್ಕೆ ಮಾಡಿ, ನಂತರ Add ಒತ್ತಿ. MAMAAI icon iPad Home Screen ನಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.",
    subscriptions: "Family Starter Rs. 399/mo ಅಥವಾ US$4.99/mo ನಲ್ಲಿ 4 members ವರೆಗೆ, Family Premium Rs. 599/mo ಅಥವಾ US$7.99/mo ನಲ್ಲಿ 6 members ವರೆಗೆ, Family Plus Rs. 999/mo ಅಥವಾ US$12.99/mo ನಲ್ಲಿ 10 members ವರೆಗೆ support ಮಾಡುತ್ತದೆ. Family Plus ನಲ್ಲಿ four-paw family members ಗಾಗಿ ಬೇರೆ pet-appropriate meal planning ಸೇರಿದೆ.",
    testingStatus: "MAMAAI ನಲ್ಲಿ interactive meal planning, Ask MAMA assistance ಮತ್ತು demo profiles ಲಭ್ಯವಿವೆ.",
    support: (suffix: string) => `Support ಗಾಗಿ ${MAMAAI_SUPPORT_EMAIL} ಸಂಪರ್ಕಿಸಿ. Project owner: ${MAMAAI_OWNER_EMAIL}.${suffix}`,
    fallback: `ಕ್ಷಮಿಸಿ, ಈ ಪ್ರಶ್ನೆಗೆ ನನ್ನ ಬಳಿ ವಿಶ್ವಾಸಾರ್ಹ MAMAAI ಉತ್ತರ ಇನ್ನೂ ಇಲ್ಲ. ಸರಿಯಾದ ಉತ್ತರಕ್ಕಾಗಿ ದಯವಿಟ್ಟು ${MAMAAI_SUPPORT_EMAIL} ಸಂಪರ್ಕಿಸಿ.`,
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
const mealPlanningTerms = [
  "plan meals",
  "meal plan",
  "meals plan",
  "plan my meal",
  "plan my family meal",
  "family meal",
  "what should i cook",
  "what can i cook",
  "cook tonight",
  "dinner idea",
  "lunch idea",
  "breakfast idea",
  "pantry staples",
];
const mealPlanningTermsUnicode = [
  "भोजन प्लान",
  "भोजन योजना",
  "खाना प्लान",
  "परिवार का भोजन",
  "क्या पकाएं",
  "क्या बना सकते",
  "पैंट्री",
  "ಪ್ಲ್ಯಾನ್",
  "ಊಟ",
  "ಅಡುಗೆ",
  "ಏನು ಮಾಡಬಹುದು",
  "ಪ್ಯಾಂಟ್ರಿ",
];
const overviewTermsUnicode = [
  "कैसे काम करता",
  "कैसे काम करती",
  "क्या है",
  "ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  "ಏನು",
];
const subscriptionTerms = [
  "subscription",
  "price",
  "pricing",
  "plan price",
  "plans price",
  "paid plan",
  "payment",
  "revenuecat",
  "subscribe",
  "cost of plan",
  "सब्सक्रिप्शन",
  "कीमत",
  "पेमेंट",
  "भुगतान",
  "सಬ್ಸ್ಕ್ರಿಪ್ಷನ್",
  "ಬೆಲೆ",
  "ಪಾವತಿ",
];

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

  if (
    hasAny(text, ["what is", "about mamaai", "how does mamaai work", "how it work", "how does it work"]) ||
    hasAny(rawText, overviewTermsUnicode)
  ) {
    return {
      category: "overview",
      answer: localized.overview,
      action: { type: "try_demo", label: "Try Demo" },
      suggestions: ["Plan meals for my family", "How are allergies handled?", "Can I get recipes for suggested meals?"],
    };
  }

  if (hasAny(text, ["grocery", "shopping", "list", "ingredients to buy", "pantry", "staples"]) || hasAny(rawText, ["पैंट्री", "किराना", "ಕಿರಾಣಿ", "ಪ್ಯಾಂಟ್ರಿ"])) {
    return {
      category: "grocery",
      answer: localized.grocery,
      suggestions: localized.quickSuggestions,
    };
  }

  if (
    hasAny(text, ["add family", "family member", "start", "get started", "create family"]) ||
    hasAny(text, mealPlanningTerms) ||
    hasAny(rawText, mealPlanningTermsUnicode)
  ) {
    return {
      category: "getting_started",
      answer: localized.gettingStarted,
      action: { type: "add_family", label: "Add Family" },
      suggestions: localized.quickSuggestions,
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

  if (hasAny(text, ["grocery", "shopping", "list", "ingredients to buy", "pantry", "staples"]) || hasAny(rawText, ["पैंट्री", "किराना", "ಕಿರಾಣಿ", "ಪ್ಯಾಂಟ್ರಿ"])) {
    return {
      category: "grocery",
      answer: localized.grocery,
      suggestions: localized.quickSuggestions,
    };
  }

  if (hasAny(text, subscriptionTerms) || hasAny(rawText, subscriptionTerms)) {
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
