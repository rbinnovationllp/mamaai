import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET() {
  return NextResponse.json({
    plans: new SubscriptionService().getPlans(),
    monetizationFlow:
      "Visitor -> Demo/Free Experience -> Registration -> Subscription Selection -> Payment -> Backend Verification -> Entitlement Activation -> Premium Features -> Renewal/Cancellation Management",
    webPaymentRecommendation:
      "For the Indian web/PWA launch, use Razorpay Subscriptions with server-side Checkout signature verification and webhook verification, then store the resulting entitlement in DynamoDB. Keep the same MAMAAI userId for future RevenueCat/Google Play subscriptions.",
    productionPaymentStatus: "razorpay_test_mode_ready_when_env_configured",
    razorpayIndia: {
      provider: "Razorpay Subscriptions",
      flow: "Select Plan -> Secure Razorpay Checkout -> Payment Verification -> Subscription Record Updated -> Entitlement Activated",
      sameAccountIsolation:
        "The same Razorpay account may serve other projects, but MAMAAI must use separate plan IDs, webhook URL, webhook secret, metadata, env variables, and entitlement records."
    },
    judgeDemoAccess: {
      bypassesPayment: true,
      usesFictionalDataOnly: true,
      purpose: "Codex Hackathon judge review without registration, payment, or subscription friction."
    }
  });
}
