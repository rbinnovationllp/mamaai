import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { FAMILY_PROFILE_DOCUMENT_ACCEPT, familyDocumentImportSchema, parseFamilyProfileDocumentText } from "@/lib/shared/family-profile-document";
import { parseMealHistoryUploadDataUrl } from "@/lib/shared/meal-history-upload";

const requestSchema = z.object({ text: z.string().max(30000).optional(), files: z.array(z.string().min(40)).max(5).optional() }).refine((v) => Boolean(v.text?.trim() || v.files?.length), "Paste text or select at least one file.");
export async function POST(request: Request) {
  try {
    requireSameOrigin(request); await requireUser(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: { code: "PROFILE_IMPORT_INVALID", message: "Paste text or select up to five clear image/PDF pages." } }, { status: 400 });
    if (parsed.data.text?.trim()) return NextResponse.json({ draft: parseFamilyProfileDocumentText(parsed.data.text), retention: "Original text is not saved." });
    // Files are validated and held only for this request; only a reviewed structured draft can later be saved.
    const pages = (parsed.data.files ?? []).map((file) => parseMealHistoryUploadDataUrl(file));
    if (process.env.MAMAAI_FAMILY_DOCUMENT_OCR_ENABLED !== "true" || !process.env.GEMINI_API_KEY) return NextResponse.json({ error: { code: "PROFILE_IMPORT_OCR_NOT_CONFIGURED", message: `Document image/PDF reading needs the optional OCR provider. Accepted formats: ${FAMILY_PROFILE_DOCUMENT_ACCEPT}. Paste the typed notes instead; originals are never saved by MAMAAI.` } }, { status: 503 });
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: process.env.AI_PRIMARY_MODEL || "gemini-1.5-flash" });
    const prompt = `Read these family-profile pages conservatively. Return ONLY JSON: {"household":{"people":number,"mealsToPlan":[string],"cuisines":[string],"budget":string,"cookingTime":string,"dietaryPractices":[string]},"members":[{"name":string,"relation":string,"age":number,"dietType":"vegetarian|eggetarian|non_vegetarian|semi_vegetarian|vegan|other","favouriteFoods":[string],"dislikes":[string],"allergies":[string],"allergyStatus":"provided|no_known|unanswered","healthConditions":[string],"doctorAdvice":[string],"uncertain":[string]}],"mealHistory":[{"day":string,"breakfast":string,"lunch":string,"snacks":string,"dinner":string,"exceptions":string,"uncertain":[string]}],"uncertainties":[string]}. Do not invent. Mark unclear handwriting, dates, member matches, allergies, and clinician advice uncertain. A blank allergy field is unanswered, never no_known. Preserve shared meals and exceptions.`;
    const result = await model.generateContent([...pages.map((page) => ({ inlineData: { mimeType: page.mimeType, data: page.base64 } })), prompt]);
    const raw = result.response.text().replace(/```json|```/g, "").trim(); const start = raw.indexOf("{"); const end = raw.lastIndexOf("}");
    if (start < 0 || end < start) throw new Error("OCR returned no structured profile draft.");
    const draft = familyDocumentImportSchema.parse({ ...JSON.parse(raw.slice(start, end + 1)), source: "upload" });
    return NextResponse.json({ draft, retention: "Original upload is not saved." });
  } catch (error) {
    const auth = authErrorResponse(error); if (auth) return auth;
    return NextResponse.json({ error: { code: "PROFILE_IMPORT_FAILED", message: "Unable to prepare this document for review. No profile changes were saved." } }, { status: 422 });
  }
}
