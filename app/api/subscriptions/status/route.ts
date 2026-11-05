import { hasCurrentEntitlement, needsPaymentReconciliation } from "@/lib/services/paid-entitlement";
import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  try {
    const service = new SubscriptionService();
    const repository = new SubscriptionRepository();
    const url = new URL(request.url);
    const user = await requireUser(request);
    const userId = user.userId;
    const judgeMode = false;

    const latestSubscriptionRecord = judgeMode
      ? undefined
      : await repository.getLatestSubscriptionForUser(userId);

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
          isActive: hasCurrentEntitlement(latestSubscriptionRecord),
          bypassPaymentForDemo: false,
          razorpaySubscriptionId: latestSubscriptionRecord.razorpaySubscriptionId,
          startsAt: latestSubscriptionRecord.startsAt,
          renewsAt: latestSubscriptionRecord.renewsAt,
          expiresAt: latestSubscriptionRecord.expiresAt,
          cancelledAt: latestSubscriptionRecord.cancelledAt,
          features: service.getPlanFeatures(latestSubscriptionRecord.plan),
          checkedAt: new Date().toISOString()
        }
        : { userId, status: "expired", isActive: false, bypassPaymentForDemo: false };

    return NextResponse.json({
      entitlement,
      subscriptionRecord: judgeMode ? undefined : latestSubscriptionRecord,
      paymentHistory: url.searchParams.get("includeHistory") === "true" ? await repository.listPaymentHistoryForUser(userId, 20) : [],
      needsReconciliation: needsPaymentReconciliation(latestSubscriptionRecord),
      sourceOfTruth: judgeMode ? "demo_judge_access" : "dynamodb",
      productionStatus:
        "Razorpay subscription, payment, and entitlement records are read from DynamoDB. Full app data migration and production authentication are still required before broad launch.",
      billingAvailability: {
        razorpayIndia: "production_endpoint_ready_when_env_configured",
        webPayment: "razorpay_subscription_checkout",
        revenueCat: "contract_ready",
        googlePlayBilling: "planned_for_mobile_app",
        fakePaymentsEnabled: false
      }
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: { code: "SUBSCRIPTION_STATUS_FAILED", message: "Unable to read subscription status." } },
      { status: 503 }
    );
  }
}


