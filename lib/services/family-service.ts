import { createId, nowIso, store } from "@/lib/repositories/in-memory-store";
import type { CreateFamilyRequest, Family, FamilyMember } from "@/lib/shared/contracts";
import { SubscriptionService } from "./subscription-service";

export class FamilyService {
  private readonly subscriptionService = new SubscriptionService();

  createFamily(request: CreateFamilyRequest): { family: Family; members: FamilyMember[] } {
    this.subscriptionService.assertMemberLimit(request.family.subscriptionPlan, request.members.length);

    const timestamp = nowIso();
    const family: Family = {
      ...request.family,
      familyId: createId("family"),
      userId: request.userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const members: FamilyMember[] = request.members.map((member) => ({
      ...member,
      familyId: family.familyId,
      memberId: createId("member")
    }));

    store.families.push(family);
    store.members.push(...members);

    return { family, members };
  }

  getFamilyWithMembers(familyId: string) {
    const family = store.families.find((item) => item.familyId === familyId);
    if (!family) {
      return null;
    }

    return {
      family,
      members: store.members.filter((member) => member.familyId === familyId)
    };
  }
}
