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

export class SafetyValidationService {
  validateMealPlan(plan: FamilyMealPlan, members: FamilyMember[]) {
    const parsed = familyMealPlanSchema.safeParse(plan);
    if (!parsed.success) {
      return {
        ok: false,
        errors: parsed.error.issues.map((issue) => issue.message)
      };
    }

    const ingredientNames = [
      ...plan.commonMeal.ingredients.map((ingredient) => normalize(ingredient.name)),
      ...plan.commonMeal.recipe.ingredients.map((ingredient) => normalize(ingredient.name))
    ];
    const errors: string[] = [];

    for (const member of members) {
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
