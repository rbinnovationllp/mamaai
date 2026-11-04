import type { PetProfileInput } from "./contracts";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";

export class PetCaregiverValidationError extends Error { constructor(message: string) { super(message); this.name = "PetCaregiverValidationError"; } }
/** Caregivers are opaque IDs of human household members; names and contact data are never duplicated into the pet record. */
export async function validatePetCaregivers(userId: string, input: Pick<PetProfileInput, "primaryCaregiverMemberId" | "additionalCaregiverMemberId">, repository = new CustomerProfileRepository()) {
  const ids = [input.primaryCaregiverMemberId, input.additionalCaregiverMemberId].filter((value): value is string => Boolean(value));
  if (!ids.length) return;
  if (new Set(ids).size !== ids.length) throw new PetCaregiverValidationError("Choose different primary and additional caregivers.");
  const family = await repository.getFamilyProfile(userId);
  if (!family || !ids.every((id) => family.members.some((member) => member.id === id))) throw new PetCaregiverValidationError("Each caregiver must be a member of your household.");
}
