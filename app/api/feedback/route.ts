import { NextResponse } from "next/server";
import { FamilyLearningRepository } from "@/lib/repositories/family-learning-repository";
import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { configuredPositiveInt, enforceDurableRateLimit, RateLimitExceededError, RateLimitStorageError } from "@/lib/server/durable-rate-limit";
import { feedbackRequestSchema } from "@/lib/shared/schemas";
import { SafetyReportRepository } from "@/lib/repositories/safety-report-repository";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    try {
      await enforceDurableRateLimit({ scope: "feedback_user", key: user.userId, limit: configuredPositiveInt(process.env.MAMA_AI_FEEDBACK_USER_LIMIT, 20), windowSeconds: 3600 });
    } catch (error) {
      if (error instanceof RateLimitExceededError) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many reports were submitted. Please try again later." } }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
      if (error instanceof RateLimitStorageError) return NextResponse.json({ error: { code: "REPORTING_UNAVAILABLE", message: "Problem reporting is temporarily unavailable. Please try again later." } }, { status: 503 });
      throw error;
    }

    const body = await request.json();
    const parsed = feedbackRequestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Feedback request is invalid.", details: parsed.error.issues } }, { status: 400 });

    const feedbackId = createId("feedback");
    const createdAt = nowIso();
    await new FamilyLearningRepository().saveFeedbackEvent({
      feedbackId, userId: user.userId, mealPlanId: parsed.data.mealPlanId, memberId: parsed.data.memberId,
      mealName: parsed.data.mealName, mealTime: parsed.data.mealTime, outcome: parsed.data.outcome,
      rating: parsed.data.rating, notes: parsed.data.notes, problemCategory: parsed.data.problemCategory,
      reviewStatus: parsed.data.problemCategory ? "new" : undefined, createdAt,
    });
    if (parsed.data.problemCategory) await new SafetyReportRepository().create({ reportId: feedbackId, userId: user.userId, mealPlanId: parsed.data.mealPlanId, category: parsed.data.problemCategory, createdAt });
    return NextResponse.json({ feedbackId, saved: true, durable: true, reviewStatus: parsed.data.problemCategory ? "pending" : undefined });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Feedback durable save failed", { message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: { code: "FEEDBACK_SAVE_FAILED", message: "Feedback could not be saved. Please try again later." } }, { status: 503 });
  }
}

