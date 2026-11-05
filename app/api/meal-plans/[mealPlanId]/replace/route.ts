import { PlanningHouseholdError } from "@/lib/services/planning-household";
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

    const user = await requireUser(request);
    const repository = new FamilyMealRepository();
    const existing = await repository.getMealPlan(params.mealPlanId);
    if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Meal plan not found." } }, { status: 404 });
    const result = await new MealPlanningService().replace(params.mealPlanId, parsed.data as ReplaceMealRequest, user.userId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlanningHouseholdError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.code === "FORBIDDEN" ? 403 : 409 });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "MEAL_REPLACEMENT_FAILED", message: error instanceof Error ? error.message : "Unable to replace meal." } },
      { status: 422 }
    );
  }
}

