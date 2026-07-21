import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay-service";
import { createRazorpaySubscriptionSchema } from "@/lib/shared/schemas";

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

    const result = await new RazorpayService().createSubscription(parsed.data);

    if (!result.configured || !("plan" in result)) {
      return NextResponse.json(
        {
          configured: false,
          status: "testing_stage_not_configured",
          message: result.message,
          requiredEnvironment: result.requiredEnvironment,
          judgeDemoUnaffected: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      configured: true,
      provider: "razorpay",
      billingMarket: "india",
      subscriptionId: result.subscriptionId,
      shortUrl: result.shortUrl,
      checkout: {
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "MAMAAI",
        description: `${result.plan?.displayName ?? "MAMAAI"} monthly subscription`,
        notes: {
          project: "mamaai",
          userId: parsed.data.userId,
          plan: parsed.data.plan
        }
      },
      subscriptionRecord: result.subscriptionRecord
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "RAZORPAY_SUBSCRIPTION_CREATE_FAILED",
          message: error instanceof Error ? error.message : "Unable to create Razorpay subscription."
        }
      },
      { status: 500 }
    );
  }
}
