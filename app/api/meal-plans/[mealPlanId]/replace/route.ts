import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { replaceMealRequestSchema } from "@/lib/shared/schemas";
import type { ReplaceMealRequest } from "@/lib/shared/contracts";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";

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

    const user = requireUser(request);
    const repository = new FamilyMealRepository();
    const existing = await repository.getMealPlan(params.mealPlanId);
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Meal plan not found." } }, { status: 404 });
    const family = await repository.getFamilyContext(existing.familyId);
    if (!family || family.family.userId !== user.userId) return NextResponse.json({ error: { code: "FORBIDDEN", message: "You cannot replace this meal." } }, { status: 403 });
    const result = await new MealPlanningService().replace(params.mealPlanId, parsed.data as ReplaceMealRequest);
    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "MEAL_REPLACEMENT_FAILED", message: error instanceof Error ? error.message : "Unable to replace meal." } },
      { status: 422 }
    );
  }
}
