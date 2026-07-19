import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createMealPlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Meal plan request is invalid.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const result = new MealPlanningService().generate(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "MEAL_PLAN_FAILED", message: error instanceof Error ? error.message : "Unable to generate meal plan." } },
      { status: 422 }
    );
  }
}
