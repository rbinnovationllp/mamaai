import { NextResponse } from "next/server";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const profiles = new CustomerProfileRepository();
    const [customer, familyProfile, subscription] = await Promise.all([
      profiles.getCustomer(user.userId),
      profiles.getFamilyProfile(user.userId),
      new SubscriptionRepository().getLatestSubscriptionForUser(user.userId),
    ]);

    if (!customer || !familyProfile || familyProfile.members.length === 0) {
      return NextResponse.json({ authenticated: true, userId: user.userId, isProfileComplete: false, nextRoute: "/profile/family" });
    }
    const isEntitled = subscription?.status === "active" || subscription?.status === "trialing";
    if (!isEntitled) {
      return NextResponse.json({ authenticated: true, userId: user.userId, familyId: familyProfile.familyId, isProfileComplete: true, isEntitled: false, nextRoute: "/subscription" });
    }
    return NextResponse.json({ authenticated: true, userId: user.userId, familyId: familyProfile.familyId, isProfileComplete: true, isEntitled: true, hasActiveWeeklyPlan: false, nextRoute: "/planner?autoGenerate=true", familyProfile, customer });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[Session Check Error]:", error);
    return NextResponse.json({ authenticated: false, nextRoute: "/profile/family" });
  }
}
