import crypto from "crypto";
import type { PaymentStatus, SubscriptionPlan, SubscriptionRecord, SubscriptionStatus } from "@/lib/shared/contracts";
import { createId, nowIso, store } from "@/lib/repositories/in-memory-store";
import { SubscriptionService, subscriptionLimits } from "./subscription-service";

type RazorpaySubscriptionEvent =
  | "subscription.activated"
  | "subscription.charged"
  | "subscription.completed"
  | "subscription.cancelled"
  | "subscription.paused"
  | "subscription.resumed"
  | "subscription.pending"
  | "payment.failed"
  | string;

interface CreateRazorpaySubscriptionInput {
  userId: string;
  plan: SubscriptionPlan;
  customerNotify?: boolean;
}

interface RazorpaySubscriptionResponse {
  id: string;
  status?: string;
  short_url?: string;
  current_start?: number;
  current_end?: number;
  charge_at?: number;
  plan_id?: string;
}

function toIsoFromSeconds(value?: number) {
  return value ? new Date(value * 1000).toISOString() : undefined;
}

function configuredRazorpayKey() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  };
}

function mapSubscriptionStatus(eventType: RazorpaySubscriptionEvent, providerStatus?: string): SubscriptionStatus {
  if (eventType === "subscription.cancelled" || providerStatus === "cancelled") return "cancelled";
  if (eventType === "payment.failed") return "past_due";
  if (eventType === "subscription.completed" || providerStatus === "completed") return "expired";
  if (["subscription.activated", "subscription.charged", "subscription.resumed"].includes(eventType) || providerStatus === "active") {
    return "active";
  }
  if (eventType === "subscription.pending" || providerStatus === "created") return "trialing";
  return "trialing";
}

function mapPaymentStatus(eventType: RazorpaySubscriptionEvent): PaymentStatus {
  if (eventType === "payment.failed") return "failed";
  if (["subscription.activated", "subscription.charged"].includes(eventType)) return "paid";
  if (eventType === "subscription.cancelled") return "unknown";
  return "pending";
}

function findPlanByRazorpayPlanId(planId?: string): SubscriptionPlan | undefined {
  if (!planId) return undefined;
  const plan = new SubscriptionService().getPlans().find((item) => item.razorpayPlanId === planId);
  return plan?.plan;
}

export class RazorpayService {
  isConfiguredForSubscriptions(plan: SubscriptionPlan) {
    const keys = configuredRazorpayKey();
    const planDefinition = new SubscriptionService().getPlan(plan);
    return Boolean(keys.keyId && keys.keySecret && planDefinition.razorpayPlanId);
  }

