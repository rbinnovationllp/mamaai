import { NextResponse } from "next/server";
import { FamilyLearningRepository } from "@/lib/repositories/family-learning-repository";
import { createId, nowIso, store } from "@/lib/repositories/in-memory-store";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
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
  const createdAt = nowIso();

  store.feedbackEvents.push({
    feedbackId,
    mealPlanId: parsed.data.mealPlanId,
    memberId: parsed.data.memberId,
    rating: parsed.data.rating,
    notes: parsed.data.notes,
    createdAt,
  });

  try {
    const user = requireUser(request, parsed.data.userId);
    await new FamilyLearningRepository().saveFeedbackEvent({
      feedbackId,
      userId: user.userId,
      mealPlanId: parsed.data.mealPlanId,
      memberId: parsed.data.memberId,
      mealName: parsed.data.mealName,
      mealTime: parsed.data.mealTime,
      outcome: parsed.data.outcome,
      rating: parsed.data.rating,
      notes: parsed.data.notes,
      createdAt,
    });

    return NextResponse.json({
      feedbackId,
      saved: true,
      durable: true,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) {
      return NextResponse.json({
        feedbackId,
        saved: true,
        durable: false,
        message: "Feedback was saved for this session. Sign in/session is required for long-term learning.",
      });
    }

    console.error("Feedback durable save failed:", error);
    return NextResponse.json({
      feedbackId,
      saved: true,
      durable: false,
      message: "Feedback was saved for this session. Long-term learning will retry after storage is available.",
    });
  }
}
