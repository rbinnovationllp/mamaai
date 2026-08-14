import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { store } from "@/lib/repositories/in-memory-store";

export const dynamic = "force-dynamic";

const SYSTEM_INSTRUCTION = `
You are "MAMA", the culinary AI assistant and product expert for MAMAAI (mamaai.in).
You are interacting with visitors, hackathon judges, and family meal planners.

CORE ROLES:
1. APPLICATION SUPPORT: Explain MAMAAI clearly—single-dish family meal planning with individual customized modifications, automated grocery lists, doctor-restriction compliance, and subscription tiers (Starter, Premium, Family Plus).
2. KITCHEN ASSISTANT: Suggest recipes, pantry-based dinners, taste-dislike swaps, and multi-member meal strategies.
3. ALLERGY SAFETY: Medical allergies and doctor restrictions are strictly excluded. Taste dislikes are handled via simple ingredient swaps.

Keep responses warm, concise, structured, and easy to read.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, userId, familyId, history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: { code: "INVALID_PROMPT", message: "Please provide a valid question." } },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        role: "model",
        response: getIntelligentFallback(message),
      });
    }

    // Attach household context if present
    const userFamily = familyId
      ? store.families.find((f) => f.familyId === familyId)
      : store.families.find((f) => f.userId === userId) || store.families[0];

    const familyMembers = userFamily
      ? store.members.filter((m) => m.familyId === userFamily.familyId)
      : [];

    let contextualPrompt = SYSTEM_INSTRUCTION;
    if (userFamily && familyMembers.length > 0) {
      contextualPrompt += `\n\n--- HOUSEHOLD CONTEXT ---\n`;
      contextualPrompt += `Family: ${userFamily.name} | Diet: ${userFamily.dietPreference}\n`;
      familyMembers.forEach((m) => {
        contextualPrompt += `- ${m.name} (${m.relationship}): Allergies: [${m.allergies.join(", ") || "None"}], Dislikes: [${m.dislikes.join(", ") || "None"}]\n`;
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: contextualPrompt,
    });

    const formattedHistory = Array.isArray(history)
      ? history.map((h: { role: string; parts: string }) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: typeof h.parts === "string" ? h.parts : "" }],
        }))
      : [];

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      role: "model",
      response: responseText,
    });
  } catch (error) {
    console.error("[Ask MAMA API Error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "INFERENCE_ERROR",
          message: error instanceof Error ? error.message : "Ask MAMA could not process this request.",
        },
      },
      { status: 500 }
    );
  }
}

function getIntelligentFallback(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("how does mamaai work") || q.includes("how it works")) {
    return "MAMAAI plans **One Common Family Dish** with customized individual modifications (spices, portions, allergen removals) rather than cooking separate meals, paired with automated grocery lists.";
  }
  if (q.includes("allerg") || q.includes("restriction")) {
    return "MAMAAI uses a two-tier safety engine: **Hard Constraints** (Medical Allergies & Doctor Advice) are strictly excluded from plates. **Soft Constraints** (Taste Dislikes) are addressed with smart ingredient swaps.";
  }
  if (q.includes("subscription") || q.includes("plan") || q.includes("pricing")) {
    return "MAMAAI offers Starter (up to 4 members), Premium (up to 6 members with doctor restriction tracking), and Family Plus (up to 10 members with priority AI support).";
  }
  if (q.includes("plan meals") || q.includes("cook")) {
    return "To start planning meals, visit the **Family Profile** page (`/profile/family`) to configure your household members and generate a customized meal plan instantly!";
  }
  return "Namaste! I am MAMA. How can I assist you with your family's meal planning, recipes, or dietary preferences today?";
}