import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveKnowledgeChunks } from "@/lib/ai/knowledge-retriever";
import { answerAskMama } from "@/lib/ask-mama/knowledge-base";
import { classifyAskMamaSafetyRequest } from "@/lib/ai/ask-mama-safety";
import { classifyAskMamaRequest, validateAskMamaModelResponse } from "@/lib/ai/ask-mama-response-safety";
import { askMamaUnavailableMessage, isAskMamaPreviewBlocked } from "@/lib/ai/ask-mama-runtime-safety";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import type { FamilyMember } from "@/lib/shared/contracts";
import { getSession } from "@/lib/auth/session";
import { requireUser } from "@/lib/server/auth";
import { configuredPositiveInt, enforceDurableRateLimit, RateLimitExceededError, RateLimitStorageError, requestIpAddress } from "@/lib/server/durable-rate-limit";
import { docClient, TABLE_NAMES } from "@/lib/repositories/dynamo";
import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { type AppLanguage, isAppLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";

interface RequestPayload {
  message?: string;
  question?: string;
  isJudgeMode?: boolean;
  language?: AppLanguage;
  responseLanguage?: AppLanguage;
  history?: Array<{ role: string; parts: string | string[] }>;
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

function safetyMembersFromProfile(profile: any): FamilyMember[] {
  return (profile?.members ?? []).filter((member: any) => member?.name).map((member: any, index: number) => ({ memberId: member.id || `ask-mama-member-${index}`, familyId: profile.familyId || "ask-mama-family", name: member.name, relationship: member.relation || "Family member", age: typeof member.age === "number" ? member.age : 30, gender: "prefer_not_to_say", activityLevel: member.activityLevel || "moderate", goals: [], dietType: /jain/i.test(member.foodPreference || "") ? "jain" : /vegan/i.test(member.foodPreference || "") ? "vegan" : /eggitarian/i.test(member.foodPreference || "") ? "eggitarian" : /non.?veg/i.test(member.foodPreference || "") ? "non_vegetarian" : "vegetarian", dislikedMeals: member.dislikes || [], excludedIngredients: [], dietaryRestrictions: member.doctorAdvisedRestrictions || [], healthConditions: [], doctorRestrictions: member.doctorAdvisedRestrictions || [], specialStatuses: [], allergies: member.allergies || [], foodAllergies: member.allergies || [], ingredientAllergies: member.allergies || [], fastingPreference: { observesFasting: "no", regularDays: [], allowedFoods: [], avoidedFoods: [], fruitsAllowed: true, dairyAllowed: true, grainsRestricted: false, customRules: [] } }));
}
function getLocalizedSuggestions(language: AppLanguage): string[] {
  switch (language) {
    case "hi":
      return [
        "आज रात क्या बनाएं?",
        "मेरी पैंट्री में क्या है?",
        "प्लान और कीमतें दिखाएं",
        "पारिवारिक प्रोफाइल कैसे सेट करें?",
      ];
    case "kn":
      return [
        "ಇಂದು ರಾತ್ರಿ ಏನು ಅಡುಗೆ ಮಾಡುವುದು?",
        "ನನ್ನ ಪ್ಯಾಂಟ್ರಿಯಲ್ಲಿ ಏನಿದೆ?",
        "ಯೋಜನೆಗಳು ಮತ್ತು ದರಗಳು",
        "ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್ ಹೇಗೆ ರಚಿಸುವುದು?",
      ];
    case "en":
    default:
      return [
        "What can I cook tonight?",
        "What is in my pantry?",
        "Show subscription plans",
        "How do I set up family profile?",
      ];
  }
}

function formatClientContext(context: RequestPayload["profileContext"]): string {
  if (!context) return "No client-side profile context provided.";

  const members = (context.members || [])
    .filter((m) => m.name)
    .map(
      (m) =>
        `${m.name} (${m.relation || "Member"}, Age: ${m.age ?? "N/A"}, Diet: ${m.foodPreference || "Veg"}, Allergies: [${(m.allergies || []).join(", ")}], Medical Restrictions: [${(m.doctorAdvisedRestrictions || []).join(", ")}], Dislikes: [${(m.dislikes || []).join(", ")}])`
    )
    .join("; ");

  const pantry = (context.pantryItems || [])
    .filter((p) => p.name)
    .map((p) => `${p.name}: ${p.quantity ?? ""} ${p.unit ?? ""}`.trim())
    .join(", ");

  const mealPrefs = Object.entries(context.mealTypePreferences || {})
    .filter(([, v]) => Array.isArray(v) && v.length)
    .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
    .join("; ");

  return `
CLIENT PROFILE CONTEXT:
- Diet Type: ${context.householdFoodPreference || "Not specified"}
- Cooking Habit: ${context.cookingHabit || "Not specified"}
- Family Members: ${members || "No members added yet"}
- Pantry Stock: ${pantry || "Empty"}
- Meal Slot Preferences: ${mealPrefs || "None"}
- Non-Veg Favorites: ${(context.nonVegPreferredFoods || []).join(", ") || "None"}
`.trim();
}

export async function POST(request: Request) {
  let targetLanguage: AppLanguage = "en";
  let queryText = "";

  try {
    const body = (await request.json()) as RequestPayload;
    queryText = (body.question || body.message || "").trim();

    const safetyRequest = classifyAskMamaSafetyRequest(queryText);
    if (safetyRequest) {
      const message = safetyRequest === "pet_feeding"
        ? "MAMAAI does not provide pet-feeding advice. Please consult a qualified veterinarian."
        : "I cannot override meal-safety restrictions or disclose internal instructions. I can help with safe MAMAAI product guidance.";
      return NextResponse.json({ success: false, error: { code: "UNSAFE_OR_UNSUPPORTED_REQUEST", message } }, { status: 400 });
    }

    try {
      await enforceDurableRateLimit({ scope: "ask_mama_ip", key: requestIpAddress(request), limit: configuredPositiveInt(process.env.MAMA_AI_ASK_MAMA_IP_LIMIT, 20), windowSeconds: 60 });
    } catch (error) {
      if (error instanceof RateLimitExceededError) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Please wait before sending another Ask MAMA request." } }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
      if (error instanceof RateLimitStorageError) return NextResponse.json({ error: { code: "REQUEST_LIMIT_UNAVAILABLE", message: "Ask MAMA is temporarily unavailable. Please try again later." } }, { status: 503 });
      throw error;
    }
    if (!queryText) {
      return NextResponse.json(
        { error: { code: "INVALID_PROMPT", message: "Please provide a valid question." } },
        { status: 400 }
      );
    }

    // Resolve target language
    const rawLang = body.responseLanguage || body.language;
    targetLanguage = isAppLanguage(rawLang) ? rawLang : "en";
    const requestKind = classifyAskMamaRequest(queryText);
    if (isAskMamaPreviewBlocked()) {
      return NextResponse.json({ success: false, error: { code: "ASK_MAMA_PREVIEW_DISABLED", message: "Ask MAMA is disabled in this preview until its safety configuration is explicitly validated." } }, { status: 503 });
    }

    const session = await getSession();
    const authenticatedUser = await (async () => { try { return await requireUser(request); } catch { return undefined; } })();
    if (authenticatedUser?.userId) {
      try {
        await enforceDurableRateLimit({ scope: "ask_mama_user", key: authenticatedUser.userId, limit: configuredPositiveInt(process.env.MAMA_AI_ASK_MAMA_USER_LIMIT, 10), windowSeconds: 60 });
      } catch (error) {
        if (error instanceof RateLimitExceededError) return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Your Ask MAMA request limit has been reached. Please try again shortly." } }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
        if (error instanceof RateLimitStorageError) return NextResponse.json({ error: { code: "REQUEST_LIMIT_UNAVAILABLE", message: "Ask MAMA is temporarily unavailable. Please try again later." } }, { status: 503 });
        throw error;
      }
    }
    const isJudge = Boolean(
      session?.role === "admin" ||
      session?.entitlement === "judge"
    );

    // =========================================================
    // LAYER A: Retrieve PRD Knowledge Base Chunks (RAG)
    // =========================================================
    const matchedChunks = retrieveKnowledgeChunks(queryText, 4);
    const knowledgeContext = matchedChunks
      .map(
        (chunk) =>
          `[Topic: ${chunk.topic} | Domain: ${chunk.domain} | Status: ${chunk.featureStatus}]\n${chunk.canonicalFacts}`
      )
      .join("\n\n");

    // =========================================================
    // LAYER B: Fetch Live Customer State from DynamoDB / Session
    // =========================================================
    let liveDatabaseContext = "Visitor status: Not signed in.";

    if (authenticatedUser?.userId) {
      try {
        const userRes = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.USERS,
            Key: { userId: authenticatedUser.userId },
          })
        );
        const user = userRes.Item;

        const pantryRes = await docClient.send(
          new QueryCommand({
            TableName: TABLE_NAMES.PANTRY,
            KeyConditionExpression: "userId = :uid",
            ExpressionAttributeValues: { ":uid": authenticatedUser.userId },
            Limit: 12,
          })
        );
        const serverPantry = (pantryRes.Items || [])
          .map((i) => `${i.name}: ${i.quantity} ${i.unit}`)
          .join(", ");

        liveDatabaseContext = `
AUTHENTICATED DATABASE STATE:
- User ID: ${authenticatedUser.userId}
- Name: ${user?.name || "Customer"}
- Active Subscription: ${user?.subscriptionPlan || "Starter (Trial)"} (Status: ${user?.subscriptionStatus || "Active"})
- Persistent DynamoDB Pantry: ${serverPantry || "Pantry table empty"}
- Demo/Judge Bypass: ${isJudge ? "Active Evaluator Mode" : "Standard User"}
`.trim();
      } catch (dbErr) {
        console.warn("[Ask MAMA] DynamoDB contextual lookup fallback:", dbErr);
      }
    }

    let safetyMembers: FamilyMember[] = [];
    if (authenticatedUser?.userId) { try { safetyMembers = safetyMembersFromProfile(await new CustomerProfileRepository().getFamilyProfile(authenticatedUser.userId)); } catch (error) { console.warn("[Ask MAMA] Safety profile lookup failed:", error); } }
    const clientContext = formatClientContext(body.profileContext);

    // =========================================================
    // STRICT MULTILINGUAL GENERATIVE PROMPT ORCHESTRATION
    // =========================================================
    const languageDirectives: Record<AppLanguage, string> = {
      hi: `CRITICAL INSTRUCTION: You MUST formulate your entire response in natural, fluent, and polite HINDI (हिन्दी). Devanagari script is mandatory. Do not answer in English.`,
      kn: `CRITICAL INSTRUCTION: You MUST formulate your entire response in natural, fluent, and polite KANNADA (ಕನ್ನಡ). Kannada script is mandatory. Do not answer in English.`,
      en: `CRITICAL INSTRUCTION: Answer clearly and concisely in standard English.`,
    };

    const systemPrompt = `
You are "Ask MAMA", the official intelligent AI chatbot and culinary companion for MAMAAI.

LANGUAGE ENFORCEMENT:
Target Output Language: ${targetLanguage.toUpperCase()}
${languageDirectives[targetLanguage]}

MAMAAI SYSTEM DIRECTIVES & BEHAVIOR:
1. Ground your answers strictly in the Verified Knowledge Base and Live Context provided below.
2. Canonical Brand Names: Keep proper nouns like "MAMAAI", "Family Plus", "Starter", "Premium", "Ask MAMA", "SabSewa Local" in their standard recognizable form.
3. Feature Life Cycle: If a feature is marked "PLANNED", inform the user that it is an upcoming capability. Do not pretend it is fully active.
4. Unauthenticated Visitor Handling: If a non-logged-in visitor asks for account-specific information (e.g., "What is in my pantry?"), answer warmly, explain how the feature works in MAMAAI, and guide them to sign in.
5. For specific meal, recipe, ingredient substitution, child-food, or dietary suggestions, return kind "meal_recommendation" with every ingredient named. Never claim medical safety.
6. Return valid JSON only: {"kind":"general","answer":"..."} or {"kind":"meal_recommendation","answer":"...","meals":[{"name":"...","ingredients":["..."],"preparationNotes":["..."]}]}.

==================================================
VERIFIED MAMAAI KNOWLEDGE BASE (PRD RAG):
==================================================
${knowledgeContext || "General family meal planning for Indian households."}

==================================================
LIVE ACCOUNT & CLIENT PROFILE:
==================================================
${liveDatabaseContext}
${clientContext}
`.trim();

    // =========================================================
    // GEMINI 2.5 FLASH INFERENCE
    // =========================================================
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (requestKind === "general") {
        const localAnswer = answerAskMama(queryText, true, targetLanguage);
        if (!localAnswer.unresolved) {
          return NextResponse.json({ success: true, role: "model", response: localAnswer.answer, answer: localAnswer.answer, responseLanguage: targetLanguage, category: localAnswer.category, suggestions: localAnswer.suggestions, unresolved: false, fallbackSource: "local_mamaai_knowledge_base" });
        }
      }
      return NextResponse.json({ success: false, error: { code: "ASK_MAMA_FOOD_ADVICE_UNAVAILABLE", message: askMamaUnavailableMessage(requestKind) }, response: askMamaUnavailableMessage(requestKind), unresolved: true }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      },
    });

    const conversationHistory = Array.isArray(body.history)
      ? body.history.map((h) => ({
        role: h.role === "assistant" || h.role === "model" ? "model" : "user",
        parts: [{ text: Array.isArray(h.parts) ? h.parts.join(" ") : String(h.parts) }],
      }))
      : [];

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text:
                targetLanguage === "hi"
                  ? "नमस्ते! मैं MAMAAI की आधिकारिक सहायक MAMA हूँ। मैं आपके परिवार के भोजन नियोजन में कैसे सहायता करूँ?"
                  : targetLanguage === "kn"
                    ? "ನಮಸ್ಕಾರ! ನಾನು MAMAAI ನ ಅಧಿಕೃತ ಸಹಾಯಕ MAMA. ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
                    : "Hello! I am MAMA, your official assistant for MAMAAI. How can I assist you with your family meal planning today?",
            },
          ],
        },
        ...conversationHistory,
      ],
    });

    const result = await chat.sendMessage(queryText);
    const decision = validateAskMamaModelResponse(result.response.text(), requestKind, safetyMembers);
    if (!decision.allowed || !decision.response) return NextResponse.json({ success: true, role: "model", response: decision.message, answer: decision.message, responseLanguage: targetLanguage, category: "safety_clarification", suggestions: getLocalizedSuggestions(targetLanguage), unresolved: true, safetyStatus: decision.safety?.status ?? "needs_clarification" });

    return NextResponse.json({
      success: true,
      role: "model",
      response: decision.response.answer,
      answer: decision.response.answer,
      responseLanguage: targetLanguage,
      category: matchedChunks[0]?.domain || "general_inquiry",
      suggestions: getLocalizedSuggestions(targetLanguage),
      action: queryText.toLowerCase().includes("plan") ? "/planner" : undefined,
      matchedKnowledgeIds: matchedChunks.map((c) => c.id),
      unresolved: false,
    });
  } catch (error) {
    console.error("[Ask MAMA API Exception]:", error);

    if (queryText && classifyAskMamaRequest(queryText) === "general") {
      const localAnswer = answerAskMama(queryText, true, targetLanguage);
      if (!localAnswer.unresolved) {
        return NextResponse.json({
          success: true,
          role: "model",
          response: localAnswer.answer,
          answer: localAnswer.answer,
          responseLanguage: targetLanguage,
          category: localAnswer.category,
          suggestions: localAnswer.suggestions,
          action:
            localAnswer.action?.type === "add_family"
              ? "/profile/family"
              : localAnswer.action?.type === "try_demo"
                ? "/#planner"
                : undefined,
          unresolved: false,
          fallbackSource: "local_mamaai_knowledge_base",
        });
      }
    }

    const fallbackMessages: Record<AppLanguage, string> = {
      hi: "क्षमा करें, अभी आपका उत्तर तैयार करने में समस्या आ रही है। कृपया कुछ समय बाद पुनः प्रयास करें।",
      kn: "ಕ್ಷಮಿಸಿ, ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      en: "I apologize, but I could not process your request right now. Please try again in a moment.",
    };

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ASK_MAMA_EXECUTION_FAILURE",
          message: askMamaUnavailableMessage(classifyAskMamaRequest(queryText || "")),
        },
        response: fallbackMessages[targetLanguage],
      },
      { status: 500 }
    );
  }
}















