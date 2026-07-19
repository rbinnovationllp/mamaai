import { NextResponse } from "next/server";
import { createId } from "@/lib/repositories/in-memory-store";
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

  return NextResponse.json({
    feedbackId: createId("feedback"),
    saved: true
  });
}
