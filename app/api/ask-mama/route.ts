import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { store } from "@/lib/repositories/in-memory-store";

interface AskMamaRequestBody {
  message: string;
  userId?: string;
  familyId?: string;
  history?: Array<{ role: "user" | "model"; parts: string }>;
}

const SYSTEM_INSTRUCTION = `
You are "MAMA", the core AI assistant and intelligence engine behind MAMAAI (mamaai.in).
You serve two distinct, vital roles:

ROLE 1: MAMAAI APPLICATION SUPPORT AGENT
- Explain MAMAAI features: Single family meal planning with custom adjustments, automated grocery lists, recipe video suggestions, pantry tracking, culture-specific dishes, and subscription options.
- Guide users on creating/updating family profiles, setting up household members, trial features, and Judge Demo mode.
- Explain dietary tiering: Hard Constraints (medical allergies, doctor restrictions) vs. Soft Constraints (taste dislikes).
- Explain subscription plans: Starter (up to 4 members), Premium (up to 6 members), and Family Plus (up to 10 members).

ROLE 2: PERSONAL AI KITCHEN & NUTRITION ASSISTANT
- Suggest meals, recipes, and practical pantry-utilization dishes ("What should I cook tonight with X?").
- When a family profile is present:
  * CRITICAL HARD SAFETY RULE: STRICTLY avoid any ingredients listed under medical allergies and doctor restrictions for the affected family member.
  * TASTE RULE: Respect soft dislikes by offering substitutions without forcing the whole family to cook 3 separate meals.
  * Provide practical cooking steps, prep times, and child-friendly meal swap suggestions.

Tone: Warm, encouraging, culturally aware (Indian & global regional cuisines), helpful, and direct. Keep answers concise, clear, and easy to read.
`;

export async function POST(request: Request) {
  try {
    const body: AskMamaRequestBody = await request.json();
    const { message, userId = "demo-user", familyId, history = [] } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Message cannot be empty." } },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: "CONFIG_ERROR",
            message: "GEMINI_API_KEY environment variable is not configured on the server.",
          },
        },
        { status: 500 }
      );
    }

    // Retrieve active family context & pantry inventory for personalized assistance
    const userFamily = familyId
      ? store.families.find((f) => f.familyId === familyId)
      : store.families.find((f) => f.userId === userId) || store.families[0];

    const familyMembers = userFamily
      ? store.members.filter((m) => m.familyId === userFamily.familyId)
      : [];

    let contextualPromptExtension = "";
    if (userFamily && familyMembers.length > 0) {
      contextualPromptExtension += `\n--- ACTIVE USER & HOUSEHOLD CONTEXT ---\n`;
      contextualPromptExtension += `Family Name: ${userFamily.name} | Diet: ${userFamily.dietPreference} | Region/City: ${userFamily.city}, ${userFamily.state}\n`;
      contextualPromptExtension += `Members:\n`;
      familyMembers.forEach((m) => {
        contextualPromptExtension += `- ${m.name} (${m.relationship}): Allergies: [${m.allergies.join(", ") || "None"}], Doctor Restrictions: [${m.doctorRestrictions?.join(", ") || "None"}], Dislikes: [${m.dislikes.join(", ") || "None"}]\n`;
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION + contextualPromptExtension,
    });

    const chat = model.startChat({
      history: history.map((h) => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
    });

    const result = await chat.sendMessage(message);
    const textResponse = result.response.text();

    return NextResponse.json({
      success: true,
      role: "model",
      response: textResponse,
      contextUsed: Boolean(userFamily),
    });
  } catch (error) {
    console.error("[Ask MAMA API Error]:", error);
    return NextResponse.json(
      {
        error: {
          code: "ASK_MAMA_INFERENCE_FAILED",
          message: error instanceof Error ? error.message : "Failed to generate AI response.",
        },
      },
      { status: 500 }
    );
  }
}