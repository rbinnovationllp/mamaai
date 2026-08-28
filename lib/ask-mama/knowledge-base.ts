import type { AppLanguage } from "@/lib/i18n";

export type AskMamaCategory =
  | "overview"
  | "getting_started"
  | "judge_demo"
  | "install_app"
  | "family_profile"
  | "meal_planner"
  | "attendance"
  | "budget"
  | "meal_history"
  | "languages"
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
    overview: "MAMAAI is an AI-powered family food planner. It asks about your household, food preferences, allergies, restrictions, budget, pantry and who is eating today, then creates one practical family meal with member-wise portions, recipe steps, grocery needs, fruit/hydration notes and safer adjustments. The main idea is: one family, different needs, one intelligent meal plan.",
    gettingStarted: "To plan meals for your family, first create the family profile and add each member's food preference, allergies, dislikes, restrictions, cooking habit and meal needs. Then open Meal Planner and tap Plan Today's Family Meal. MAMAAI will generate one practical family meal with member-specific portions, recipe and grocery list.",
    familyProfile: "The family profile is where MAMAAI learns the real household: member names, age, relation, diet preference, allergies, doctor restrictions, dislikes, non-veg habits, cooking style, budget, weekly routine and recent meals. This information is used before meal planning so the plan fits the people actually eating.",
    mealPlanner: "The Meal Planner is the main action area. It checks your saved family profile, subscription or trial status, selected language, attendance for each meal, tiffin needs, pantry and recent food history, then generates today's family food plan. After generation you can view recipe details, grocery needs, member guidance and request another option.",
    attendance: "Before generating today's plan, MAMAAI can ask who is eating breakfast, lunch, high tea/snacks and dinner. Each member can be marked as eating at home, needing tiffin, or not eating. This helps MAMAAI cook for the real kitchen requirement instead of assuming everyone eats every meal.",
    budget: "MAMAAI can use a family budget preference such as economical, moderate, flexible, no specific limit or a custom monthly food budget. Budget guides dish choice, ingredients, grocery suggestions and substitutions, but it is a planning guide, not an exact bill promise.",
    mealHistory: "Recent meal history helps MAMAAI avoid repeating the same dish again and again. If the family tells what they ate in the last 7 days, MAMAAI uses that pattern to improve variety and suggest better alternatives.",
    languages: "MAMAAI supports English, Hindi and Kannada on the main customer pages and Ask MAMA. The selected language should be used for product help and meal-planning output wherever possible.",
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
    overview: "MAMAAI एक AI-संचालित पारिवारिक भोजन योजनाकार है। यह परिवार के सदस्यों, उनकी उम्र, भोजन पसंद, एलर्जी, डॉक्टर की पाबंदी, बजट, पैंट्री और आज कौन-कौन खाएगा जैसी जानकारी देखकर एक व्यावहारिक साझा भोजन बनाता है। फिर हर सदस्य के लिए मात्रा, बदलाव, रेसिपी, किराना, फल और पानी से जुड़ी सलाह अलग से देता है। इसका मूल विचार है: एक परिवार, अलग-अलग जरूरतें, एक समझदार भोजन योजना।",
    gettingStarted: "अपने परिवार का भोजन प्लान करने के लिए पहले परिवार प्रोफाइल बनाएं। हर सदस्य की भोजन पसंद, एलर्जी, नापसंद, डॉक्टर की पाबंदी, खाना बनाने की आदत और भोजन की जरूरतें जोड़ें। फिर Meal Planner खोलकर “आज का पारिवारिक भोजन प्लान करें” दबाएं। MAMAAI एक साझा भोजन, सदस्य-विशेष हिस्से, रेसिपी और किराने की सूची बनाएगा।",
    familyProfile: "Family Profile में MAMAAI आपके घर की जरूरी जानकारी सीखता है: सदस्यों के नाम, उम्र, रिश्ता, भोजन पसंद, एलर्जी, डॉक्टर की पाबंदी, नापसंद, नॉन-वेज आदत, खाना पकाने की शैली, बजट, साप्ताहिक रूटीन और हाल के भोजन। Meal Planner इसी जानकारी का उपयोग करके परिवार के लिए सही योजना बनाता है।",
    mealPlanner: "Meal Planner MAMAAI का मुख्य काम करने वाला हिस्सा है। यह आपकी सेव की हुई family profile, trial या subscription status, चुनी हुई भाषा, हर meal की attendance, tiffin जरूरत, pantry और recent meals देखकर आज का परिवार भोजन प्लान बनाता है। Plan बनने के बाद आप recipe, grocery list, member-wise guidance और दूसरा meal option देख सकते हैं।",
    attendance: "आज का भोजन बनाने से पहले MAMAAI पूछ सकता है कि breakfast, lunch, high tea/snacks और dinner में कौन-कौन खाएगा। हर सदस्य को घर पर खाना, tiffin चाहिए या यह meal नहीं खाएंगे के रूप में चुना जा सकता है। इससे मात्रा और grocery सही लोगों के हिसाब से बनती है।",
    budget: "MAMAAI family budget preference जैसे economical, moderate, flexible, no specific limit या custom monthly food budget का उपयोग कर सकता है। Budget dish, ingredients, grocery और substitutions को practical बनाता है, लेकिन यह exact bill guarantee नहीं है।",
    mealHistory: "Recent meal history से MAMAAI बार-बार वही dish suggest करने से बचता है। अगर परिवार पिछले 7 दिनों में क्या खाया बताता है, तो MAMAAI variety और बेहतर alternatives देने के लिए उस pattern का उपयोग करता है।",
    languages: "MAMAAI मुख्य customer pages और Ask MAMA में English, Hindi और Kannada support करता है। चुनी हुई भाषा product help और meal-planning output में जहां संभव हो इस्तेमाल होनी चाहिए।",
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
    overview: "MAMAAI ಒಂದು AI ಆಧಾರಿತ ಕುಟುಂಬ ಆಹಾರ ಯೋಜಕ. ಇದು ಕುಟುಂಬದ ಸದಸ್ಯರು, ವಯಸ್ಸು, ಆಹಾರ ಇಷ್ಟಗಳು, ಅಲರ್ಜಿಗಳು, ವೈದ್ಯರ ನಿರ್ಬಂಧಗಳು, ಬಜೆಟ್, ಪ್ಯಾಂಟ್ರಿ ಮತ್ತು ಇಂದು ಯಾರು ಊಟ ಮಾಡುತ್ತಾರೆ ಎಂಬ ಮಾಹಿತಿಯನ್ನು ನೋಡಿ ಒಂದು ಪ್ರಾಯೋಗಿಕ ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸುತ್ತದೆ. ನಂತರ ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ ಬೇರೆ ಪ್ರಮಾಣ, ಬದಲಾವಣೆ, ರೆಸಿಪಿ, ಕಿರಾಣಿ, ಹಣ್ಣು ಮತ್ತು ನೀರಿನ ಸಲಹೆ ನೀಡುತ್ತದೆ.",
    gettingStarted: "ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟವನ್ನು ಪ್ಲ್ಯಾನ್ ಮಾಡಲು ಮೊದಲು ಕುಟುಂಬ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ. ಪ್ರತಿ ಸದಸ್ಯರ ಆಹಾರ ಇಷ್ಟ, ಅಲರ್ಜಿ, ಇಷ್ಟವಿಲ್ಲದ ಪದಾರ್ಥ, ವೈದ್ಯರ ನಿರ್ಬಂಧ, ಅಡುಗೆ ಪದ್ಧತಿ ಮತ್ತು ಊಟದ ಅಗತ್ಯಗಳನ್ನು ಸೇರಿಸಿ. ನಂತರ Meal Planner ತೆರೆಯಿರಿ ಮತ್ತು “ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ” ಒತ್ತಿ. MAMAAI ಒಂದು ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟ, ಸದಸ್ಯರಿಗನುಗುಣ ಭಾಗಗಳು, ರೆಸಿಪಿ ಮತ್ತು ಕಿರಾಣಿ ಪಟ್ಟಿ ರಚಿಸುತ್ತದೆ.",
    familyProfile: "Family Profile ನಲ್ಲಿ MAMAAI ಮನೆಯ ಮುಖ್ಯ ಮಾಹಿತಿಯನ್ನು ಕಲಿಯುತ್ತದೆ: ಸದಸ್ಯರ ಹೆಸರು, ವಯಸ್ಸು, ಸಂಬಂಧ, ಆಹಾರ ಇಷ್ಟ, ಅಲರ್ಜಿ, ವೈದ್ಯರ ನಿರ್ಬಂಧ, ಇಷ್ಟವಿಲ್ಲದ ಪದಾರ್ಥಗಳು, ನಾನ್-ವೆಜ್ ಅಭ್ಯಾಸ, ಅಡುಗೆ ಶೈಲಿ, ಬಜೆಟ್, ವಾರದ ರೂಟಿನ್ ಮತ್ತು ಇತ್ತೀಚಿನ ಊಟಗಳು. Meal Planner ಈ ಮಾಹಿತಿಯನ್ನು ಬಳಸಿ ಸೂಕ್ತ ಕುಟುಂಬ ಊಟವನ್ನು ಯೋಜಿಸುತ್ತದೆ.",
    mealPlanner: "Meal Planner MAMAAI ಯ ಮುಖ್ಯ ಕಾರ್ಯಸ್ಥಳ. ಇದು ಉಳಿಸಿದ family profile, trial ಅಥವಾ subscription status, ಆಯ್ದ ಭಾಷೆ, ಪ್ರತಿ meal attendance, tiffin ಅಗತ್ಯ, pantry ಮತ್ತು recent meals ನೋಡಿ ಇಂದಿನ ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆ ರಚಿಸುತ್ತದೆ. ನಂತರ recipe, grocery list, member-wise guidance ಮತ್ತು another meal option ನೋಡಬಹುದು.",
    attendance: "ಇಂದಿನ ಊಟ ಯೋಜಿಸುವ ಮೊದಲು MAMAAI breakfast, lunch, high tea/snacks ಮತ್ತು dinner ಗೆ ಯಾರು ಇರುತ್ತಾರೆ ಎಂದು ಕೇಳಬಹುದು. ಪ್ರತಿ ಸದಸ್ಯರನ್ನು ಮನೆಯಲ್ಲಿ ಊಟ, tiffin ಬೇಕು ಅಥವಾ ಈ meal ತಿನ್ನುವುದಿಲ್ಲ ಎಂದು ಗುರುತಿಸಬಹುದು. ಇದರಿಂದ quantity ಮತ್ತು grocery ನಿಜವಾದ ಅಗತ್ಯಕ್ಕೆ ಸರಿಹೊಂದುತ್ತದೆ.",
    budget: "MAMAAI economical, moderate, flexible, no specific limit ಅಥವಾ custom monthly food budget ಎಂಬ family budget preference ಅನ್ನು ಬಳಸಬಹುದು. Budget dish, ingredients, grocery ಮತ್ತು substitutions ಅನ್ನು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಇಡುತ್ತದೆ; ಆದರೆ ಇದು exact bill guarantee ಅಲ್ಲ.",
    mealHistory: "Recent meal history MAMAAIಗೆ ಅದೇ dish ಅನ್ನು ಮರುಮರು suggest ಮಾಡುವುದನ್ನು ತಪ್ಪಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಕುಟುಂಬ ಕಳೆದ 7 ದಿನಗಳಲ್ಲಿ ಏನು ತಿಂದಿತು ಎಂದು ತಿಳಿಸಿದರೆ, MAMAAI variety ಮತ್ತು ಉತ್ತಮ alternatives ಕೊಡಲು ಆ pattern ಬಳಸುತ್ತದೆ.",
    languages: "MAMAAI ಮುಖ್ಯ customer pages ಮತ್ತು Ask MAMA ನಲ್ಲಿ English, Hindi ಮತ್ತು Kannada support ಮಾಡುತ್ತದೆ. ಆಯ್ದ ಭಾಷೆಯನ್ನು product help ಮತ್ತು meal-planning output ನಲ್ಲಿ ಸಾಧ್ಯವಾದಷ್ಟು ಬಳಸಬೇಕು.",
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
const familyProfileTerms = [
  "family profile",
  "profile",
  "add member",
  "family member",
  "member age",
  "diet preference",
  "food preference",
  "cooking habit",
  "weekly routine",
];
const familyProfileTermsUnicode = [
  "फैमिली प्रोफाइल",
  "परिवार प्रोफाइल",
  "सदस्य",
  "उम्र",
  "भोजन पसंद",
  "खाना बनाने",
  "साप्ताहिक",
  "ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್",
  "ಸದಸ್ಯ",
  "ವಯಸ್ಸು",
  "ಆಹಾರ ಇಷ್ಟ",
  "ಅಡುಗೆ ಪದ್ಧತಿ",
  "ವಾರದ",
];
const attendanceTerms = [
  "attendance",
  "who is eating",
  "tiffin",
  "packed meal",
  "eating at home",
  "not eating",
  "present for lunch",
  "present for dinner",
];
const attendanceTermsUnicode = [
  "कौन खाएगा",
  "कौन-कौन खाएगा",
  "टिफिन",
  "घर पर",
  "नहीं खाएंगे",
  "ಯಾರು ಊಟ",
  "ಟಿಫಿನ್",
  "ಮನೆಯಲ್ಲಿ",
  "ತಿನ್ನುವುದಿಲ್ಲ",
];
const budgetTerms = [
  "budget",
  "economical",
  "moderate",
  "flexible",
  "monthly food budget",
  "affordable",
  "low cost",
  "expensive",
];
const budgetTermsUnicode = [
  "बजट",
  "किफायती",
  "सस्ता",
  "महंगा",
  "मासिक",
  "ಬಜೆಟ್",
  "ಕಡಿಮೆ ವೆಚ್ಚ",
  "ಮಿತವ್ಯಯ",
  "ದುಬಾರಿ",
];
const mealHistoryTerms = [
  "last 7 days",
  "recent meal",
  "meal history",
  "avoid repeat",
  "repeated",
  "same dish",
  "khichdi again",
  "variety",
];
const mealHistoryTermsUnicode = [
  "पिछले 7 दिन",
  "हाल के भोजन",
  "बार-बार",
  "दोहर",
  "विविधता",
  "खिचड़ी",
  "ಕಳೆದ 7 ದಿನ",
  "ಇತ್ತೀಚಿನ ಊಟ",
  "ಮರುಮರು",
  "ವೈವಿಧ್ಯ",
];
const overviewTermsUnicode = [
  "कैसे काम करता",
  "कैसे काम करती",
  "मामाआई क्या",
  "मामा एआई क्या",
  "MAMAAI क्या",
  "ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  "MAMAAI ಏನು",
  "ಮಾಮಾ ಎಐ ಏನು",
];
const languageTerms = [
  "language",
  "hindi",
  "kannada",
  "english",
  "translate",
  "multilingual",
];
const languageTermsUnicode = [
  "भाषा",
  "हिंदी",
  "हिन्दी",
  "कन्नड़",
  "अनुवाद",
  "ಭಾಷೆ",
  "ಕನ್ನಡ",
  "ಇಂಗ್ಲಿಷ್",
  "ಹಿಂದಿ",
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

  if (hasAny(text, familyProfileTerms) || hasAny(rawText, familyProfileTermsUnicode)) {
    return {
      category: "family_profile",
      answer: localized.familyProfile,
      action: { type: "add_family", label: "Add Family" },
      suggestions: localized.quickSuggestions,
    };
  }

  if (hasAny(text, attendanceTerms) || hasAny(rawText, attendanceTermsUnicode)) {
    return {
      category: "attendance",
      answer: localized.attendance,
      suggestions: ["Plan meals for my family", "How are ingredient quantities calculated?", "How does grocery planning work?"],
    };
  }

  if (hasAny(text, budgetTerms) || hasAny(rawText, budgetTermsUnicode)) {
    return {
      category: "budget",
      answer: localized.budget,
      suggestions: ["Plan meals for my family", "How does grocery planning work?", "Show subscription plans"],
    };
  }

  if (hasAny(text, mealHistoryTerms) || hasAny(rawText, mealHistoryTermsUnicode)) {
    return {
      category: "meal_history",
      answer: localized.mealHistory,
      suggestions: ["How do I replace a meal?", "Plan meals for my family", "How are ingredient quantities calculated?"],
    };
  }

  if (hasAny(text, languageTerms) || hasAny(rawText, languageTermsUnicode)) {
    return {
      category: "languages",
      answer: localized.languages,
      suggestions: localized.quickSuggestions,
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
    hasAny(text, ["add family", "start", "get started", "create family"]) ||
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
