import { GoogleGenerativeAI } from "@google/generative-ai";
import { store } from "@/lib/repositories/in-memory-store";

const SYSTEM_INSTRUCTION = `
You are "MAMA", the core AI assistant for MAMAAI (mamaai.in).
You help families with personalized meal planning, dietary restrictions (medical allergies vs soft dislikes), pantry-based recipe suggestions, and application navigation.
Keep answers concise, warm, and helpful.
`;

export class AskMamaService {
  async ask(message: string, userId?: string, familyId?: string, history: Array<{ role: string; parts: string }> = []) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback contextual response if API key is not ready
      return "Namaste! I am MAMA. MAMAAI helps your family cook one common meal with customized dietary adjustments, automated grocery lists, and doctor-restriction compliance. How can I assist you with your kitchen or meals today?";
    }

    try {
      const userFamily = familyId
        ? store.families.find((f) => f.familyId === familyId)
        : store.families.find((f) => f.userId === userId) || store.families[0];

      const familyMembers = userFamily
        ? store.members.filter((m) => m.familyId === userFamily.familyId)
        : [];

      let context = SYSTEM_INSTRUCTION;
      if (userFamily && familyMembers.length > 0) {
        context += `\nFamily Context: ${userFamily.name}, Diet: ${userFamily.dietPreference}\n`;
        familyMembers.forEach((m) => {
          context += `- ${m.name}: Allergies: [${m.allergies.join(", ") || "None"}], Dislikes: [${m.dislikes.join(", ") || "None"}]\n`;
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: context,
      });

      const chat = model.startChat({
        history: history.map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.parts }],
        })),
      });

      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      console.error("AskMamaService error:", error);
      return "I'm having a brief issue connecting to my culinary brain. Please ask again in a moment!";
    }
  }
}