import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay-service";
import { createRazorpaySubscriptionSchema, normalizePlanTier } from "@/lib/shared/schemas";
import { authErrorResponse, requireUser } from "@/lib/server/auth";
import { CustomerProfileRepository } from "@/lib/repositories/customer-profile-repository";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createRazorpaySubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Razorpay subscription request is invalid." } },
        { status: 400 }
      );
    }

    // Convert legacy aliases to canonical plan types
    const normalizedPlan = normalizePlanTier(parsed.data.plan);
    const user = await requireUser(request);
    const profiles = new CustomerProfileRepository();
    const [familyProfile, customer] = await Promise.all([
      profiles.getFamilyProfile(user.userId),
      profiles.getCustomer(user.userId),
    ]);
    if (!familyProfile?.members.length) {
      return NextResponse.json({ error: { code: "PROFILE_REQUIRED", message: "Complete your family profile before checkout." } }, { status: 409 });
    }
    if (familyProfile.members.some((member) => !Number.isInteger(member.age) || (member.age ?? -1) < 0)) {
      return NextResponse.json({ error: { code: "MEMBER_AGE_REQUIRED", message: "Add an age for every human family member before checkout." } }, { status: 409 });
    }
    if (customer?.mealHistoryOnboardingStatus !== "complete" && customer?.mealHistoryOnboardingStatus !== "do_not_remember") {
      return NextResponse.json({ error: { code: "MEAL_HISTORY_REQUIRED", message: "Complete the last seven days of meal history, or explicitly choose ‘Do not remember’, before checkout." } }, { status: 409 });
    }
    const memberCount = familyProfile.members.length;
    const requiredPlan = memberCount >= 7 ? "family_plus" : memberCount >= 5 ? "premium" : "starter";
    const rank = { starter: 1, premium: 2, family_plus: 3 } as const;
    if (rank[normalizedPlan] < rank[requiredPlan]) {
      return NextResponse.json({ error: { code: "PLAN_TOO_SMALL", message: `This household needs the ${requiredPlan === "family_plus" ? "Family Plus" : requiredPlan === "premium" ? "Family Premium" : "Family Starter"} plan.` } }, { status: 409 });
    }

    const result = await new RazorpayService().createSubscription({
      userId: user.userId,
      plan: normalizedPlan,
      billingMarket: parsed.data.billingMarket,
      customerNotify: parsed.data.customerNotify,
    });

    if (!result.configured || !("plan" in result)) {
      return NextResponse.json(
        {
          configured: false,
          status: "testing_stage_not_configured",
          message: result.message,
          requiredEnvironment: result.requiredEnvironment,
          judgeDemoUnaffected: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      configured: true,
      provider: "razorpay",
      billingMarket: result.billingMarket === "INT" ? "international" : "india",
      subscriptionId: result.subscriptionId,
      shortUrl: result.shortUrl,
      checkout: {
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "MAMAAI",
        description: `${result.plan?.displayName ?? "MAMAAI"} monthly subscription`,
        notes: {
          project: "mamaai",
          userId: user.userId,
          plan: normalizedPlan,
        },
      },
      subscriptionRecord: result.subscriptionRecord,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      {
        error: {
          code: "RAZORPAY_SUBSCRIPTION_CREATE_FAILED",
          message: error instanceof Error ? error.message : "Unable to create Razorpay subscription.",
        },
      },
      { status: 500 }
    );
  }
}


