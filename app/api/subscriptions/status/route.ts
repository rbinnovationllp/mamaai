import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET(request: Request) {
  const service = new SubscriptionService();
  const url = new URL(request.url);
  const userId = request.headers.get("x-demo-user-id") ?? url.searchParams.get("userId") ?? "demo-user";
  const judgeMode = url.searchParams.get("mode") === "judge";

  const entitlement = judgeMode ? service.getJudgeDemoEntitlement(userId) : service.resolveLocalEntitlement(userId);

  return NextResponse.json({
    entitlement,
    sourceOfTruth: "server",
    productionStatus:
      "Testing-stage entitlement endpoint. Production will persist and verify subscription records in DynamoDB from web payment and RevenueCat webhook events.",
    billingAvailability: {
      webPayment: "planned",
      revenueCat: "contract_ready",
      googlePlayBilling: "planned_for_mobile_app",
      fakePaymentsEnabled: false
    }
  });
}
