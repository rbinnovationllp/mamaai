import type { PetProfileRecord } from "@/lib/pets/contracts";
import { assessPantry, type PetPantryRecord, type PetScheduleRecord } from "./pantry";

export const PET_SAFETY_RULE_VERSION = "2026-10-25.1";

export type VerifiedPetSchedule = PetScheduleRecord & {
  safetyRuleVersion: string;
  petDependencyVersion: string;
  pantryDependencyVersion: string;
  reviewReason?: string;
};

/** Re-checks every dependency at read/activation time; persisted status alone is never trusted. */
export function revalidatePetSchedule(pet: PetProfileRecord | undefined, item: PetPantryRecord | undefined, schedule: PetScheduleRecord): VerifiedPetSchedule {
  const stored = schedule as VerifiedPetSchedule;
  const base = { ...schedule, safetyRuleVersion: PET_SAFETY_RULE_VERSION, petDependencyVersion: pet?.updatedAt ?? "missing", pantryDependencyVersion: item?.updatedAt ?? "missing" };
  if (!pet) return { ...base, status: "requires_review", reviewReason: "The pet profile is no longer available." };
  if (!item) return { ...base, status: "requires_review", reviewReason: "The referenced pantry item is no longer available." };
  const safety = assessPantry(pet, item);
  const approved = safety.classification === "verified_complete_food" || safety.classification === "supplementary_or_treat";
  if (!approved || safety.classification === "unsafe") return { ...base, safety, status: "requires_review", reviewReason: safety.reasons.join(" ") || "Safety verification is required." };
  if (stored.safetyRuleVersion !== PET_SAFETY_RULE_VERSION || stored.petDependencyVersion !== pet.updatedAt || stored.pantryDependencyVersion !== item.updatedAt) return { ...base, safety, status: "requires_review", reviewReason: "A safety-relevant dependency changed; review the schedule before activation." };
  return { ...base, safety };
}
