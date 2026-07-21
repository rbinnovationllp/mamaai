import { NextResponse } from "next/server";
import { store } from "@/lib/repositories/in-memory-store";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET(request: Request) {
  const service = new SubscriptionService();
  const url = new URL(request.url);
  const userId = request.headers.get("x-demo-user-id") ?? url.searchParams.get("userId") ?? "demo-user";
  const judgeMode = url.searchParams.get("mode") === "judge";

  const latestSubscriptionRecord = [...store.subscriptionRecords]
    .filter((record) => record.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  const entitlement = judgeMode
    ? service.getJudgeDemoEntitlement(userId)
    : latestSubscriptionRecord
      ? {
          userId,
          plan: latestSubscriptionRecord.plan,
          memberLimit: latestSubscriptionRecord.memberLimit,
          source: latestSubscriptionRecord.source,
          status: latestSubscriptionRecord.status,
          paymentChannel: latestSubscriptionRecord.paymentChannel,
          paymentStatus: latestSubscriptionRecord.paymentStatus,
          isActive: latestSubscriptionRecord.status === "active" || latestSubscriptionRecord.status === "trialing",
          bypassPaymentForDemo: false,
          razorpaySubscriptionId: latestSubscriptionRecord.razorpaySubscriptionId,
          startsAt: latestSubscriptionRecord.startsAt,
          renewsAt: latestSubscriptionRecord.renewsAt,
          expiresAt: latestSubscriptionRecord.expiresAt,
          cancelledAt: latestSubscriptionRecord.cancelledAt,
          features: service.getPlanFeatures(latestSubscriptionRecord.plan),
          checkedAt: new Date().toISOString()
        }
      : service.resolveLocalEntitlement(userId);

  return NextResponse.json({
    entitlement,
    subscriptionRecord: judgeMode ? undefined : latestSubscriptionRecord,
    paymentHistory: judgeMode
      ? []
      : store.paymentTransactions
          .filter((transaction) => transaction.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 20),
    sourceOfTruth: "server",
    productionStatus:
      "Testing-stage entitlement endpoint. Production will persist and verify subscription records in DynamoDB from Razorpay, web payment, and RevenueCat webhook events.",
    billingAvailability: {
      razorpayIndia: "test_mode_ready_when_env_configured",
      webPayment: "razorpay_for_india_planned_or_test_ready",
      revenueCat: "contract_ready",
      googlePlayBilling: "planned_for_mobile_app",
      fakePaymentsEnabled: false
    }
  });
}
