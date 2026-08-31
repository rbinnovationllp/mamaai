import type { FamilyMealPlan, FamilyMember } from "@/lib/shared/contracts";
import { familyMealPlanSchema } from "@/lib/shared/schemas";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function hardRestrictions(member: FamilyMember) {
  return [
    ...member.allergies,
    ...member.foodAllergies,
    ...member.ingredientAllergies,
    ...member.excludedIngredients,
    ...member.dietaryRestrictions,
    ...member.doctorRestrictions
  ].filter(Boolean);
}

function hasExplicitMemberAlternative(plan: FamilyMealPlan, memberId: string, conflict: string) {
  const customization = plan.memberCustomizations.find((item) => item.memberId === memberId);
  if (!customization) return false;
  const text = `${customization.modification} ${customization.portionGuidance} ${customization.safetyNotes.join(" ")}`.toLowerCase();
  return text.includes("do not serve") && text.includes(normalize(conflict));
}

function ingredientNamesForMember(plan: FamilyMealPlan, member: FamilyMember) {
  if (!plan.commonMeal.components?.length) {
    return [
      ...plan.commonMeal.ingredients.map((ingredient) => normalize(ingredient.name)),
      ...plan.commonMeal.recipe.ingredients.map((ingredient) => normalize(ingredient.name)),
    ];
  }

  return plan.commonMeal.components
    .filter((component) => component.memberIds.includes(member.memberId))
    .flatMap((component) => component.ingredients.map((ingredient) => normalize(ingredient.name)));
}

function dietConflict(member: FamilyMember, ingredientNames: string[]) {
  const text = ingredientNames.join(" ");
  const hasEgg = /\begg|anda/.test(text);
  const hasMeatOrSeafood = /chicken|mutton|goat|fish|seafood|prawn|crab|squid|clam/.test(text);

  if (["vegetarian", "vegan", "jain", "satvik"].includes(member.dietType) && (hasEgg || hasMeatOrSeafood)) {
    return `${member.name} follows ${member.dietType}; do not serve egg, meat, fish, or seafood.`;
  }
  if (member.dietType === "eggitarian" && hasMeatOrSeafood) {
    return `${member.name} is eggatarian; do not serve chicken, mutton, fish, or seafood.`;
  }
  return undefined;
}

export class SafetyValidationService {
  validateMealPlan(plan: FamilyMealPlan, members: FamilyMember[]) {
    const parsed = familyMealPlanSchema.safeParse(plan);
    if (!parsed.success) {
      return {
        ok: false,
        errors: parsed.error.issues.map((issue) => issue.message)
      };
    }

    const errors: string[] = [];

    for (const member of members) {
      const ingredientNames = ingredientNamesForMember(plan, member);
      const dietError = dietConflict(member, ingredientNames);
      if (dietError) errors.push(dietError);

      for (const restriction of hardRestrictions(member)) {
        const normalizedRestriction = normalize(restriction);
        const hasConflict = ingredientNames.some((name) => name.includes(normalizedRestriction) || normalizedRestriction.includes(name));
        if (hasConflict && !hasExplicitMemberAlternative(plan, member.memberId, restriction)) {
          errors.push(`${member.name} has a hard food restriction conflict: ${restriction}.`);
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }
}
