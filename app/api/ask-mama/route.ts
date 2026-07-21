import { NextResponse } from "next/server";
import { z } from "zod";
import { answerAskMama } from "@/lib/ask-mama/knowledge-base";

const askMamaSchema = z.object({
  question: z.string().trim().min(1).max(500),
  detailed: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = askMamaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Please ask a short MAMAAI help question." } }, { status: 400 });
    }

    return NextResponse.json(answerAskMama(parsed.data.question, parsed.data.detailed ?? false));
  } catch {
    return NextResponse.json(
      { error: { code: "ASK_MAMA_FAILED", message: "Ask MAMA is unavailable for a moment. Please try again." } },
      { status: 500 }
    );
  }
}
