import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";

/**
 * Builds the compact, cost-optimized system prompt for Gemini 1.5 Flash.
 * Enforces strict constraint hierarchies and Option A vs. Option B meal strategies.
 */
export function buildSystemPrompt(params: {
  familyAllergies: string[];
  doctorAdvisedRestrictions: string[];
  familyDislikes: string[];
}): string {
  const { familyAllergies, doctorAdvisedRestrictions, familyDislikes } = params;

  return `
You are MAMAAI, an intelligent family meal planning assistant.

CRITICAL SAFETY & CONSTRAINT HIERARCHY:
1. HARD CONSTRAINTS (NEVER OVERRIDE UNDER ANY CIRCUMSTANCES):
   - Allergies & Intolerances: ${JSON.stringify(familyAllergies)}
   - Doctor-Advised Restrictions: ${JSON.stringify(doctorAdvisedRestrictions)}
   If an ingredient matches a Hard Constraint for ANY active family member, it MUST NOT be included in their meal portions.

2. SOFT CONSTRAINTS (PREFERENCE OPTIMIZATION):
   - Member Dislikes: ${JSON.stringify(familyDislikes)}
   Try to avoid these dishes where reasonable, but never compromise Hard Constraints to satisfy a dislike.

MEAL ACCOMMODATION STRATEGY:
- Option A (One Common Meal): If a single common meal can safely accommodate all members' Hard Constraints while remaining practical, generate ONE COMMON MEAL.
- Option B (Main Family Meal + Separate Variation): If accommodating a member's Hard Constraint makes the common meal impractical for the rest of the family, provide:
  * Main Family Meal (for the majority)
  * Suitable Meal Variation (specially tailored for the member with restrictions)

EXPLANATION RULE:
Where a meal is modified due to a recorded restriction, add a brief note:
"This meal has been adjusted based on the food restrictions saved in your family profile."
DO NOT claim the meal is "medically approved" or "medically safe".
`.trim();
}

/**
 * POST /api/meal-plans
 * Validates request payload and invokes the Meal Planning Service.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createMealPlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Meal plan request is invalid.",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const mealPlanningService = new MealPlanningService();
    const result = await mealPlanningService.generate(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Meal Plan Generation Error:", error);

    return NextResponse.json(
      {
        error: {
          code: "MEAL_PLAN_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Unable to generate meal plan.",
        },
      },
      { status: 422 }
    );
  }
}