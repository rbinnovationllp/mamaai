import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { getSession } from "@/lib/auth/session";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

export const dynamic = "force-dynamic";

/**
 * Validates whether a user has an active entitlement (Session, DynamoDB, or Trial).
 */
async function checkEntitlement(session: any, userId?: string): Promise<boolean> {
  // Strategy A: Quick session validation (Admin / Judge / Active Entitlement)
  if (
    session?.role === "admin" ||
    session?.role === "judge" ||
    session?.entitlement === "judge" ||
    session?.entitlement === "active"
  ) {
    return true;
  }

  if (!userId) return false;

  // Strategy B: DynamoDB primary user record lookup
  try {
    const userRecord = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { userId },
      })
    );
    const userItem = userRecord.Item;
    const isTrialActive = userItem?.trialEndsAt && new Date(userItem.trialEndsAt) > new Date();
    const isPaid = userItem?.subscriptionStatus === "active";
    const isJudge = userItem?.role === "judge" || userItem?.isJudgeDemo === true;

    if (isTrialActive || isPaid || isJudge) {
      return true;
    }
  } catch (error) {
    console.warn("[MealPlan Route] DynamoDB user check failed, evaluating fallback:", error);
  }

  // Strategy C: Fallback to SubscriptionRepository
  try {
    const subscriptionRepo = new SubscriptionRepository();
    const latestSub = await subscriptionRepo.getLatestSubscriptionForUser(userId);
    return latestSub?.status === "active" || latestSub?.status === "trialing";
  } catch {
    return false;
  }
}

/**
 * POST /api/meal-plan
 * Validates payload, verifies session & server-side entitlement,
 * and executes resilient 3-layer meal generation.
 */
export async function POST(request: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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

    // 1. Resolve User Identity
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
    const isEntitled = await checkEntitlement(session, resolvedUserId);

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

    // 3. Delegate to Resilient MealPlanningService
    const mealPlanningService = new MealPlanningService();
    const result = await mealPlanningService.generate(requestData);

    return NextResponse.json({
      success: true,
      requestId,
      ...result,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error(`[MealPlan Route Uncaught Error] RequestID: ${requestId}:`, error);

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