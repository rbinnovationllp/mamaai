export const MAX_MEAL_HISTORY_UPLOAD_BYTES = 5 * 1024 * 1024;

export const SUPPORTED_MEAL_HISTORY_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const MEAL_HISTORY_FILE_ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf";

type SupportedMealHistoryMimeType = (typeof SUPPORTED_MEAL_HISTORY_MIME_TYPES)[number];

export class MealHistoryUploadError extends Error {
  constructor(
    readonly code: "INVALID_MEAL_HISTORY_FILE" | "MEAL_HISTORY_FILE_TOO_LARGE",
    readonly publicMessage: string,
    readonly status: 400 | 413
  ) {
    super(publicMessage);
  }
}

function byteLengthFromBase64(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function supportedMealHistoryMimeType(value: string): value is SupportedMealHistoryMimeType {
  return (SUPPORTED_MEAL_HISTORY_MIME_TYPES as readonly string[]).includes(value);
}

export function validateMealHistoryFile(file: Pick<File, "type" | "size">) {
  if (!supportedMealHistoryMimeType(file.type)) {
    throw new MealHistoryUploadError(
      "INVALID_MEAL_HISTORY_FILE",
      "Choose a PNG, JPG, JPEG, WEBP image, or PDF meal-history file.",
      400
    );
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_MEAL_HISTORY_UPLOAD_BYTES) {
    throw new MealHistoryUploadError(
      "MEAL_HISTORY_FILE_TOO_LARGE",
      "Choose a meal-history file smaller than 5 MB.",
      413
    );
  }
}

export function parseMealHistoryUploadDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || !supportedMealHistoryMimeType(match[1])) {
    throw new MealHistoryUploadError(
      "INVALID_MEAL_HISTORY_FILE",
      "Choose a PNG, JPG, JPEG, WEBP image, or PDF meal-history file.",
      400
    );
  }
  const base64 = match[2];
  if (byteLengthFromBase64(base64) > MAX_MEAL_HISTORY_UPLOAD_BYTES) {
    throw new MealHistoryUploadError(
      "MEAL_HISTORY_FILE_TOO_LARGE",
      "Choose a meal-history file smaller than 5 MB.",
      413
    );
  }
  return { mimeType: match[1], base64 };
}

export const MEAL_HISTORY_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type MealHistoryDay = (typeof MEAL_HISTORY_DAYS)[number];

export function canonicalMealHistoryDay(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if ((MEAL_HISTORY_DAYS as readonly string[]).includes(normalized)) return normalized as MealHistoryDay;
  const generic = normalized.match(/^day_?([1-7])$/);
  return generic ? `day_${generic[1]}` : undefined;
}

export function prefillMealHistoryReview(entries: unknown) {
  const source = Array.isArray(entries) ? entries : [];
  return MEAL_HISTORY_DAYS.map((day, index) => {
    const genericDay = `day_${index + 1}`;
    const match = source.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const entryDay = typeof (entry as { day?: unknown }).day === "string" ? (entry as { day: string }).day : "";
      return canonicalMealHistoryDay(entryDay) === day || canonicalMealHistoryDay(entryDay) === genericDay;
    }) as Record<string, unknown> | undefined;
    return {
      day,
      breakfast: typeof match?.breakfast === "string" ? match.breakfast : "",
      lunch: typeof match?.lunch === "string" ? match.lunch : "",
      snacks: typeof match?.snacks === "string" ? match.snacks : "",
      dinner: typeof match?.dinner === "string" ? match.dinner : "",
    };
  });
}
