import { PlanningHouseholdError } from "@/lib/services/planning-household";
import { hasCurrentEntitlement, needsPaymentReconciliation } from "@/lib/services/paid-entitlement";
import { NextResponse } from "next/server";
import { MealPlanningService } from "@/lib/services/meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { getSession } from "@/lib/auth/session";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

class EntitlementPendingError extends Error {}

export const dynamic = "force-dynamic";

/**
 * Validates whether a user has an active entitlement (Session, DynamoDB, or Trial).
 */
async function checkEntitlement(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const record = await new SubscriptionRepository().getLatestSubscriptionForUser(userId).catch(() => { throw new EntitlementPendingError(); });
  if (needsPaymentReconciliation(record)) throw new EntitlementPendingError();
  return hasCurrentEntitlement(record);

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
    let resolvedUserId = session?.userId;

    try {
      const user = await requireUser(request);
      if (resolvedUserId && resolvedUserId !== user.userId) {
        return NextResponse.json({ error: { code: "FORBIDDEN", message: "The requested user does not match the signed-in customer." } }, { status: 403 });
      }
      resolvedUserId = user.userId;
    } catch (authErr) {
      const authResponse = authErrorResponse(authErr);
      if (authResponse) return authResponse;
    }

    // 2. Server-side Entitlement Check
    const isEntitled = await checkEntitlement(resolvedUserId);

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
    const result = await mealPlanningService.generate({ ...requestData, userId: resolvedUserId });

    return NextResponse.json({
      success: true,
      requestId,
      ...result,
    });
  } catch (error) {
    if (error instanceof PlanningHouseholdError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.code === "FORBIDDEN" ? 403 : 409 });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    if (process.env.MAMA_AI_LOCAL_QA === "true") {
      console.error("LOCAL_QA_MEAL_PLAN_ERROR", error instanceof Error ? { name: error.name, message: error.message } : { name: "unknown" });
    }
    if (error instanceof EntitlementPendingError) return NextResponse.json({ error: { code: "ENTITLEMENT_PENDING" } }, { status: 503 });
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


