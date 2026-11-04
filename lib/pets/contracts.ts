import { z } from "zod";

export const supportedPetSpecies = ["dog", "cat"] as const;
export const petActivityLevels = ["low", "moderate", "high"] as const;
export const petSexes = ["female", "male", "unknown"] as const;
export const petNeuterStatuses = ["neutered", "not_neutered", "unknown"] as const;

const shortText = (maximum: number) => z.string().trim().min(1).max(maximum);
const optionalTextList = (maximumItems: number, maximumItemLength: number) => z.array(shortText(maximumItemLength)).max(maximumItems).default([]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date (YYYY-MM-DD).")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Use a valid date.");

const feedingScheduleSchema = z.array(z.object({ label: shortText(40), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM time.") })).max(6).default([]);

/** Profile context only: this is not a veterinary nutrition or portion contract. */
export const petProfileInputSchema = z.object({
  name: shortText(80), species: z.enum(supportedPetSpecies), breed: z.string().trim().max(100).optional(), isMixedBreed: z.boolean().default(false),
  dateOfBirth: isoDate.optional(), approximateAgeMonths: z.number().int().min(0).max(360).optional(), weightKg: z.number().positive().max(150).optional(), weightRecordedAt: isoDate.optional(),
  sex: z.enum(petSexes).default("unknown"), neuterStatus: z.enum(petNeuterStatuses).default("unknown"), activityLevel: z.enum(petActivityLevels),
  indoorOutdoor: z.enum(["indoor", "outdoor", "mixed"]), currentDiet: z.enum(["commercial", "home_prepared", "mixed", "veterinary_diet", "unknown"]),
  allergies: optionalTextList(30, 100), healthConditions: optionalTextList(20, 100), veterinaryDietaryInstructions: z.string().trim().max(1000).optional(),
  feedingSchedule: feedingScheduleSchema, ownerFeedingPreferences: optionalTextList(20, 160), foodPreferences: optionalTextList(20, 160), currentFood: z.string().trim().max(300).optional(),
  nickname: z.string().trim().max(80).optional(), joinedFamilyAt: isoDate.optional(), primaryCaregiverMemberId: z.string().trim().max(120).optional(), additionalCaregiverMemberId: z.string().trim().max(120).optional(), photoReference: z.string().trim().max(500).optional(), preferredFoodProducts: optionalTextList(20, 160), foodDislikes: optionalTextList(20, 160),
}).superRefine((value, context) => {
  if (value.dateOfBirth && new Date(`${value.dateOfBirth}T00:00:00Z`).getTime() > Date.now()) context.addIssue({ code: z.ZodIssueCode.custom, message: "Date of birth cannot be in the future.", path: ["dateOfBirth"] });
  if (value.weightRecordedAt && new Date(`${value.weightRecordedAt}T00:00:00Z`).getTime() > Date.now()) context.addIssue({ code: z.ZodIssueCode.custom, message: "Weight date cannot be in the future.", path: ["weightRecordedAt"] });
});

export type PetProfileInput = z.infer<typeof petProfileInputSchema>;
export type PetProfileRecord = PetProfileInput & { petId: string; userId: string; createdAt: string; updatedAt: string; };
export const petProfileIdSchema = z.string().trim().min(1).max(120);
export const DEFAULT_FAMILY_PLUS_PET_LIMIT = 5;
export function getFamilyPlusPetLimit(environment: Record<string, string | undefined> = process.env): number {
  const configured = environment.MAMA_AI_FAMILY_PLUS_PET_LIMIT?.trim();
  if (!configured) return DEFAULT_FAMILY_PLUS_PET_LIMIT;
  const parsed = Number(configured);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) throw new Error("MAMA_AI_FAMILY_PLUS_PET_LIMIT must be an integer from 1 to 10.");
  return parsed;
}
