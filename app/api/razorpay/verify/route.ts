import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay-service";
import { verifyRazorpayPaymentSchema } from "@/lib/shared/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyRazorpayPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Razorpay verification payload is invalid." } },
        { status: 400 }
      );
    }

    const service = new RazorpayService();
    const verified = service.verifyCheckoutSignature(parsed.data);

    if (!verified) {
      return NextResponse.json(
        { error: { code: "SIGNATURE_VERIFICATION_FAILED", message: "Payment signature could not be verified." } },
        { status: 400 }
      );
    }

    const subscriptionRecord = service.upsertSubscriptionFromProvider({
      userId: parsed.data.userId,
      plan: parsed.data.plan,
      razorpaySubscriptionId: parsed.data.razorpaySubscriptionId,
      razorpayPaymentId: parsed.data.razorpayPaymentId,
      eventType: "subscription.activated",
      providerStatus: "active"
    });

    return NextResponse.json({
      verified: true,
      entitlementActivated: true,
      subscriptionRecord
    });
  } catch {
    return NextResponse.json(
      { error: { code: "RAZORPAY_VERIFY_FAILED", message: "Unable to verify Razorpay payment." } },
      { status: 500 }
    );
  }
}
