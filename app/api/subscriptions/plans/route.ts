import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planTier, billingMarket, judgeBypassKey } = body;

    // 1. Check for Judge Test Bypass Key
    if (judgeBypassKey && judgeBypassKey === process.env.JUDGE_TEST_KEY) {
      return NextResponse.json({
        success: true,
        isJudgeBypass: true,
        planTier: planTier || "family_plus",
        message: "Judge Test Mode active. Subscription features unlocked.",
      });
    }

    // 2. Validate input plan tiers
    if (!planTier || !["starter", "premium", "family_plus"].includes(planTier)) {
      return NextResponse.json(
        { error: { code: "INVALID_PLAN", message: "Invalid subscription plan tier requested." } },
        { status: 400 }
      );
    }

    // 3. Determine market (IN = India / INR, INT = International / USD)
    const isInternational = billingMarket === "INT" || billingMarket === "USD";
    const currency = isInternational ? "USD" : "INR";

    // 4. Map Plan IDs & Price Displays
    const planMap: Record<string, { inr: string | undefined; usd: string | undefined; priceDisplay: string }> = {
      starter: {
        inr: process.env.RAZORPAY_PLAN_STARTER_MONTHLY, // ₹399
        usd: process.env.RAZORPAY_PLAN_STARTER_USD,     // $4.99
        priceDisplay: isInternational ? "$4.99/mo" : "₹399/mo",
      },
      premium: {
        inr: process.env.RAZORPAY_PLAN_PREMIUM_MONTHLY, // ₹599
        usd: process.env.RAZORPAY_PLAN_PREMIUM_USD,     // $7.99
        priceDisplay: isInternational ? "$7.99/mo" : "₹599/mo",
      },
      family_plus: {
        inr: process.env.RAZORPAY_PLAN_PLUS_MONTHLY,    // ₹999
        usd: process.env.RAZORPAY_PLAN_PLUS_USD,        // $12.99
        priceDisplay: isInternational ? "$12.99/mo" : "₹999/mo",
      },
    };

    const targetPlan = planMap[planTier];
    const planId = isInternational ? targetPlan?.usd : targetPlan?.inr;

    if (!planId) {
      return NextResponse.json(
        {
          error: {
            code: "PLAN_NOT_CONFIGURED",
            message: `Plan ID for ${planTier} (${currency}) is not configured in Vercel environment variables.`,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      planTier,
      planId,
      currency,
      priceDisplay: targetPlan.priceDisplay,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "PLAN_RESOLUTION_FAILED",
          message: error instanceof Error ? error.message : "Failed to resolve subscription plan parameters.",
        },
      },
      { status: 500 }
    );
  }
}
