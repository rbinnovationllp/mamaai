import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { store } from "@/lib/repositories/in-memory-store";

// In-memory sliding window rate limiter for public & trial protection
const usageTracker = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, isJudge: boolean, isTrialUser: boolean): { allowed: boolean; remaining: number } {
  if (isJudge) return { allowed: true, remaining: 999 };

  const limit = isTrialUser ? 50 : 15; // 15 free queries for anonymous visitors, 50 for registered
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 hours

  const userUsage = usageTracker.get(identifier);
  if (!userUsage || now > userUsage.resetAt) {
    usageTracker.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (userUsage.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  userUsage.count += 1;
  return { allowed: true, remaining: limit - userUsage.count };
}

const SYSTEM_INSTRUCTION = `
You are "MAMA", the flagship culinary AI assistant and product expert for MAMAAI (mamaai.in).
You are currently interacting with international visitors, judges, and family meal planners.

CORE OBJECTIVES:
1. APPLICATION SUPPORT: Explain MAMAAI clearly—single-dish family meal planning, custom dietary modifications, Indian & global cuisine support, doctor-restriction compliance, automated grocery generation, and subscription tiers (Starter, Premium, Family Plus).
2. KITCHEN ASSISTANT: Suggest recipes, pantry-based dinners, taste-dislike swaps, and multi-member meal strategies.
3. ALLERGY SAFETY: Reassure users that Hard Constraints (genuine allergies & doctor restrictions) are strictly separated from Soft Constraints (taste dislikes).

TONE: Welcoming, intelligent, culturally aware, concise, and helpful. Keep responses scannable and direct.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, userId, familyId, isJudgeMode, history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: { code: "INVALID_PROMPT", message: "Please provide a valid question." } },
        { status: 400 }
      );
    }

    // Identify client for fair-use rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || userId || "anonymous-visitor";
    const isJudge = Boolean(isJudgeMode || process.env.MAMA_AI_JUDGE_ACCESS_ENABLED === "true");
    const isTrialUser = Boolean(userId && userId !== "demo-user");

    const rateLimit = checkRateLimit(clientIp, isJudge, isTrialUser);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "You have reached the free public testing limit for Ask MAMA. Register or use Judge Demo mode for extended access.",
          },
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // High-quality contextual fallback if API key is not yet set in Vercel environment
      return NextResponse.json({
        success: true,
        role: "model",
        response: getIntelligentFallback(message),
        rateLimitRemaining: rateLimit.remaining,
        isLiveAI: false,
      });
    }

    // Attach contextual household information if available
    const userFamily = familyId
      ? store.families.find((f) => f.familyId === familyId)
      : store.families.find((f) => f.userId === userId) || store.families[0];

    const familyMembers = userFamily
      ? store.members.filter((m) => m.familyId === userFamily.familyId)
      : [];

    let contextualPrompt = SYSTEM_INSTRUCTION;
    if (userFamily && familyMembers.length > 0) {
      contextualPrompt += `\n\n--- ACTIVE HOUSEHOLD CONTEXT ---\n`;
      contextualPrompt += `Family: ${userFamily.name} | Diet: ${userFamily.dietPreference} | Region: ${userFamily.city}, ${userFamily.state}\n`;
      familyMembers.forEach((m) => {
        contextualPrompt += `- ${m.name} (${m.relationship}): Allergies: [${m.allergies.join(", ") || "None"}], Doctor Restrictions: [${m.doctorRestrictions?.join(", ") || "None"}], Dislikes: [${m.dislikes.join(", ") || "None"}]\n`;
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: contextualPrompt,
    });

    const chatSession = model.startChat({
      history: history.map((h: { role: string; parts: string }) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.parts }],
      })),
    });

    const result = await chatSession.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      role: "model",
      response: responseText,
      rateLimitRemaining: rateLimit.remaining,
      isLiveAI: true,
    });
  } catch (error) {
    console.error("[Ask MAMA API Runtime Error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "INFERENCE_ERROR",
          message: error instanceof Error ? error.message : "Ask MAMA could not process this request right now.",
        },
      },
      { status: 500 }
    );
  }
}

// Built-in intelligent answers for core product queries during initial deployment
function getIntelligentFallback(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("how does mamaai work") || q.includes("how it works")) {
    return "MAMAAI is a family-first meal operating system. Instead of cooking separate meals for different diet requirements, MAMAAI plans **One Common Family Dish** with personalized modifications for each member (e.g., separating spice, removing dairy, or adjusting portions) along with automated grocery lists.";
  }
  if (q.includes("allerg") || q.includes("restriction")) {
    return "MAMAAI enforces a strict two-tier safety model: **Hard Constraints** (Medical Allergies and Doctor-Advised Restrictions) are strictly excluded from ingredients. **Soft Constraints** (Taste Dislikes) are optimized using smart ingredient swaps without adding extra kitchen workload.";
  }
  if (q.includes("subscription") || q.includes("plan") || q.includes("pricing")) {
    return "MAMAAI offers three simple plans:\n- **Starter (₹399/mo | $4.99/mo):** Up to 4 family members, daily meal plans, and grocery summaries.\n- **Premium (₹599/mo | $7.99/mo):** Up to 6 members, weekly planning, doctor compliance, and recipe video guides.\n- **Family Plus (₹999/mo | $12.99/mo):** Up to 10 members, full household optimization, and priority AI support.";
  }
  if (q.includes("plan meals") || q.includes("cook")) {
    return "To start planning meals, head over to the **Meal Planner** tab or **Family Profile** page (`/profile/family`). Add your household members, configure their dietary preferences, and generate a customized daily or weekly meal plan instantly!";
  }
  return "Namaste! I am MAMA, your culinary AI assistant. You can ask me to plan family dinners, suggest recipes with your pantry items, handle allergies, or explain how MAMAAI works.";
}