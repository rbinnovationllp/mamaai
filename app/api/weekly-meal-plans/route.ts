import { NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { WeeklyMealPlanningService } from "@/lib/services/weekly-meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { getSession } from "@/lib/auth/session";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

export const dynamic = "force-dynamic";

/**
 * Validates user entitlement with active paid plan priority
 */
async function hasMealPlanningEntitlement(
  request: Request,
  requestData: CreateMealPlanRequest
): Promise<{ ok: boolean; userId?: string }> {
  const session = await getSession();
  let resolvedUserId = session?.userId || requestData.userId;

  if (!resolvedUserId) {
    try {
      const user = requireUser(request, requestData.userId);
      resolvedUserId = user.userId;
    } catch {
      // Proceed to evaluate session keys
    }
  }

  // Admin / Judge / Active Entitlement quick pass
  if (
    session?.role === "admin" ||
    (session as any)?.role === "judge" ||
    session?.entitlement === "judge" ||
    session?.entitlement === "active"
  ) {
    return { ok: true, userId: resolvedUserId || "admin_session" };
  }

  if (!resolvedUserId) {
    return { ok: false, userId: undefined };
  }

  // Check DynamoDB primary record
  try {
    const userRecord = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.USERS,
        Key: { userId: resolvedUserId },
      })
    );
    const userItem = userRecord.Item;
    const isPaid = userItem?.subscriptionStatus === "active";
    const isTrialActive = userItem?.trialEndsAt && new Date(userItem.trialEndsAt) > new Date();
    const isJudge = userItem?.role === "judge" || userItem?.isJudgeDemo === true;

    if (isPaid || isTrialActive || isJudge) {
      return { ok: true, userId: resolvedUserId };
    }
  } catch (error) {
    console.warn("[WeeklyMealPlan Route] DynamoDB user check fallback:", error);
  }

  // Fallback to SubscriptionRepository
  try {
    const subscriptionRepo = new SubscriptionRepository();
    const latestSub = await subscriptionRepo.getLatestSubscriptionForUser(resolvedUserId);
    if (latestSub?.status === "active" || latestSub?.status === "trialing") {
      return { ok: true, userId: resolvedUserId };
    }
  } catch (error) {
    console.warn("[WeeklyMealPlan Route] SubscriptionRepository fallback check failed:", error);
  }

  return { ok: false, userId: resolvedUserId };
}

/**
 * GET /api/weekly-meal-plans?familyId=...&targetDate=...
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get("familyId");
    const targetDate = url.searchParams.get("targetDate") ?? new Date().toISOString().slice(0, 10);

    if (!familyId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "familyId is required." } },
        { status: 400 }
      );
    }

    const weeklyPlan = await new WeeklyMealPlanningService().getCurrent(familyId, targetDate);
    return NextResponse.json({ success: true, weeklyPlan: weeklyPlan ?? null });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "WEEKLY_PLAN_READ_FAILED",
          message: error instanceof Error ? error.message : "Unable to load weekly plan.",
        },
      },
      { status: 422 }
    );
  }
}

/**
 * POST /api/weekly-meal-plans
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createMealPlanRequestSchema.safeParse({ ...body, planType: "weekly" });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Weekly meal plan request is invalid.",
            details: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const requestData = parsed.data as CreateMealPlanRequest;
    const entitlement = await hasMealPlanningEntitlement(request, requestData);

    if (!entitlement.ok) {
      return NextResponse.json(
        {
          error: {
            code: "PAYMENT_REQUIRED",
            message: "Active subscription or 3-day trial required to generate weekly family meal plans.",
            redirect: "/subscription",
          },
        },
        { status: 403 }
      );
    }

    const result = await new WeeklyMealPlanningService().generateOrGet({
      ...requestData,
      userId: entitlement.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[Weekly Meal Plan API Error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "WEEKLY_PLAN_FAILED",
          message: error instanceof Error ? error.message : "Unable to generate weekly meal plan.",
        },
      },
      { status: 422 }
    );
  }
}

/**
 * PATCH /api/weekly-meal-plans
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body?.familyId || !body?.weekStartDate || !body?.slotId || !body?.selectedMealPlan) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "familyId, weekStartDate, slotId and selectedMealPlan are required.",
          },
        },
        { status: 400 }
      );
    }

    const result = await new WeeklyMealPlanningService().selectSlot({
      familyId: body.familyId,
      weekStartDate: body.weekStartDate,
      slotId: body.slotId,
      selectedMealPlan: body.selectedMealPlan,
      reason: body.reason,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "WEEKLY_PLAN_UPDATE_FAILED",
          message: error instanceof Error ? error.message : "Unable to update weekly plan.",
        },
      },
      { status: 422 }
    );
  }
}