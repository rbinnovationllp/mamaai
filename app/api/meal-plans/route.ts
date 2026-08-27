import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

/**
 * POST /api/meal-plans
 * Validates payload, verifies the existing MAMAAI customer session and checks
 * the latest DynamoDB subscription entitlement before meal generation.
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

    const requestUserId = (parsed.data as CreateMealPlanRequest & { userId?: string }).userId;
    const user = requireUser(request, requestUserId);
    const repository = new SubscriptionRepository();
    const latestSubscription = await repository.getLatestSubscriptionForUser(user.userId);
    const isEntitled =
      latestSubscription?.status === "active" ||
      latestSubscription?.status === "trialing" ||
      user.source === "demo_compatibility";

    if (!isEntitled) {
      return NextResponse.json(
        {
          error: {
            code: "PAYMENT_REQUIRED",
            message: "Active subscription or trial required to generate family meal plans.",
            redirect: "/subscription",
          },
        },
        { status: 403 }
      );
    }

    const mealPlanningService = new MealPlanningService();
    const result = await mealPlanningService.generate(parsed.data as CreateMealPlanRequest);

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

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
