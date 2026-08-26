import { NextResponse } from "next/server";
import { answerAskMama } from "@/lib/ask-mama/knowledge-base";
import { type AppLanguage, isAppLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface RequestPayload {
  message?: string;
  isJudgeMode?: boolean;
  language?: AppLanguage;
  profileContext?: {
    householdFoodPreference?: string;
    cookingHabit?: string;
    members?: Array<{
      name?: string;
      relation?: string;
      foodPreference?: string;
      allergies?: string[];
      doctorAdvisedRestrictions?: string[];
      dislikes?: string[];
    }>;
  };
}

function isCookingQuestion(message: string) {
  return /(cook|meal|dinner|lunch|breakfast|frozen|ready|family|खाना|भोजन|पक|अंडा|शाकाहारी|ಊಟ|ಅಡುಗೆ|ತಿಂಡಿ)/i.test(message);
}

function profileAwareAnswer(message: string, context: RequestPayload["profileContext"], language: AppLanguage) {
  if (!context || !isCookingQuestion(message)) return null;

  const members = context.members?.filter((member) => member.name) ?? [];
  if (!members.length && !context.householdFoodPreference && !context.cookingHabit) return null;

  const food = context.householdFoodPreference || "not yet selected";
  const cooking = context.cookingHabit || "not yet selected";
  const memberSummary = members
    .map((member) => `${member.name}: ${member.foodPreference || "food preference not set"}`)
    .join(", ");

  if (language === "hi") {
    return `आपके saved profile के अनुसार household food preference: ${food}; cooking habit: ${cooking}. Members: ${memberSummary || "member food preferences अभी missing हैं"}. MAMAAI इसी आधार पर common family meal suggest करेगा, और allergies/doctor restrictions को hard rules मानेगा. Vegan preference हो तो meat, fish, egg, milk, paneer, butter, ghee और dairy avoid होंगे. Next step: Meal Planner में "आज का Family Meal Plan करें" दबाएं.`;
  }

  if (language === "kn") {
    return `ನಿಮ್ಮ saved profile ಪ್ರಕಾರ household food preference: ${food}; cooking habit: ${cooking}. Members: ${memberSummary || "member food preferences ಇನ್ನೂ missing"}. MAMAAI ಇದನ್ನೇ ಆಧಾರ ಮಾಡಿಕೊಂಡು common family meal suggest ಮಾಡುತ್ತದೆ ಮತ್ತು allergies/doctor restrictions ಅನ್ನು hard rules ಆಗಿ ನೋಡುತ್ತದೆ. Vegan ಆಯ್ಕೆಯಲ್ಲಿ meat, fish, egg, milk, paneer, butter, ghee ಮತ್ತು dairy avoid ಆಗುತ್ತವೆ. Next step: Meal Planner ನಲ್ಲಿ "ಇಂದಿನ Family Meal Plan ಮಾಡಿ" ಒತ್ತಿ.`;
  }

  return `Using your saved profile: household food preference is ${food}; cooking habit is ${cooking}. Members: ${memberSummary || "member food preferences are still missing"}. MAMAAI will use this to suggest a practical common family meal while treating allergies and doctor restrictions as hard rules. If Vegan is selected, it avoids meat, fish, eggs, milk, paneer, butter, ghee and other dairy. Next step: open Meal Planner and tap "Plan Today's Family Meal."`;
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

    const language = isAppLanguage(body.language) ? body.language : "en";
    const contextualAnswer = profileAwareAnswer(message, body.profileContext, language);
    if (contextualAnswer) {
      return NextResponse.json({
        success: true,
        role: "model",
        response: contextualAnswer,
        category: "meal_planning",
        suggestions: ["Open Meal Planner", "Complete Family Profile", "Show subscription plans"],
        action: "/planner",
      });
    }

    const answer = answerAskMama(message, Boolean(body.isJudgeMode), language);

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
