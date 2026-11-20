import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { requireSameOrigin } from "@/lib/server/request-security";
import { FAMILY_PROFILE_DOCUMENT_ACCEPT, familyDocumentImportSchema, parseFamilyProfileDocumentText } from "@/lib/shared/family-profile-document";
import { MealHistoryUploadError, parseMealHistoryUploadDataUrl } from "@/lib/shared/meal-history-upload";
import { DocxExtractionError, extractDocxText } from "@/lib/server/docx-text-extraction";

const requestSchema = z.object({ text: z.string().max(30000).optional(), files: z.array(z.string().min(40)).max(5).optional(), aiProcessingConsent: z.boolean().optional() }).refine((v) => Boolean(v.text?.trim() || v.files?.length), "Paste text or select at least one file.");
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const OCR_TIMEOUT_MS = 15_000;

class ProfileImportError extends Error {
  constructor(readonly code: "timeout" | "invalid_output", message: string) { super(message); }
}

async function boundedOcr<T>(work: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ProfileImportError("timeout", "Reading this document took too long. Please retry with a clearer, smaller file or enter the details manually.")), OCR_TIMEOUT_MS); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseDocxDataUrl(value: string) {
  const match = value.match(new RegExp(`^data:${DOCX_MIME};base64,([A-Za-z0-9+/]+={0,2})$`));
  if (!match) return undefined;
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > MAX_DOCUMENT_BYTES) throw new DocxExtractionError("Choose a DOCX file smaller than 5 MB.");
  return buffer;
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request); await requireUser(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: { code: "PROFILE_IMPORT_INVALID", message: "Paste text or select up to five clear image, PDF, or DOCX pages." } }, { status: 400 });
    if (parsed.data.text?.trim()) return NextResponse.json({ draft: parseFamilyProfileDocumentText(parsed.data.text), retention: "Original text is not saved." });
    const files = parsed.data.files ?? [];
    const docxFiles = files.map(parseDocxDataUrl);
    if (docxFiles.some(Boolean)) {
      if (docxFiles.some((file) => !file) || docxFiles.length !== files.length) return NextResponse.json({ error: { code: "PROFILE_IMPORT_MIXED_FORMATS", message: "Upload DOCX files separately from image or PDF pages so each draft can be reviewed clearly." } }, { status: 400 });
      const extracted = docxFiles.map((file) => extractDocxText(file!));
      const draft = parseFamilyProfileDocumentText(extracted.map((item) => item.text).join("\n"));
      const embeddedImages = extracted.reduce((total, item) => total + item.embeddedImageCount, 0);
      if (embeddedImages) draft.uncertainties.push(`${embeddedImages} embedded image${embeddedImages === 1 ? " was" : "s were"} not read. Upload those pages as clear images or enter their details manually.`);
      console.info("FAMILY_PROFILE_DOCUMENT_IMPORT", { category: "docx_text", documentCount: extracted.length, embeddedImages });
      return NextResponse.json({ draft, retention: "Original DOCX files are read only for this request and are not saved." });
    }
    if (!parsed.data.aiProcessingConsent) return NextResponse.json({ error: { code: "AI_PROCESSING_CONSENT_REQUIRED", message: "Confirm that the selected image or PDF pages may be sent to the configured AI provider for reading, or upload a DOCX/paste typed notes instead." } }, { status: 400 });
    // Files are validated and held only for this request; only a reviewed structured draft can later be saved.
    const pages = files.map((file) => parseMealHistoryUploadDataUrl(file));
    if (process.env.MAMAAI_FAMILY_DOCUMENT_OCR_ENABLED !== "true" || !process.env.GEMINI_API_KEY) return NextResponse.json({ error: { code: "PROFILE_IMPORT_OCR_NOT_CONFIGURED", message: `Document image/PDF reading needs the optional OCR provider. Accepted formats: ${FAMILY_PROFILE_DOCUMENT_ACCEPT}. Paste the typed notes instead; originals are never saved by MAMAAI.` } }, { status: 503 });
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: process.env.AI_PRIMARY_MODEL || "gemini-1.5-flash" });
    const prompt = `Read these family-profile pages conservatively. Return ONLY JSON: {"household":{"people":number,"mealsToPlan":[string],"cuisines":[string],"mealPreferences":{"breakfast":string,"lunch":string,"snacks":string,"dinner":string},"budget":string,"cookingTime":string,"dietaryPractices":[string]},"members":[{"name":string,"relation":string,"age":number,"dietType":"vegetarian|eggetarian|non_vegetarian|semi_vegetarian|vegan|pescatarian|jain|other","favouriteFoods":[string],"dislikes":[string],"allergies":[string],"allergyStatus":"provided|no_known|unanswered","healthConditions":[string],"doctorAdvice":[string],"uncertain":[string]}],"mealHistory":[{"day":string,"breakfast":string,"lunch":string,"snacks":string,"dinner":string,"exceptions":string,"uncertain":[string]}],"uncertainties":[string]}. Do not invent. Mark unclear handwriting, dates, member matches, allergies, and clinician advice uncertain. A blank allergy field is unanswered, never no_known. Preserve shared meals and exceptions.`;
    const result = await boundedOcr(model.generateContent([...pages.map((page) => ({ inlineData: { mimeType: page.mimeType, data: page.base64 } })), prompt]));
    const raw = result.response.text().replace(/```json|```/g, "").trim(); const start = raw.indexOf("{"); const end = raw.lastIndexOf("}");
    if (start < 0 || end < start) throw new ProfileImportError("invalid_output", "The document could not be read into a reviewable draft. Please retry with a clearer file or enter the details manually.");
    const draft = familyDocumentImportSchema.parse({ ...JSON.parse(raw.slice(start, end + 1)), source: "upload" });
    return NextResponse.json({ draft, retention: "Original upload is not saved." });
  } catch (error) {
    const auth = authErrorResponse(error); if (auth) return auth;
    if (error instanceof DocxExtractionError) {
      console.info("FAMILY_PROFILE_DOCUMENT_IMPORT", { category: "docx_invalid" });
      return NextResponse.json({ error: { code: "PROFILE_IMPORT_DOCX_INVALID", message: error.message } }, { status: 400 });
    }
    if (error instanceof MealHistoryUploadError) {
      console.info("FAMILY_PROFILE_DOCUMENT_IMPORT", { category: "local_validation", code: error.code });
      return NextResponse.json({ error: { code: error.code, message: error.publicMessage } }, { status: error.status });
    }
    if (error instanceof ProfileImportError) {
      console.info("FAMILY_PROFILE_DOCUMENT_IMPORT", { category: error.code });
      return NextResponse.json({ error: { code: `PROFILE_IMPORT_${error.code.toUpperCase()}`, message: error.message } }, { status: error.code === "timeout" ? 504 : 422 });
    }
    console.info("FAMILY_PROFILE_DOCUMENT_IMPORT", { category: "provider_or_parse_failure" });
    return NextResponse.json({ error: { code: "PROFILE_IMPORT_FAILED", message: "Unable to prepare this document for review. No profile changes were saved." } }, { status: 422 });
  }
}
