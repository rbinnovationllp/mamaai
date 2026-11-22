import { hasCurrentEntitlement, needsPaymentReconciliation } from "@/lib/services/paid-entitlement";
import { renewRecognizedDeviceSession } from "@/lib/server/recognized-device-session";
import { NextResponse } from "next/server";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { FreeDailyExperienceRepository } from "@/lib/repositories/free-daily-experience-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.MAMA_AI_LOCAL_QA === "true" && new URL(request.url).searchParams.get("qaSessionFailure") === "1") {
    return NextResponse.json({ error: { code: "SESSION_UNAVAILABLE", message: "Local QA simulated session failure." } }, { status: 503 });
  }
  try {
    const user = await requireUser(request);
    const finish = (response: NextResponse) => renewRecognizedDeviceSession(request, response, user);
    const profiles = new CustomerProfileRepository();
    const [customer, familyProfile, subscription, freeDailyExperience] = await Promise.all([
      profiles.getCustomer(user.userId),
      profiles.getFamilyProfile(user.userId),
      new SubscriptionRepository().getLatestSubscriptionForUser(user.userId),
      new FreeDailyExperienceRepository().getForUser(user.userId),
    ]);

    const isEntitled = hasCurrentEntitlement(subscription);
    if (!customer || !familyProfile || familyProfile.members.length === 0) {
      // A new household receives one real, saved daily planning experience
      // before profile/checkout. Once used, it proceeds to the full profile.
      const nextRoute = freeDailyExperience?.status === "generated" ? "/profile/family?from=today" : "/today";
      return await finish(NextResponse.json({ authenticated: true, userId: user.userId, isProfileComplete: false, isEntitled, needsReconciliation: needsPaymentReconciliation(subscription), nextRoute }));
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


