import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET() {
  return NextResponse.json({
    plans: new SubscriptionService().getPlans(),
    monetizationFlow:
      "Visitor -> Demo/Free Experience -> Registration -> Subscription Selection -> Payment -> Backend Verification -> Entitlement Activation -> Premium Features -> Renewal/Cancellation Management",
    webPaymentRecommendation:
      "For the web/PWA launch, use a production payment provider with server-side webhook verification and store the resulting entitlement in DynamoDB. Keep the same MAMAAI userId for future RevenueCat/Google Play subscriptions.",
    productionPaymentStatus: "planned_not_enabled_in_hackathon_build",
    judgeDemoAccess: {
      bypassesPayment: true,
      usesFictionalDataOnly: true,
      purpose: "Codex Hackathon judge review without registration, payment, or subscription friction."
    }
  });
}
