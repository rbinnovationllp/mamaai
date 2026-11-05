import { hasCurrentEntitlement } from "@/lib/services/paid-entitlement";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import type { SubscriptionRecord } from "@/lib/shared/contracts";

export class FamilyPlusEntitlementError extends Error { constructor(message = "Family+ is required to manage pet profiles.") { super(message); this.name = "FamilyPlusEntitlementError"; } }
export function hasActiveFamilyPlusEntitlement(record: SubscriptionRecord | undefined): boolean { return Boolean(record && record.plan === "family_plus" && hasCurrentEntitlement(record)); }
export async function requireFamilyPlusEntitlement(userId: string, repository: Pick<SubscriptionRepository, "getLatestSubscriptionForUser"> = new SubscriptionRepository()): Promise<SubscriptionRecord> {
  const record = await repository.getLatestSubscriptionForUser(userId);
  if (!hasActiveFamilyPlusEntitlement(record)) throw new FamilyPlusEntitlementError();
  return record!;
}
