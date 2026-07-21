export type AskMamaCategory =
  | "overview"
  | "getting_started"
  | "judge_demo"
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
  "Show subscription plans"
];

const promptAttackTerms = [
  "system prompt",
  "developer message",
  "api key",
  "secret key",
  "password",
  "internal config",
  "ignore previous",
  "bypass",
  "admin token"
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
  "pregnancy complication"
];

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function cleanQuestion(question: string) {
  return question.toLowerCase().replace(/[^a-z0-9\s/-]/g, " ");
}

export function answerAskMama(question: string, detailed = false): AskMamaAnswer {
  const text = cleanQuestion(question);
  const suffix = detailed
    ? " I can explain the next step in more detail once you choose the area you want to open."
    : "";

  if (!question.trim()) {
    return {
      category: "unknown",
      answer: "Please ask me about MAMAAI, demo access, family setup, allergies, recipes, groceries, or subscriptions.",
      suggestions: quickSuggestions,
      unresolved: true
    };
  }

  if (hasAny(text, promptAttackTerms)) {
    return {
      category: "support",
      answer:
        "I cannot share private prompts, credentials, internal settings, admin details, or hidden configuration. I can still help you use MAMAAI safely.",
      suggestions: quickSuggestions
    };
  }

  if (hasAny(text, medicalTerms)) {
    return {
      category: "medical_safety",
      answer:
        "MAMAAI can give food-planning suggestions, but it does not diagnose, treat, prescribe, or replace a doctor or dietitian. For medical conditions, use MAMAAI suggestions only with professional guidance.",
      suggestions: ["How are allergies handled?", "Can it plan meals for fasting days?", "Can I get recipes for suggested meals?"]
    };
  }

  if (hasAny(text, ["what is", "about mamaai", "how does mamaai work", "how it work", "how does it work"])) {
    return {
      category: "overview",
      answer:
        "MAMAAI helps one family plan one practical meal while still adapting portions, ingredients, fruit, hydration, and cooking notes for each member. The hackathon demo focuses on the full family-meal flow.",
      action: { type: "try_demo", label: "Try Demo" },
      suggestions: ["Plan meals for my family", "How are allergies handled?", "Can I get recipes for suggested meals?"]
    };
  }

  if (hasAny(text, ["add family", "family member", "start", "get started", "plan meals for my family", "create family"])) {
    return {
      category: "getting_started",
      answer:
        "Start by creating a family, then add members with age, activity level, food pattern, allergies, dislikes, restrictions, fasting needs, and meal attendance. After that MAMAAI can generate the next family meal.",
      action: { type: "add_family", label: "Add Family" },
      suggestions: ["How are allergies handled?", "How are ingredient quantities calculated?", "How do I replace a meal?"]
    };
  }

  if (hasAny(text, ["judge", "demo", "devpost", "try demo"])) {
    return {
      category: "judge_demo",
      answer:
        "Judge/Demo Mode uses fictional family data and bypasses login and payment so reviewers can test the core flow quickly: profile, common meal, personal portions, recipe, replacement, groceries, and MAMA Family Table.",
      action: { type: "try_demo", label: "Open Judge Demo" },
      suggestions: ["Can I get recipes for suggested meals?", "How does grocery planning work?", "Show subscription plans"]
    };
  }

  if (hasAny(text, ["allergy", "allergies", "dislike", "never include", "restriction", "avoid food"])) {
    return {
      category: "allergies",
      answer:
        "Allergies and medical restrictions are hard safety rules. Food dislikes are handled more flexibly: MAMAAI first tries personal modifications or a simple alternative before changing the whole family meal.",
      suggestions: ["Plan meals for my family", "How are ingredient quantities calculated?", "Can I get recipes for suggested meals?"]
    };
  }

  if (hasAny(text, ["fast", "fasting", "vrat", "upvas", "festival"])) {
    return {
      category: "fasting",
      answer:
        "MAMAAI has architecture and demo support for fasting-aware planning, including fasting windows, allowed foods, cultural context, and alternatives. Production depth will expand as more regional rules are added.",
      suggestions: ["How are allergies handled?", "Can I get recipes for suggested meals?", "Show subscription plans"]
    };
  }

  if (hasAny(text, ["quantity", "quantities", "portion", "serving", "nutrition", "protein", "calorie", "cost"])) {
    return {
      category: "quantities",
      answer:
        "Ingredient quantities and portions are estimated from family strength, selected meal, meal attendance, member age/activity, and recipe servings. Nutrition and costs are estimates for planning, not medical values.",
      suggestions: ["Can I get recipes for suggested meals?", "How does grocery planning work?", "How are allergies handled?"]
    };
  }

  if (hasAny(text, ["recipe", "cook", "how to cook", "ingredients", "instruction"])) {
    return {
      category: "recipes",
      answer:
        "Suggested meals include a View Recipe / How to Cook option with ingredients, quantities, servings, steps, time, difficulty, nutrition estimate, cost estimate, alternatives, and member-specific preparation notes.",
      suggestions: ["Watch cooking video", "How do I replace a meal?", "How does grocery planning work?"]
    };
  }

  if (hasAny(text, ["youtube", "video", "watch"])) {
    return {
      category: "video",
      answer:
        "Watch How to Cook is visible as a production-planned feature. If the YouTube Data API is not configured in the testing build, MAMAAI shows a clear unavailable notice and keeps the written recipe available.",
      suggestions: ["Can I get recipes for suggested meals?", "What is unavailable in test version?", "How does MAMAAI work?"]
    };
  }

  if (hasAny(text, ["replace", "change meal", "another meal", "swap"])) {
    return {
      category: "replacement",
      answer:
        "Use Replace Meal after generating a plan. MAMAAI suggests another suitable meal and updates portions, modifications, recipe details, and the grocery list where available.",
      suggestions: ["How does grocery planning work?", "How are allergies handled?", "Plan meals for my family"]
    };
  }

  if (hasAny(text, ["grocery", "shopping", "list", "ingredients to buy"])) {
    return {
      category: "grocery",
      answer:
        "The grocery list is created from the selected meal and family portions. When a meal is replaced, the list updates so the family can see what ingredients and approximate quantities are needed.",
      suggestions: ["How are ingredient quantities calculated?", "Can I get recipes for suggested meals?", "Show subscription plans"]
    };
  }

  if (hasAny(text, ["subscription", "price", "pricing", "plan", "revenuecat", "payment"])) {
    return {
      category: "subscriptions",
      answer:
        "Current planned plans are Family Starter at INR 199/month for up to 4 members, Family Premium at INR 399/month for up to 6, and Family Plus at INR 599/month for up to 10. Judge/Demo Mode bypasses payment safely.",
      suggestions: ["How does MAMAAI work?", "Plan meals for my family", "What is unavailable in test version?"]
    };
  }

  if (hasAny(text, ["testing", "unavailable", "coming", "production", "api", "status"])) {
    return {
      category: "testing_status",
      answer:
        "You are using a testing version of MAMAAI. Core demo meal planning is usable, while optional external-service features such as recipe video discovery may be limited until production integrations are activated.",
      suggestions: ["Can I get recipes for suggested meals?", "Watch cooking video", "Show subscription plans"]
    };
  }

  if (hasAny(text, ["support", "contact", "owner", "email", "help"])) {
    return {
      category: "support",
      answer: `For support, contact ${MAMAAI_SUPPORT_EMAIL}. Project owner contact: ${MAMAAI_OWNER_EMAIL}.${suffix}`,
      action: { type: "contact_support", label: "Email Support" },
      suggestions: quickSuggestions
    };
  }

  return {
    category: "unknown",
    answer:
      "I can help with MAMAAI features, demo mode, family setup, allergies, fasting, quantities, recipes, meal replacement, groceries, subscriptions, and support. Try one of the quick questions below.",
    suggestions: quickSuggestions,
    unresolved: true
  };
}
