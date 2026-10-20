import type { FamilyMember } from "@/lib/shared/contracts";
import { evaluateIngredientSafety, type SafetyResult } from "./safety-validation-service";

export type AskMamaRequestKind = "general" | "specific_food_advice";
export type AskMamaModelResponse = {
  kind: "general" | "meal_recommendation";
  answer: string;
  meals?: Array<{ name: string; ingredients: string[]; preparationNotes?: string[] }>;
};
export type AskMamaResponseDecision = {
  allowed: boolean;
  needsClarification: boolean;
  response?: AskMamaModelResponse;
  safety?: SafetyResult;
  message?: string;
};

const foodAdviceTerms = [
  "meal", "recipe", "cook", "cooking", "ingredient", "substitut", "replace", "dinner", "lunch", "breakfast", "snack", "food", "eat", "allergy", "allergic", "fast", "fasting", "infant", "baby", "diabetes",
  "खाना", "भोजन", "रेसिपी", "पकाएं", "सामग्री", "एलर्जी", "व्रत", "उपवास", "बच्चा", "शिशु",
  "ಊಟ", "ಅಡುಗೆ", "ಪಾಕವಿಧಾನ", "ಪದಾರ್ಥ", "ಅಲರ್ಜಿ", "ಉಪವಾಸ", "ಮಗು",
];

const knownGeneralTerms = [
  "mamaai", "subscription", "pricing", "price", "plan", "install", "language", "support", "contact", "account", "profile", "attendance", "budget", "history", "app", "feature",
  "मामाआई", "सब्सक्रिप्शन", "कीमत", "प्लान", "इंस्टॉल", "भाषा", "सहायता", "प्रोफाइल",
  "ಸಬ್ಸ್ಕ್ರಿಪ್ಷನ್", "ಬೆಲೆ", "ಪ್ಲ್ಯಾನ್", "ಇನ್‌ಸ್ಟಾಲ್", "ಭಾಷೆ", "ಸಹಾಯ", "ಪ್ರೊಫೈಲ್",
];

export function classifyAskMamaRequest(message: string): AskMamaRequestKind {
  const text = message.normalize("NFKD").toLocaleLowerCase();
  if (foodAdviceTerms.some((term) => text.includes(term))) return "specific_food_advice";
  return knownGeneralTerms.some((term) => text.includes(term)) ? "general" : "specific_food_advice";
}

function isMeal(value: unknown): value is NonNullable<AskMamaModelResponse["meals"]>[number] {
  if (!value || typeof value !== "object") return false;
  const meal = value as Record<string, unknown>;
  return typeof meal.name === "string" && meal.name.trim().length > 0 && Array.isArray(meal.ingredients) && meal.ingredients.every((ingredient) => typeof ingredient === "string" && ingredient.trim().length > 0) && meal.ingredients.length > 0 && (meal.preparationNotes === undefined || (Array.isArray(meal.preparationNotes) && meal.preparationNotes.every((note) => typeof note === "string")));
}

export function parseAskMamaModelResponse(raw: string): AskMamaModelResponse | undefined {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if ((value.kind !== "general" && value.kind !== "meal_recommendation") || typeof value.answer !== "string" || !value.answer.trim()) return undefined;
    if (value.kind === "general") return { kind: "general", answer: value.answer.trim() };
    if (!Array.isArray(value.meals) || !value.meals.length || !value.meals.every(isMeal)) return undefined;
    return { kind: "meal_recommendation", answer: value.answer.trim(), meals: value.meals.map((meal) => ({ name: meal.name.trim(), ingredients: meal.ingredients.map((ingredient) => ingredient.trim()), preparationNotes: meal.preparationNotes?.map((note) => note.trim()) })) };
  } catch { return undefined; }
}

export function validateAskMamaModelResponse(raw: string, requestKind: AskMamaRequestKind, members: FamilyMember[]): AskMamaResponseDecision {
  const response = parseAskMamaModelResponse(raw);
  if (!response) return { allowed: false, needsClarification: true, message: "I need a complete, structured ingredient list before I can offer a meal suggestion safely." };
  if (requestKind === "specific_food_advice" && response.kind !== "meal_recommendation") return { allowed: false, needsClarification: true, message: "Please share your family profile or ask a general cooking question so I can respond safely." };
  if (response.kind === "general") return { allowed: true, needsClarification: false, response };
  if (!members.length) return { allowed: false, needsClarification: true, message: "Please add or confirm your family dietary preferences, allergies, and ages before receiving a specific meal recommendation." };
  const safety = evaluateIngredientSafety(response.meals.flatMap((meal) => meal.ingredients), members);
  if (!safety.ok) return { allowed: false, needsClarification: safety.status === "needs_clarification", safety, message: safety.status === "blocked" ? "I cannot recommend that meal for the saved family restrictions. Please choose another option." : "I need complete ingredient and preparation details before I can recommend that meal safely." };
  return { allowed: true, needsClarification: false, response, safety };
}

