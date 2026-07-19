import type { FamilyMealPlan, FamilyMember } from "@/lib/shared/contracts";
import { familyMealPlanSchema } from "@/lib/shared/schemas";

function normalize(value: string) {
  return value.trim().toLowerCase();
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

    const ingredientNames = plan.commonMeal.ingredients.map((ingredient) => normalize(ingredient.name));
    const errors: string[] = [];

    for (const member of members) {
      for (const allergy of member.allergies) {
        if (ingredientNames.some((name) => name.includes(normalize(allergy)))) {
          errors.push(`${member.name} has an allergy conflict with ${allergy}.`);
        }
      }

      for (const restriction of member.doctorRestrictions) {
        if (ingredientNames.some((name) => restriction.toLowerCase().includes(name) || name.includes(normalize(restriction)))) {
          errors.push(`${member.name} has a doctor restriction conflict: ${restriction}.`);
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }
}
