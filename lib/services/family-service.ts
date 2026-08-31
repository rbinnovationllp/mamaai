import { createId, nowIso, store } from "@/lib/repositories/in-memory-store";
import { FamilyMealRepository } from "@/lib/repositories/family-meal-repository";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import type { Family, FamilyMember } from "@/lib/shared/contracts";
import type { CreateFamilyRequest } from "@/lib/shared/schemas";
import { SubscriptionService } from "./subscription-service";

export class FamilyService {
  private readonly subscriptionService = new SubscriptionService();
  private readonly repository = new FamilyMealRepository();
  private readonly customerProfileRepository = new CustomerProfileRepository();

  async createFamily(request: CreateFamilyRequest): Promise<{ family: Family; members: FamilyMember[] }> {
    this.subscriptionService.assertMemberLimit(
      request.family.subscriptionPlan,
      request.members.length
    );

    const timestamp = nowIso();
    const customerFamilyProfile = await this.customerProfileRepository.getFamilyProfile(request.userId).catch(() => undefined);
    const durableFamilyId = customerFamilyProfile?.familyId ?? createId("family");
    const family = {
      ...request.family,
      familyId: durableFamilyId,
      userId: request.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    } as Family;

    const memberIdFor = (member: CreateFamilyRequest["members"][number]) => {
      if (member.memberId) return member.memberId;
      const matchingProfileMember = customerFamilyProfile?.members.find((profileMember) => (
        profileMember.name.trim().toLowerCase() === member.name.trim().toLowerCase() &&
        profileMember.relation.trim().toLowerCase() === member.relationship.trim().toLowerCase() &&
        profileMember.age === member.age
      ));
      return matchingProfileMember?.id ?? createId("member");
    };

    const seenMemberIds = new Set<string>();
    const members = request.members
      .map((member) => ({
        ...member,
        familyId: family.familyId,
        memberId: memberIdFor(member),
      }))
      .filter((member) => {
        if (seenMemberIds.has(member.memberId)) return false;
        seenMemberIds.add(member.memberId);
        return true;
      }) as FamilyMember[];

    store.families.push(family);
    store.members.push(...members);

    try {
      await this.repository.saveFamilyContext({ family, members });
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Family DynamoDB save failed; using in-memory fallback:", error);
    }

    return { family, members };
  }

  async getFamilyWithMembers(familyId: string) {
    try {
      const persisted = await this.repository.getFamilyContext(familyId);
      if (persisted) return persisted;
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.warn("Family DynamoDB read failed; using in-memory fallback:", error);
    }

    const family = store.families.find((item) => item.familyId === familyId);
    if (!family) {
      return null;
    }

    return {
      family,
      members: store.members.filter((member) => member.familyId === familyId),
    };
  }
}
