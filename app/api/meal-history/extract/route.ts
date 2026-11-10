import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { requireUser, authErrorResponse } from "@/lib/server/auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { MealHistoryUploadError, canonicalMealHistoryDay, parseMealHistoryUploadDataUrl } from "@/lib/shared/meal-history-upload";

const mealHistoryExtractionSchema = z.object({
  fileDataUrl: z.string().min(100).optional(),
  imageDataUrl: z.string().min(100).optional(),
  language: z.enum(["en", "hi", "kn"]).default("en"),
}).refine((value) => Boolean(value.fileDataUrl || value.imageDataUrl), { message: "A meal-history file is required." });

const extractedEntrySchema = z.object({
  day: z.string(),
  breakfast: z.string().optional().default(""),
  lunch: z.string().optional().default(""),
  snacks: z.string().optional().default(""),
  dinner: z.string().optional().default(""),
  uncertain: z.array(z.string()).optional().default([]),
});
const EXTRACTION_TIMEOUT_MS = 15_000;

class ExtractionError extends Error {
  constructor(readonly category: "timeout" | "provider_rejection" | "invalid_output" | "local_validation" | "provider_failure", readonly status: number, message: string, readonly providerStatus?: number) { super(message); }
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) throw new ExtractionError("invalid_output", 422, "The meal reader returned no usable meal entries.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function safeFailure(error: unknown) {
  if (error instanceof ExtractionError) return error;
  if (error instanceof MealHistoryUploadError) return new ExtractionError("local_validation", error.status, error.publicMessage);
  const candidate = error as { name?: string; message?: string; status?: number; response?: { status?: number } };
  const providerStatus = candidate?.status ?? candidate?.response?.status;
  if (candidate?.name === "AbortError" || /timeout|timed out/i.test(candidate?.message ?? "")) return new ExtractionError("timeout", 504, "Meal reading took too long. Please retry or enter meals manually.", providerStatus);
  if (providerStatus && providerStatus >= 400) return new ExtractionError("provider_rejection", 502, "Meal reading is temporarily unavailable. Please retry or enter meals manually.", providerStatus);
  return new ExtractionError("provider_failure", 502, "Meal reading is temporarily unavailable. Please retry or enter meals manually.", providerStatus);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  try {
    requireSameOrigin(request);
    if (process.env.MAMAAI_SMART_HISTORY_UPLOAD_ENABLED !== "true") {
      return NextResponse.json({ error: { code: "FEATURE_DISABLED", message: "Smart meal-history upload is not enabled." } }, { status: 404 });
    }
    await requireUser(request);
    const body = await request.json();
    const parsed = mealHistoryExtractionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ExtractionError("local_validation", 400, "Choose a clear PNG, JPG, JPEG, WEBP image, or PDF meal-history file.");
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

    const { mimeType, base64 } = parseMealHistoryUploadDataUrl(parsed.data.fileDataUrl ?? parsed.data.imageDataUrl!);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.MAMA_AI_GEMINI_MODEL || process.env.AI_PRIMARY_MODEL || "gemini-2.5-flash" });
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS);
    let result;
    const simulateTimeout = process.env.MAMA_AI_LOCAL_QA === "true" && new URL(request.url).searchParams.get("qaMealHistoryTimeout") === "1";
    const aborted = new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new DOMException("Timed out", "AbortError")), { once: true }));
    try { result = await Promise.race([simulateTimeout ? new Promise<never>(() => undefined) : model.generateContent([
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
    ], { timeout: EXTRACTION_TIMEOUT_MS, signal: controller.signal }), aborted]); } finally { clearTimeout(deadline); }

    const text = result.response.text().trim();
    if (!text) throw new ExtractionError("invalid_output", 422, "The meal reader returned no usable meal entries.");
    const extracted = z.array(extractedEntrySchema).parse(extractJson(text)).slice(0, 7)
      .map((entry) => ({ ...entry, day: canonicalMealHistoryDay(entry.day) }))
      .filter((entry): entry is Omit<typeof entry, "day"> & { day: string } => Boolean(entry.day));

    if (!extracted.length) throw new ExtractionError("invalid_output", 422, "The meal reader returned no usable meal entries.");
    if (process.env.MAMA_AI_LOCAL_QA === "true") console.error("LOCAL_QA_MEAL_HISTORY_EXTRACTION", { requestId, elapsedMs: Date.now() - startedAt, category: "success", providerStatus: null });
    return NextResponse.json({
      entries: extracted,
      note: "Please review and correct the extracted meal history before saving.",
    });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const failure = safeFailure(error);
    if (process.env.MAMA_AI_LOCAL_QA === "true") console.error("LOCAL_QA_MEAL_HISTORY_EXTRACTION", { requestId, elapsedMs: Date.now() - startedAt, category: failure.category, providerStatus: failure.providerStatus ?? null });
    return NextResponse.json({ error: { code: `MEAL_HISTORY_${failure.category.toUpperCase()}`, message: failure.message }, requestId }, { status: failure.status });
  }
}


