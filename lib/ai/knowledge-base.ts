export interface KnowledgeChunk {
    id: string;
    domain: string;
    topic: string;
    subtopic: string;
    intents: string[];
    keywords: string[];
    canonicalFacts: string;
    featureStatus: 'IMPLEMENTED' | 'BETA' | 'PLANNED';
}

export const MAMAAI_KB_VERSION = '2026.08.PRD-v2.4';
export const MAMAAI_KB_LAST_UPDATED = '2026-08-28';

export const MAMAAI_KNOWLEDGE_BASE: KnowledgeChunk[] = [
    {
        id: '01_PRODUCT_OVERVIEW',
        domain: 'Product Overview',
        topic: 'What is MAMAAI',
        subtopic: 'Core Purpose & Vision',
        intents: ['what is mamaai', 'how does it work', 'about mamaai', 'मामा एआई क्या है', 'ಮಾಮಾ ಎಐ ಎಂದರೇನು'],
        keywords: ['mamaai', 'overview', 'family meal planning', 'nutrition', 'indian households', 'multigenerational'],
        canonicalFacts:
            'MAMAAI is an AI-powered intelligent family meal planner designed for Indian and multi-generational households. It designs a single common family meal with personalized member-level customizations (age, medical conditions, diabetes, allergies, portion requirements, likes/dislikes) instead of forcing separate meals.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '05_FAMILY_PROFILE',
        domain: 'Family Profile',
        topic: 'Household Configuration',
        subtopic: 'Members, Age, and Dietary Constraints',
        intents: ['how to setup family profile', 'add family members', 'परिवार प्रोफाइल कैसे बनाएं', 'ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್'],
        keywords: ['family profile', 'members', 'allergies', 'restrictions', 'preferences', 'dislikes'],
        canonicalFacts:
            'Family Profile captures every dining member with their relation, age, activity level, dietary preference (veg, non-veg, eggetarian, vegan, jain, satvik), allergies, doctor restrictions, and food dislikes. All meal recommendations strictly satisfy hard medical and allergy constraints.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '11_MEAL_TIMINGS',
        domain: 'Meal Timings',
        topic: 'Family Meal Timing Routine',
        subtopic: 'Local Device Time Auto-Detection',
        intents: ['meal timings', 'schedule', 'timing routine', 'भोजन का समय', 'ಊಟದ ಸಮಯ'],
        keywords: ['breakfast timing', 'lunch timing', 'high tea timing', 'dinner timing', 'local clock'],
        canonicalFacts:
            'Families can optionally save their regular timings for Breakfast, Lunch, High Tea, and Dinner. When opening the planner, MAMAAI checks the user local device clock and saved timings to auto-detect the upcoming meal without forcing manual dropdown selection.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '12_DAILY_MEMBER_ATTENDANCE',
        domain: 'Daily Attendance',
        topic: 'Meal-Wise Member Attendance & Tiffin',
        subtopic: 'Home, Tiffin, and Away Tracking',
        intents: ['who is eating', 'attendance', 'tiffin planning', 'आज कौन खाएगा', 'ಇಂದು ಯಾರು ಊಟ ಮಾಡುತ್ತಾರೆ'],
        keywords: ['attendance', 'tiffin', 'dabba', 'eating out', 'skip meal', 'portions', 'office tiffin'],
        canonicalFacts:
            'Before planning meals, MAMAAI lets users mark each member as Eating at Home, Packing Tiffin, or Not Eating. This ensures recipes, portion scaling, grocery lists, and pantry deductions only compute for members actually dining or needing a packed dabba.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '14_LAST_7_DAYS_HISTORY',
        domain: 'Meal History',
        topic: 'Repetition Prevention & Variety',
        subtopic: 'Intelligent Rotation & Khichdi Control',
        intents: ['why ask 7 day history', 'repeated khichdi', 'meal variety', 'खाने में विविधता', 'ಊಟದ ವೈವಿಧ್ಯತೆ'],
        keywords: ['7 day history', 'variety', 'repetition', 'khichdi', 'rotation', 'dishes'],
        canonicalFacts:
            'MAMAAI tracks the last 7 days of meal history to prevent monotonous repetition (such as repeated Khichdi). It rotates across diverse regional staples (Paneer dishes, Roti-Dal-Sabzi, Pulao, Dosa/Idli, Thepla) and supports in-place replacement via "Show Me Another Option".',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '20_PANTRY',
        domain: 'Pantry Management',
        topic: 'Inventory & Grocery Deductions',
        subtopic: 'Metric Unit Deficit Calculation',
        intents: ['what is pantry', 'how to use pantry', 'पैंट्री क्या है', 'ಪ್ಯಾಂಟ್ರಿ ಎಂದರೇನು'],
        keywords: ['pantry', 'stock', 'ingredients', 'grams', 'liters', 'grocery deficit'],
        canonicalFacts:
            'Pantry stores household ingredient stock. The deterministic grocery engine converts metric units (g, kg, ml, L) and subtracts available pantry stock from required meal ingredients, ensuring the shopping list only includes missing items.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '27_SUBSCRIPTION_PLANS',
        domain: 'Subscriptions & Pricing',
        topic: 'Tier Comparison & Razorpay',
        subtopic: 'Starter, Premium, Family Plus',
        intents: ['subscription plans', 'pricing', 'starter vs premium', 'कीमत क्या है', 'ಚಂದಾದಾರಿಕೆ ಯೋಜನೆಗಳು'],
        keywords: ['starter', 'premium', 'family plus', 'pricing', '₹399', '₹599', '₹999', 'trial', 'razorpay'],
        canonicalFacts:
            'MAMAAI offers three subscription tiers: Starter (₹399/mo, up to 4 members), Premium (₹599/mo, up to 6 members), and Family Plus (₹999/mo, multi-generation and 4-paw pet planning). A 3-day frictionless free trial is granted upon onboarding.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '30_FAMILY_PLUS_FOUR_PAW',
        domain: 'Four-Paw Family',
        topic: 'Pet Meal Planning',
        subtopic: 'Canine & Feline Safe Food Guidelines',
        intents: ['pet meal planning', 'dog food', 'four paw family', 'पालतू जानवरों का भोजन', 'ಸಾಕುಪ್ರಾಣಿಗಳ ಊಟ'],
        keywords: ['four paw', 'pet meal', 'dog', 'cat', 'safe pet diet', 'family plus'],
        canonicalFacts:
            'Family Plus tier includes dedicated Four-Paw Family planning. It provides vet-safe, species-appropriate home-cooked meal guidance for dogs and cats, strictly omitting toxic human ingredients (onions, garlic, chocolate, grapes, xylitol).',
        featureStatus: 'BETA',
    },
    {
        id: '31_BUDGET_AWARE_PLANNING',
        domain: 'Budget Intelligence',
        topic: 'Family Food Budget Preference',
        subtopic: 'Economical, Moderate, Flexible, and Custom Budget Planning',
        intents: ['food budget', 'budget meal planning', 'affordable meals', 'किफायती भोजन', 'ಬಜೆಟ್ ಊಟ'],
        keywords: ['budget', 'economical', 'moderate', 'flexible', 'custom monthly budget', 'affordable', 'low cost'],
        canonicalFacts:
            'MAMAAI lets families save a food budget preference: economical, moderate, flexible, no specific limit, or custom monthly budget. The planner uses this preference to guide dish choice, ingredient cost, grocery recommendations, substitutions, and premium ingredient frequency. Budget is a planning guideline, not an exact bill guarantee.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '32_MIXED_DIET_JOINT_FAMILY',
        domain: 'Family Meal Optimizer',
        topic: 'Mixed Vegetarian and Non-Vegetarian Family Planning',
        subtopic: 'Common Base Meal with Optional Add-ons',
        intents: ['mixed family meal', 'veg and non veg family', 'semi vegetarian', 'परिवार में वेज और नॉन वेज', 'ಮಿಶ್ರ ಆಹಾರ ಕುಟುಂಬ'],
        keywords: ['mixed diet', 'vegetarian', 'non vegetarian', 'eggetarian', 'semi vegetarian', 'vegan', 'common base meal', 'add-on'],
        canonicalFacts:
            'MAMAAI prefers one common base meal for mixed-diet households, then adds vegetarian, eggetarian, vegan, or non-vegetarian components only for members who eat them. Safety and explicit family preference come first; country or region should provide context but never override what the family actually selected.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '34_LANGUAGE_SUPPORT',
        domain: 'Multilingual Experience',
        topic: 'English, Hindi and Kannada',
        subtopic: 'Customer-Facing Language Consistency',
        intents: ['language support', 'hindi output', 'kannada output', 'भाषा बदलें', 'ಕನ್ನಡ ಭಾಷೆ'],
        keywords: ['language', 'english', 'hindi', 'kannada', 'translation', 'multilingual', 'devanagari'],
        canonicalFacts:
            'MAMAAI supports English, Hindi, and Kannada across the main customer surfaces. Ask MAMA and meal planning should respond in the selected language, while brand names such as MAMAAI, Razorpay, YouTube, Starter, Premium, and Family Plus may remain recognizable.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '35_RECIPE_VIDEO_GUIDANCE',
        domain: 'Recipe Videos',
        topic: 'Watch How to Cook',
        subtopic: 'Approved Videos and YouTube Search Fallback',
        intents: ['watch how to cook', 'recipe video', 'youtube recipe', 'रेसिपी वीडियो', 'ರೆಸಿಪಿ ವಿಡಿಯೋ'],
        keywords: ['video', 'youtube', 'watch', 'how to cook', 'approved recipe video', 'sponsored'],
        canonicalFacts:
            'MAMAAI can show a Watch How to Cook option for generated recipes. Approved recipe-video mappings are preferred first. If direct video lookup is unavailable, MAMAAI provides a suitable YouTube search link with clear third-party and safety disclaimers. Sponsored placements must be clearly labelled when present.',
        featureStatus: 'BETA',
    },
    {
        id: '36_SABSEWA_LOCAL',
        domain: 'Local Grocery Connection',
        topic: 'SabSewa Local Future Connection',
        subtopic: 'Local Vendor and Grocery Fulfilment Direction',
        intents: ['sabsewa', 'local vendors', 'buy groceries', 'grocery delivery', 'स्थानीय विक्रेता', 'ಸ್ಥಳೀಯ ಅಂಗಡಿ'],
        keywords: ['sabsewa', 'local vendor', 'grocery', 'buy local', 'partner', 'www.sabsewa.in'],
        canonicalFacts:
            'For Indian users, MAMAAI may encourage buying grocery requirements from local vendors and can mention SabSewa Local at www.sabsewa.in as the intended local-commerce connection. This should be framed as optional/community-oriented unless a live fulfilment integration is active.',
        featureStatus: 'PLANNED',
    },
    {
        id: '37_SECURITY_PRIVACY',
        domain: 'Security and Privacy',
        topic: 'Safe Product Boundaries',
        subtopic: 'Secrets, Medical Safety, and User Data',
        intents: ['is mamaai safe', 'privacy', 'medical advice', 'secret key', 'क्या सुरक्षित है', 'ಗೌಪ್ಯತೆ'],
        keywords: ['privacy', 'security', 'secret', 'api key', 'medical safety', 'doctor', 'dietitian', 'allergy'],
        canonicalFacts:
            'MAMAAI should never expose private prompts, credentials, API keys, admin details, or hidden configuration. It provides food-planning suggestions for information and education, not diagnosis, treatment, prescriptions, medication changes, or a replacement for doctor or dietitian advice. Allergies and doctor restrictions are hard safety constraints.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '33_INSTALLATION_PWA',
        domain: 'App Installation',
        topic: 'PWA & Mobile Use',
        subtopic: 'Add to Home Screen',
        intents: ['how to install app', 'pwa', 'download mamaai', 'ऐप कैसे इंस्टॉल करें', 'ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್'],
        keywords: ['install', 'pwa', 'home screen', 'android', 'ios', 'chrome', 'safari'],
        canonicalFacts:
            'MAMAAI is a Progressive Web App (PWA). On Android (Chrome), tap "Install" or "Add to Home Screen". On iOS (Safari), tap the Share button and select "Add to Home Screen" for instant, app-like access without app store friction.',
        featureStatus: 'IMPLEMENTED',
    },
    {
        id: '38_TROUBLESHOOTING',
        domain: 'Troubleshooting',
        topic: 'Common Issues & Support',
        subtopic: 'Payment, Session, and Generation Issues',
        intents: ['payment failed', 'meal plan error', 'profile not loading', 'समस्या निवारण', 'ದೋಷ ಪರಿಹಾರ'],
        keywords: ['troubleshooting', 'error', 'payment pending', 'login issue', 'support'],
        canonicalFacts:
            'If payment completes but your subscription is not showing, navigate to the Subscription page and tap "Sync Status". If meal generation fails, check member attendance selections and verify your network connection. Real-time support is available via support@mamaai.in.',
        featureStatus: 'IMPLEMENTED',
    },
];
