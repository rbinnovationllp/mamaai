import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const mealHistoryExtractionSchema = z.object({
  imageDataUrl: z.string().min(100),
  language: z.enum(["en", "hi", "kn"]).default("en"),
});

const extractedEntrySchema = z.object({
  day: z.string(),
  breakfast: z.string().optional().default(""),
  lunch: z.string().optional().default(""),
  snacks: z.string().optional().default(""),
  dinner: z.string().optional().default(""),
  uncertain: z.array(z.string()).optional().default([]),
});

function parseDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) throw new Error("Please upload a PNG, JPG, JPEG or WEBP image.");
  return {
    mimeType: match[1] === "image/jpg" ? "image/jpeg" : match[1],
    base64: match[2],
  };
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("Unable to read structured meal history from the image.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = mealHistoryExtractionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_MEAL_HISTORY_IMAGE", message: "Please upload a clear meal-history photo.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            code: "MEAL_HISTORY_AI_NOT_CONFIGURED",
            message: "Photo reading is not configured yet. Please use manual entry or skip for now.",
          },
        },
        { status: 503 }
      );
    }

    const { mimeType, base64 } = parseDataUrl(parsed.data.imageDataUrl);
    if (base64.length > 7_000_000) {
      return NextResponse.json(
        { error: { code: "IMAGE_TOO_LARGE", message: "Please upload a smaller or compressed photo." } },
        { status: 413 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.AI_PRIMARY_MODEL || "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      `Read this family meal-history sheet. Extract what the family actually ate in the last 7 days.

Return ONLY JSON, no markdown. Shape:
[
  {"day":"day_1","breakfast":"","lunch":"","snacks":"","dinner":"","uncertain":[]},
  ... up to day_7
]

Rules:
- Do not invent meals.
- If a field is unclear, leave it empty and put the field name in uncertain.
- Use day_1 to day_7 unless the sheet clearly names weekdays.
- Preserve the user's food names naturally in the selected language: ${parsed.data.language}.
- Treat High Tea, evening snack, tea snack or snacks as "snacks".
- The uploaded image is only for extraction; confirmed structured data is what the app should save.`,
    ]);

    const text = result.response.text();
    const extracted = z.array(extractedEntrySchema).parse(extractJson(text)).slice(0, 7);

    return NextResponse.json({
      entries: extracted,
      note: "Please review and correct the extracted meal history before saving.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "MEAL_HISTORY_EXTRACTION_FAILED",
          message: error instanceof Error ? error.message : "Unable to extract meal history from this photo.",
        },
      },
      { status: 422 }
    );
  }
}
