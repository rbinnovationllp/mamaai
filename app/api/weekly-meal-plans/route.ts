import { PlanningHouseholdError } from "@/lib/services/planning-household";
import { hasCurrentEntitlement, needsPaymentReconciliation } from "@/lib/services/paid-entitlement";
import { NextResponse } from "next/server";
import { WeeklyMealPlanningService, WeeklyPlanOwnershipError } from "@/lib/services/weekly-meal-planning-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { createMealPlanRequestSchema, familyMealPlanSchema } from "@/lib/shared/schemas";
import { z } from "zod";
import type { CreateMealPlanRequest } from "@/lib/shared/contracts";

class EntitlementPendingError extends Error {}

export const dynamic = "force-dynamic";

async function hasMealPlanningEntitlement(
  request: Request,
  requestData: CreateMealPlanRequest
): Promise<{ ok: boolean; userId?: string }> {
  const user = await requireUser(request);
  const resolvedUserId = user.userId;
  if (requestData.userId && requestData.userId !== resolvedUserId) return { ok: false, userId: resolvedUserId };

  const record = await new SubscriptionRepository().getLatestSubscriptionForUser(resolvedUserId).catch(() => { throw new EntitlementPendingError(); });
  if (needsPaymentReconciliation(record)) throw new EntitlementPendingError();
  return { ok: hasCurrentEntitlement(record), userId: resolvedUserId };

}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const familyId = url.searchParams.get("familyId");
    const targetDate = url.searchParams.get("targetDate") || url.searchParams.get("targetWeekStart") || new Date().toISOString().slice(0, 10);

    if (!familyId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "familyId is required." } },
        { status: 400 }
      );
    }

    const weeklyPlan = await new WeeklyMealPlanningService().getCurrent(familyId, targetDate);
    if (weeklyPlan && weeklyPlan.userId !== user.userId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "You cannot access this family plan." } }, { status: 403 });
    }
    return NextResponse.json({ success: true, weeklyPlan: weeklyPlan ?? null });
  } catch (error) {
    if (error instanceof PlanningHouseholdError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.code === "FORBIDDEN" ? 403 : 409 });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Normalize targetWeekStart to targetDate for schema compatibility
    const normalizedBody = {
      ...body,
      planType: "weekly",
      targetDate: body.targetDate || body.targetWeekStart || new Date().toISOString().slice(0, 10),
    };

    const parsed = createMealPlanRequestSchema.safeParse(normalizedBody);

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
            message: "Active subscription or 3-day trial required.",
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
    if (error instanceof PlanningHouseholdError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.code === "FORBIDDEN" ? 403 : 409 });
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    if (error instanceof WeeklyPlanOwnershipError) return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
    if (error instanceof EntitlementPendingError) return NextResponse.json({ error: { code: "ENTITLEMENT_PENDING" } }, { status: 503 });
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

const weeklyPatchSchema = z.object({ familyId: z.string().min(1), weekStartDate: z.string().date(), slotId: z.string().min(1), selectedMealPlan: familyMealPlanSchema, reason: z.string().max(500).optional(), expectedPlanVersion: z.number().int().positive() });
export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request); const input = weeklyPatchSchema.parse(await request.json()); const service = new WeeklyMealPlanningService(); const current = await service.getCurrent(input.familyId, input.weekStartDate);
    if (!current) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Weekly plan not found." } }, { status: 404 });
    if (current.userId !== user.userId) return NextResponse.json({ error: { code: "FORBIDDEN", message: "You cannot update this family plan." } }, { status: 403 });
    const slot = current.days.flatMap((day) => day.meals).find((item) => item.slotId === input.slotId);
    if (!slot || input.selectedMealPlan.familyId !== input.familyId || input.selectedMealPlan.targetDate !== slot.date || input.selectedMealPlan.commonMeal.mealTime !== slot.mealTime) return NextResponse.json({ error: { code: "SLOT_MISMATCH", message: "Replacement does not match the selected weekly slot." } }, { status: 400 });
    const result = await service.selectSlot(input as Parameters<typeof service.selectSlot>[0]); return NextResponse.json({ success: true, ...result, shoppingListState: "stale_refresh_required" });
  } catch (error) { const auth = authErrorResponse(error); if (auth) return auth; if (error instanceof z.ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Replacement request is invalid." } }, { status: 400 }); if (error instanceof Error && error.message === "WEEKLY_PLAN_VERSION_CONFLICT") return NextResponse.json({ error: { code: "STALE_PLAN", message: "Refresh the weekly plan before changing a meal." } }, { status: 409 }); return NextResponse.json({ error: { code: "WEEKLY_REPLACEMENT_FAILED", message: "Unable to replace weekly meal." } }, { status: 422 }); }
}


