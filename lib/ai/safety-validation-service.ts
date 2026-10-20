import type { FamilyMealPlan, FamilyMember } from "@/lib/shared/contracts";
import { familyMealPlanSchema } from "@/lib/shared/schemas";
import { classifyIngredient, ingredientIsAmbiguous, normalizeIngredient, restrictionCanonicals } from "./food-safety-taxonomy";

export type SafetyStatus = "allowed" | "blocked" | "needs_clarification";
export type SafetyResult = { status: SafetyStatus; errors: string[]; warnings: string[]; ok: boolean };
type MemberSafetyFields = FamilyMember & { allergies?: string[]; foodAllergies?: string[]; ingredientAllergies?: string[] };

function unique(values: string[]): string[] { return [...new Set(values)]; }
function ingredientNames(plan: FamilyMealPlan): string[] {
  return [...plan.commonMeal.ingredients, ...plan.commonMeal.recipe.ingredients].map((ingredient) => ingredient.name).filter(Boolean);
}

/** Deterministic evaluator. A result other than allowed must not be persisted or shown as approved. */
export function evaluateIngredientSafety(names: string[], members: FamilyMember[]): SafetyResult {
  const matches = names.flatMap((name) => classifyIngredient(name));
  const errors: string[] = [];
  const warnings: string[] = [];
  if (names.length === 0 || names.some(ingredientIsAmbiguous)) warnings.push("Ingredient composition is incomplete or ambiguous; verify ingredients and cross-contact before serving.");

  for (const member of members as MemberSafetyFields[]) {
    const declared = [...(member.allergies ?? []), ...(member.foodAllergies ?? []), ...(member.ingredientAllergies ?? []), ...member.excludedIngredients, ...member.dietaryRestrictions, ...member.doctorRestrictions];
    for (const restriction of unique(declared.map(normalizeIngredient).filter(Boolean))) {
      const canonicals = restrictionCanonicals(restriction);
      if (names.some((name) => normalizeIngredient(name) === restriction) || matches.some((match) => canonicals.includes(match.canonical))) errors.push(`${member.name} has a declared restriction conflict: ${restriction}.`);
    }
    if (["vegetarian", "vegan", "jain", "satvik"].includes(member.dietType) && matches.some((match) => match.category === "animal" || match.category === "egg")) errors.push(`${member.name} dietary preference conflicts with egg or animal ingredient.`);
    if (member.dietType === "eggitarian" && matches.some((match) => match.category === "animal")) errors.push(`${member.name} dietary preference conflicts with an animal ingredient.`);
    if (member.dietType === "jain" && matches.some((match) => match.category === "jain_root")) errors.push(`${member.name} Jain restriction conflicts with a root ingredient.`);

    const fasting = member.fastingPreference;
    if (fasting?.observesFasting === "yes") {
      for (const restriction of unique([...fasting.avoidedFoods, ...fasting.customRules].map(normalizeIngredient).filter(Boolean))) {
        const canonicals = restrictionCanonicals(restriction);
        if (names.some((name) => normalizeIngredient(name) === restriction) || matches.some((match) => canonicals.includes(match.canonical))) errors.push(`${member.name} fasting rule conflicts with: ${restriction}.`);
      }
      if (fasting.grainsRestricted && names.some((name) => /(^| )(rice|wheat|flour|atta|bread|roti|pasta|cereal)( |$)/.test(normalizeIngredient(name)))) errors.push(`${member.name} fasting rule restricts grains.`);
    }
    // age is stored in years; preparation details are unavailable, so use conservative flags.
    if (member.age < 1 && matches.some((match) => match.canonical === "honey")) errors.push(`${member.name} is under one year old and the meal includes honey.`);
    if (member.age < 5 && matches.some((match) => match.canonical === "whole_nuts" || match.canonical === "whole_grapes")) warnings.push(`${member.name} is under five; confirm the choking hazard is prepared safely before serving.`);
  }

  const status: SafetyStatus = errors.length ? "blocked" : warnings.length ? "needs_clarification" : "allowed";
  return { status, ok: status === "allowed", errors: unique(errors), warnings: unique(warnings) };
}

export class SafetyValidationService {
  validateMealPlan(plan: FamilyMealPlan, members: FamilyMember[]): SafetyResult {
    const parsed = familyMealPlanSchema.safeParse(plan);
    if (!parsed.success) return { status: "blocked", ok: false, errors: parsed.error.issues.map((issue) => issue.message), warnings: [] };
    return evaluateIngredientSafety(ingredientNames(plan), members);
  }
}

