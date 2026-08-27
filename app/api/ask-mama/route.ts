import { NextResponse } from "next/server";
import { answerAskMama } from "@/lib/ask-mama/knowledge-base";
import { type AppLanguage, isAppLanguage } from "@/lib/i18n";
import { AskMamaService } from "@/lib/services/ask-mama-service";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface RequestPayload {
  message?: string;
  isJudgeMode?: boolean;
  language?: AppLanguage;
  history?: Array<{ role: string; parts: string }>;
  profileContext?: {
    householdFoodPreference?: string;
    cookingHabit?: string;
    mealTypePreferences?: Partial<Record<"breakfast" | "lunch" | "snacks" | "dinner", string[]>>;
    recentMealHistory?: Array<Record<string, string>>;
    weeklyFoodRoutine?: Array<Record<string, unknown>>;
    nonVegPreferredFoods?: string[];
    pantryItems?: Array<{
      name?: string;
      quantity?: number;
      unit?: string;
      expiryDate?: string;
    }>;
    members?: Array<{
      name?: string;
      relation?: string;
      age?: number;
      foodPreference?: string;
      nonVegFrequency?: string;
      nonVegAvoidDays?: string[];
      allergies?: string[];
      doctorAdvisedRestrictions?: string[];
      dislikes?: string[];
    }>;
  };
}

function isCookingQuestion(message: string): boolean {
  return /(cook|meal|dinner|lunch|breakfast|snack|high tea|pantry|grocery|ingredient|frozen|ready|family|recipe|substitute|dish|खाना|भोजन|पक|अंडा|शाकाहारी|पैंट्री|किराना|ಊಟ|ಅಡುಗೆ|ತಿಂಡಿ|ಪ್ಯಾಂಟ್ರಿ|ಕಿರಾಣಿ)/i.test(
    message
  );
}

function localizedProfileValue(kind: "food" | "cooking", value: string | undefined, language: AppLanguage): string {
  const fallback = {
    en: "not yet selected",
    hi: "अभी नहीं चुना गया",
    kn: "ಇನ್ನೂ ಆಯ್ಕೆಮಾಡಿಲ್ಲ",
  }[language];
  if (!value) return fallback;

  const food: Record<string, string> = ({
    en: {
      vegetarian: "Vegetarian",
      eggetarian: "Eggetarian",
      non_vegetarian: "Non-Vegetarian",
      semi_vegetarian: "Mostly Vegetarian / Semi-Vegetarian",
      vegan: "Vegan",
      mixed: "Mixed family preferences",
      other: "Custom preference",
    },
    hi: {
      vegetarian: "शाकाहारी",
      eggetarian: "एगेटेरियन",
      non_vegetarian: "मांसाहारी",
      semi_vegetarian: "अधिकतर शाकाहारी / सेमी-वेज",
      vegan: "वीगन",
      mixed: "परिवार में अलग-अलग भोजन पसंद",
      other: "कस्टम पसंद",
    },
    kn: {
      vegetarian: "ಸಸ್ಯಾಹಾರಿ",
      eggetarian: "ಎಗ್ಗೆಟೇರಿಯನ್",
      non_vegetarian: "ಮಾಂಸಾಹಾರಿ",
      semi_vegetarian: "ಹೆಚ್ಚಾಗಿ ಸಸ್ಯಾಹಾರಿ / ಸೆಮಿ-ವೆಜ್",
      vegan: "ವೀಗನ್",
      mixed: "ಕುಟುಂಬದಲ್ಲಿ ವಿಭಿನ್ನ ಆಹಾರ ಇಷ್ಟಗಳು",
      other: "ಕಸ್ಟಮ್ ಇಷ್ಟ",
    },
  }[language] as Record<string, string>) || {};

  const cooking: Record<string, string> = ({
    en: {
      fresh_home_cooked: "mostly fresh home-cooked meals",
      ready_frozen: "mostly ready-made or frozen cooked meals",
      fresh_ready_mix: "a mix of fresh cooking and ready-made or frozen foods",
      takeaway_prepared: "mostly prepared meals or takeaway",
      other: "custom cooking habit",
    },
    hi: {
      fresh_home_cooked: "अधिकतर घर में ताजा बना खाना",
      ready_frozen: "अधिकतर ready-made या frozen cooked meals",
      fresh_ready_mix: "ताजा खाना और ready-made/frozen foods का मिश्रण",
      takeaway_prepared: "अधिकतर बाहर से तैयार खाना या takeaway",
      other: "कस्टम cooking habit",
    },
    kn: {
      fresh_home_cooked: "ಹೆಚ್ಚಾಗಿ ಮನೆಯಲ್ಲಿ ತಾಜಾ ಅಡುಗೆ",
      ready_frozen: "ಹೆಚ್ಚಾಗಿ ready-made ಅಥವಾ frozen cooked meals",
      fresh_ready_mix: "ತಾಜಾ ಅಡುಗೆ ಮತ್ತು ready-made/frozen foods ಮಿಶ್ರಣ",
      takeaway_prepared: "ಹೆಚ್ಚಾಗಿ ಹೊರಗಿನ prepared meals ಅಥವಾ takeaway",
      other: "ಕಸ್ಟಮ್ cooking habit",
    },
  }[language] as Record<string, string>) || {};

  return (kind === "food" ? food[value] : cooking[value]) ?? value;
}

