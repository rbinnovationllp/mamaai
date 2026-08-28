import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { getSession } from "@/lib/auth/session";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

/**
 * POST /api/meal-plan
 * Validates payload, verifies session & server-side entitlement against DynamoDB,
 * and executes deterministic/Gemini meal generation with local meal timings and attendance context.
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

    const requestData = parsed.data as CreateMealPlanRequest;

    // 1. Resolve User Identity (Session cookie preferred, header fallback)
    const session = await getSession();
    let resolvedUserId = session?.userId || requestData.userId;

    if (!resolvedUserId) {
      try {
        const user = requireUser(request, requestData.userId);
        resolvedUserId = user.userId;
      } catch (authErr) {
        const authResponse = authErrorResponse(authErr);
        if (authResponse) return authResponse;
      }
    }

    // 2. Server-side Entitlement Check
    let isEntitled = false;

    // Strategy A: Session-level quick check (Judge/Admin)
    if (session?.role === "admin" || session?.entitlement === "judge" || session?.entitlement === "active") {
      isEntitled = true;
    }

    // Strategy B: DynamoDB user table check
    if (!isEntitled && resolvedUserId) {
      try {
        const userRecord = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.USERS,
            Key: { userId: resolvedUserId },
          })
        );
        const userItem = userRecord.Item;
        const isTrialActive = userItem?.trialEndsAt && new Date(userItem.trialEndsAt) > new Date();
        const isPaid = userItem?.subscriptionStatus === "active";
        const isJudge = userItem?.role === "judge" || userItem?.isJudgeDemo === true;

        isEntitled = Boolean(isTrialActive || isPaid || isJudge);
      } catch {
        // Strategy C: Fallback to SubscriptionRepository
        try {
          const subscriptionRepo = new SubscriptionRepository();
          const latestSub = await subscriptionRepo.getLatestSubscriptionForUser(resolvedUserId);
          isEntitled = latestSub?.status === "active" || latestSub?.status === "trialing";
        } catch {
          isEntitled = false;
        }
      }
    }

    if (!isEntitled) {
      return NextResponse.json(
        {
          error: {
            code: "PAYMENT_REQUIRED",
            message: "Active subscription or 3-day trial required to generate family meal plans.",
            redirect: "/subscription",
          },
        },
        { status: 403 }
      );
    }

    // 3. Delegate to MealPlanningService
    const mealPlanningService = new MealPlanningService();
    const result = await mealPlanningService.generate(requestData);

    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("Meal Plan Generation Error:", error);

    return NextResponse.json(
      {
        error: {
          code: "MEAL_PLAN_FAILED",
          message: error instanceof Error ? error.message : "Unable to generate meal plan.",
        },
      },
      { status: 422 }
    );
  }
}