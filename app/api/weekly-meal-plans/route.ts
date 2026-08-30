import { NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { WeeklyMealPlanningService } from "@/lib/services/weekly-meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { getSession } from "@/lib/auth/session";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { createMealPlanRequestSchema } from "@/lib/shared/schemas";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

async function hasMealPlanningEntitlement(request: Request, requestData: CreateMealPlanRequest) {
  const session = await getSession();
  let resolvedUserId = session?.userId || requestData.userId;

  if (!resolvedUserId) {
    const user = requireUser(request, requestData.userId);
    resolvedUserId = user.userId;
  }

  if (session?.role === "admin" || session?.entitlement === "judge" || session?.entitlement === "active") {
    return { ok: true, userId: resolvedUserId };
  }

  if (!resolvedUserId) return { ok: false, userId: undefined };

  try {
    const subscriptionRepo = new SubscriptionRepository();
    const latestSub = await subscriptionRepo.getLatestSubscriptionForUser(resolvedUserId);
    if (latestSub?.status === "active" || latestSub?.status === "trialing") return { ok: true, userId: resolvedUserId };
  } catch (error) {
    console.warn("[WeeklyMealPlan Route] Subscription entitlement check failed, evaluating user record:", error);
  }

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
    if (isTrialActive || isPaid || isJudge) return { ok: true, userId: resolvedUserId };
  } catch (error) {
    console.warn("[WeeklyMealPlan Route] User entitlement check failed:", error);
  }

  return { ok: false, userId: resolvedUserId };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const familyId = url.searchParams.get("familyId");
    const targetDate = url.searchParams.get("targetDate") ?? new Date().toISOString().slice(0, 10);
    if (!familyId) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "familyId is required." } }, { status: 400 });
    }

    const weeklyPlan = await new WeeklyMealPlanningService().getCurrent(familyId, targetDate);
    return NextResponse.json({ weeklyPlan: weeklyPlan ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "WEEKLY_PLAN_READ_FAILED", message: error instanceof Error ? error.message : "Unable to load weekly plan." } },
      { status: 422 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createMealPlanRequestSchema.safeParse({ ...body, planType: "weekly" });
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Weekly meal plan request is invalid.", details: parsed.error.issues } },
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

    const result = await new WeeklyMealPlanningService().generateOrGet({ ...requestData, userId: entitlement.userId });
    return NextResponse.json(result);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Weekly Meal Plan Generation Error:", error);
    return NextResponse.json(
      { error: { code: "WEEKLY_PLAN_FAILED", message: error instanceof Error ? error.message : "Unable to generate weekly meal plan." } },
      { status: 422 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body?.familyId || !body?.weekStartDate || !body?.slotId || !body?.selectedMealPlan) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "familyId, weekStartDate, slotId and selectedMealPlan are required." } },
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
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "WEEKLY_PLAN_UPDATE_FAILED", message: error instanceof Error ? error.message : "Unable to update weekly plan." } },
      { status: 422 }
    );
  }
}