function profileAwareAnswer(message: string, context: RequestPayload["profileContext"], language: AppLanguage): string | null {
  if (!context || !isCookingQuestion(message)) return null;

  const members = context.members?.filter((member) => member.name) ?? [];
  if (!members.length && !context.householdFoodPreference && !context.cookingHabit) return null;

  const food = localizedProfileValue("food", context.householdFoodPreference, language);
  const cooking = localizedProfileValue("cooking", context.cookingHabit, language);
  const memberSummary = members
    .map((member) => `${member.name}: ${localizedProfileValue("food", member.foodPreference, language)}${member.age ? `, age ${member.age}` : ""}`)
    .join(", ");
  const pantryItems = context.pantryItems?.filter((item) => item.name).slice(0, 8) ?? [];
  const pantrySummary = pantryItems
    .map((item) => `${item.name}${item.quantity ? ` ${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : ""}`)
    .join(", ");
  const mealPreferences = Object.entries(context.mealTypePreferences ?? {})
    .filter(([, values]) => Array.isArray(values) && values.length)
    .map(([slot, values]) => `${slot}: ${(values as string[]).join(", ")}`)
    .join("; ");

  if (language === "hi") {
    return `आपकी सेव की हुई प्रोफाइल के अनुसार परिवार की भोजन पसंद: ${food}; खाना बनाने की आदत: ${cooking}. सदस्य: ${memberSummary || "सदस्यों की भोजन पसंद अभी नहीं जोड़ी गई है"}. ${mealPreferences ? `Meal-wise पसंद: ${mealPreferences}. ` : ""}${pantrySummary ? `Pantry में अभी: ${pantrySummary}. पहले इन्हें use करने वाला plan बनाएं और missing items ही grocery में जोड़ें. ` : ""}MAMAAI इसी आधार पर साझा पारिवारिक भोजन सुझाएगा और एलर्जी/डॉक्टर की पाबंदियों को सख्त नियम मानेगा। अगला कदम: Meal Planner में "आज का पारिवारिक भोजन प्लान करें" दबाएं।`;
  }

  if (language === "kn") {
    return `ನಿಮ್ಮ ಉಳಿಸಿದ ಪ್ರೊಫೈಲ್ ಪ್ರಕಾರ ಕುಟುಂಬದ ಆಹಾರ ಇಷ್ಟ: ${food}; ಅಡುಗೆ ಪದ್ಧತಿ: ${cooking}. ಸದಸ್ಯರು: ${memberSummary || "ಸದಸ್ಯರ ಆಹಾರ ಇಷ್ಟಗಳು ಇನ್ನೂ ಸೇರಿಲ್ಲ"}. ${mealPreferences ? `Meal-wise ಇಷ್ಟಗಳು: ${mealPreferences}. ` : ""}${pantrySummary ? `Pantry ನಲ್ಲಿ ಈಗಿದೆ: ${pantrySummary}. ಮೊದಲು ಇವುಗಳನ್ನು ಬಳಸುವ plan ಮಾಡಿ, missing items ಮಾತ್ರ grocery ಗೆ ಸೇರಿಸಿ. ` : ""}MAMAAI ಇದನ್ನೇ ಆಧಾರ ಮಾಡಿಕೊಂಡು ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ಊಟವನ್ನು ಸೂಚಿಸುತ್ತದೆ ಮತ್ತು ಅಲರ್ಜಿ/ವೈದ್ಯರ ನಿರ್ಬಂಧಗಳನ್ನು ಕಡ್ಡಾಯ ನಿಯಮಗಳಾಗಿ ನೋಡುತ್ತದೆ. ಮುಂದಿನ ಹಂತ: Meal Planner ನಲ್ಲಿ "ಇಂದಿನ ಕುಟುಂಬದ ಊಟವನ್ನು ಯೋಜಿಸಿ" ಒತ್ತಿ.`;
  }

  return `Using your saved profile: household food preference is ${food}; cooking habit is ${cooking}. Members: ${memberSummary || "member food preferences are still missing"}. ${mealPreferences ? `Meal-wise preferences: ${mealPreferences}. ` : ""}${pantrySummary ? `Current pantry: ${pantrySummary}. Prefer a plan that uses these first and adds only missing quantities to groceries. ` : ""}MAMAAI will use this to suggest a practical common family meal while treating allergies and doctor restrictions as hard rules. Next step: open Meal Planner and tap "Plan Today's Family Meal."`;
}

function localizedSuggestions(language: AppLanguage): string[] {
  if (language === "hi") {
    return ["Meal Planner खोलें", "Family Profile पूरी करें", "Subscription plans दिखाएं"];
  }
  if (language === "kn") {
    return ["Meal Planner ತೆರೆಯಿರಿ", "Family Profile ಪೂರ್ಣಗೊಳಿಸಿ", "Subscription plans ತೋರಿಸಿ"];
  }
  return ["Open Meal Planner", "Complete Family Profile", "Show subscription plans"];
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = (await request.json()) as RequestPayload;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: { code: "INVALID_PROMPT", message: "Please provide a valid question." } },
        { status: 400 }
      );
    }

    const language = isAppLanguage(body.language) ? body.language : "en";
    const isJudgeMode = Boolean(body.isJudgeMode || session?.role === "admin" || session?.entitlement === "judge");

    // Route 1: Culinary / Ingredient / Meal Planning reasoning via Gemini Service
    if (isCookingQuestion(message)) {
      const askMamaService = new AskMamaService();
      const response = await askMamaService.ask({
        message,
        language,
        profileContext: body.profileContext,
        history: Array.isArray(body.history) ? body.history : [],
      });

      return NextResponse.json({
        success: true,
        role: "model",
        response,
        category: "meal_planning",
        suggestions: localizedSuggestions(language),
        action: "/planner",
      });
    }

    // Route 2: Profile overview & prompt guidance
    const contextualAnswer = profileAwareAnswer(message, body.profileContext, language);
    if (contextualAnswer) {
      return NextResponse.json({
        success: true,
        role: "model",
        response: contextualAnswer,
        category: "meal_planning",
        suggestions: localizedSuggestions(language),
        action: "/planner",
      });
    }

    // Route 3: Deterministic Knowledge Base (Subscriptions, Tiers, Navigation)
    const answer = answerAskMama(message, isJudgeMode, language);

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