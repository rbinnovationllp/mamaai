import { NextResponse } from "next/server";
import { answerAskMama } from "@/lib/ask-mama/knowledge-base";
import { type AppLanguage, isAppLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface RequestPayload {
  message?: string;
  isJudgeMode?: boolean;
  language?: AppLanguage;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestPayload;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: { code: "INVALID_PROMPT", message: "Please provide a valid question." } },
        { status: 400 }
      );
    }

    const answer = answerAskMama(message, Boolean(body.isJudgeMode), isAppLanguage(body.language) ? body.language : "en");

    return NextResponse.json({
      success: true,
      role: "model",
      response: answer.answer,
      category: answer.category,
      suggestions: answer.suggestions,
      action: answer.action,
      unresolved: Boolean(answer.unresolved),
    });
  } catch (error) {
    console.error("[Ask MAMA API Error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "ASK_MAMA_ERROR",
          message: "Ask MAMA could not process this request.",
        },
      },
      { status: 500 }
    );
  }
}
