import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { replaceMealRequestSchema } from "@/lib/shared/schemas";

export async function POST(request: Request, context: { params: Promise<{ mealPlanId: string }> }) {
  try {
    const params = await context.params;
    const body = await request.json();
    const parsed = replaceMealRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Replacement request is invalid.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const result = new MealPlanningService().replace(params.mealPlanId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "MEAL_REPLACEMENT_FAILED", message: error instanceof Error ? error.message : "Unable to replace meal." } },
      { status: 422 }
    );
  }
}
