import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay-service";
import type { SubscriptionPlan } from "@/lib/shared/contracts";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        plan_id?: string;
        status?: string;
        current_start?: number;
        current_end?: number;
        notes?: Record<string, string | undefined>;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        status?: string;
        amount?: number;
        currency?: string;
        invoice_id?: string;
        notes?: Record<string, string | undefined>;
      };
    };
  };
};

function isoFromSeconds(value?: number) {
  return value ? new Date(value * 1000).toISOString() : undefined;
}

function subscriptionPlanFromNote(value?: string): SubscriptionPlan | undefined {
  return value === "family_starter" || value === "family_premium" || value === "family_plus" ? value : undefined;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const service = new RazorpayService();

  if (!service.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: { code: "SIGNATURE_VERIFICATION_FAILED", message: "Razorpay webhook signature could not be verified." } },
      { status: 401 }
    );
  }

  try {
    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const eventType = body.event ?? "unknown";
    const subscription = body.payload?.subscription?.entity;
    const payment = body.payload?.payment?.entity;
    const notes = subscription?.notes ?? payment?.notes ?? {};
    const subscriptionId = subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json({ received: true, persisted: false, reason: "No subscription entity present." });
    }

    const record = service.upsertSubscriptionFromProvider({
      userId: notes.userId ?? "unknown-user",
      plan: subscriptionPlanFromNote(notes.plan),
      razorpaySubscriptionId: subscriptionId,
      razorpayPaymentId: payment?.id,
      razorpayPlanId: subscription?.plan_id,
      providerStatus: subscription?.status ?? payment?.status,
      eventType,
      startsAt: isoFromSeconds(subscription?.current_start),
      renewsAt: isoFromSeconds(subscription?.current_end),
      cancelledAt: eventType === "subscription.cancelled" ? new Date().toISOString() : undefined
    });

    return NextResponse.json({ received: true, persisted: true, subscriptionRecord: record });
  } catch {
    return NextResponse.json(
      { error: { code: "RAZORPAY_WEBHOOK_PARSE_FAILED", message: "Razorpay webhook payload could not be processed." } },
      { status: 400 }
    );
  }
}