  async createSubscription(input: CreateRazorpaySubscriptionInput) {
    const keys = configuredRazorpayKey();
    const planDefinition = new SubscriptionService().getPlan(input.plan);

    if (!keys.keyId || !keys.keySecret || !planDefinition.razorpayPlanId) {
      return {
        configured: false,
        message:
          "Razorpay test-mode subscription creation is not configured yet. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and the MAMAAI-specific Razorpay plan ID environment variables.",
        requiredEnvironment: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", planDefinition.razorpayPlanIdEnv]
      };
    }

    const auth = Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: planDefinition.razorpayPlanId,
        total_count: 120,
        quantity: 1,
        customer_notify: input.customerNotify ?? 1,
        notes: {
          project: "mamaai",
          userId: input.userId,
          plan: input.plan,
          billingMarket: "india"
        }
      })
    });

    const data = (await response.json()) as RazorpaySubscriptionResponse & { error?: { description?: string } };

    if (!response.ok) {
      throw new Error(data.error?.description ?? "Razorpay subscription creation failed.");
    }

    const subscriptionRecord = this.upsertSubscriptionFromProvider({
      userId: input.userId,
      plan: input.plan,
      razorpaySubscriptionId: data.id,
      razorpayPlanId: data.plan_id ?? planDefinition.razorpayPlanId,
      providerStatus: data.status ?? "created",
      eventType: "subscription.pending",
      startsAt: toIsoFromSeconds(data.current_start),
      renewsAt: toIsoFromSeconds(data.current_end ?? data.charge_at)
    });

    return {
      configured: true,
      subscriptionId: data.id,
      shortUrl: data.short_url,
      keyId: keys.keyId,
      plan: planDefinition,
      subscriptionRecord
    };
  }

  async cancelSubscription(input: { userId: string; razorpaySubscriptionId: string; cancelAtCycleEnd: boolean }) {
    const keys = configuredRazorpayKey();
    if (!keys.keyId || !keys.keySecret) {
      return {
        configured: false,
        message: "Razorpay cancellation is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      };
    }

    const auth = Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64");
    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${input.razorpaySubscriptionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cancel_at_cycle_end: input.cancelAtCycleEnd ? 1 : 0
      })
    });

    const data = (await response.json()) as RazorpaySubscriptionResponse & { error?: { description?: string } };
    if (!response.ok) {
      throw new Error(data.error?.description ?? "Razorpay subscription cancellation failed.");
    }

    const record = this.upsertSubscriptionFromProvider({
      userId: input.userId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpayPlanId: data.plan_id,
      providerStatus: data.status ?? "cancelled",
      eventType: "subscription.cancelled",
      cancelledAt: input.cancelAtCycleEnd ? undefined : nowIso()
    });

    return { configured: true, subscriptionRecord: record };
  }

  verifyCheckoutSignature(input: { razorpayPaymentId: string; razorpaySubscriptionId: string; razorpaySignature: string }) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(input.razorpaySignature);
    return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }

  verifyWebhookSignature(rawBody: string, signature: string | null) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signature);
    return expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  }

  upsertSubscriptionFromProvider(input: {
    userId: string;
    plan?: SubscriptionPlan;
    razorpaySubscriptionId: string;
    razorpayPaymentId?: string;
    razorpayPlanId?: string;
    providerStatus?: string;
    eventType: RazorpaySubscriptionEvent;
    startsAt?: string;
    renewsAt?: string;
    cancelledAt?: string;
  }) {
    const plan = input.plan ?? findPlanByRazorpayPlanId(input.razorpayPlanId) ?? "family_starter";
    const existing = store.subscriptionRecords.find(
      (record) => record.paymentChannel === "razorpay" && record.razorpaySubscriptionId === input.razorpaySubscriptionId
    );
    const timestamp = nowIso();
    const status = mapSubscriptionStatus(input.eventType, input.providerStatus);
    const paymentStatus = mapPaymentStatus(input.eventType);

    const record: SubscriptionRecord = {
      subscriptionRecordId: existing?.subscriptionRecordId ?? createId("sub"),
      userId: input.userId,
      plan,
      status,
      paymentChannel: "razorpay",
      paymentStatus,
      source: "razorpay",
      memberLimit: subscriptionLimits[plan],
      startsAt: input.startsAt ?? existing?.startsAt ?? timestamp,
      renewsAt: input.renewsAt ?? existing?.renewsAt,
      expiresAt: existing?.expiresAt,
      cancelledAt: input.cancelledAt ?? existing?.cancelledAt,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpayPlanId: input.razorpayPlanId ?? existing?.razorpayPlanId,
      providerStatus: input.providerStatus ?? existing?.providerStatus,
      lastProviderEvent: input.eventType,
      lastProviderEventAt: timestamp,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp
    };

    if (existing) {
      Object.assign(existing, record);
    } else {
      store.subscriptionRecords.push(record);
    }

    store.paymentTransactions.push({
      transactionId: createId("txn"),
      userId: input.userId,
      plan,
      subscriptionRecordId: record.subscriptionRecordId,
      paymentChannel: "razorpay",
      paymentStatus,
      currency: "INR",
      providerPaymentId: input.razorpayPaymentId,
      providerSubscriptionId: input.razorpaySubscriptionId,
      providerEvent: input.eventType,
      rawStatus: input.providerStatus,
      createdAt: timestamp
    });

    return record;
  }
}
