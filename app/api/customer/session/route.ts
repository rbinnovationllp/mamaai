import { hasCurrentEntitlement, needsPaymentReconciliation } from "@/lib/services/paid-entitlement";
import { renewRecognizedDeviceSession } from "@/lib/server/recognized-device-session";
import { NextResponse } from "next/server";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const finish = (response: NextResponse) => renewRecognizedDeviceSession(request, response, user);
    const profiles = new CustomerProfileRepository();
    const [customer, familyProfile, subscription] = await Promise.all([
      profiles.getCustomer(user.userId),
      profiles.getFamilyProfile(user.userId),
      new SubscriptionRepository().getLatestSubscriptionForUser(user.userId),
    ]);

    const isEntitled = hasCurrentEntitlement(subscription);
    if (!customer || !familyProfile || familyProfile.members.length === 0) {
      return await finish(NextResponse.json({ authenticated: true, userId: user.userId, isProfileComplete: false, isEntitled, needsReconciliation: needsPaymentReconciliation(subscription), nextRoute: "/profile/family" }));
    }
    if (!isEntitled) {
      return await finish(NextResponse.json({ authenticated: true, userId: user.userId, familyId: familyProfile.familyId, isProfileComplete: true, isEntitled: false, needsReconciliation: needsPaymentReconciliation(subscription), nextRoute: "/planner" }));
    }
    return await finish(NextResponse.json({ authenticated: true, userId: user.userId, familyId: familyProfile.familyId, isProfileComplete: true, isEntitled: true, hasActiveWeeklyPlan: false, nextRoute: "/planner", familyProfile, customer }));
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[Session Check Error]:", error);
    return NextResponse.json({ error: { code: "SESSION_UNAVAILABLE", message: "Your account is temporarily unavailable. Please retry." } }, { status: 503 });
  }
}


