import { NextResponse } from "next/server";
import { createId, nowIso, store } from "@/lib/repositories/in-memory-store";
import { feedbackRequestSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = feedbackRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Feedback request is invalid.", details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const feedbackId = createId("feedback");

  store.feedbackEvents.push({
    feedbackId,
    mealPlanId: parsed.data.mealPlanId,
    memberId: parsed.data.memberId,
    rating: parsed.data.rating,
    notes: parsed.data.notes,
    createdAt: nowIso(),
  });

  return NextResponse.json({
    feedbackId,
    saved: true
  });
}
