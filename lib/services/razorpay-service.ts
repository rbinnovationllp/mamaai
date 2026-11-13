import { hasCurrentEntitlement, needsPaymentReconciliation } from "./paid-entitlement";
import crypto from "crypto";
import type {
  PaymentStatus,
  PaymentTransaction,
  SubscriptionPlan,
  SubscriptionRecord,
  SubscriptionStatus,
} from "@/lib/shared/contracts";
import { createId, nowIso } from "@/lib/repositories/in-memory-store";
import { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { SubscriptionService, subscriptionLimits } from "./subscription-service";
import { isIsolatedRuntime, isolatedFeatureEnabled } from "@/lib/server/isolated-runtime-safety";

function paymentRuntimeAllowed() {
  return !isIsolatedRuntime() || isolatedFeatureEnabled("MAMA_AI_ISOLATED_RAZORPAY_TEST_ENABLED");
}

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

export interface CreateRazorpaySubscriptionInput {
  userId: string;
  plan: SubscriptionPlan;
  billingMarket?: "IN" | "INT";
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
    keyId: process.env.RAZORPAY_KEY_ID?.trim(),
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim(),
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim(),
  };
}

function normalizeRazorpayPlanId(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/plan_[A-Za-z0-9]+/);
  return match?.[0] ?? trimmed;
}

function mapSubscriptionStatus(
  eventType: RazorpaySubscriptionEvent,
  providerStatus?: string
): SubscriptionStatus {
  if (eventType === "subscription.cancelled" || providerStatus === "cancelled") return "cancelled";
  if (eventType === "payment.failed" || eventType === "subscription.halted" || eventType === "subscription.paused") return "past_due";
  if (eventType === "subscription.completed" || providerStatus === "completed") return "expired";
  if (
    ["subscription.activated", "subscription.charged", "subscription.resumed"].includes(eventType) ||
    providerStatus === "active"
  ) {
    return "active";
  }
  if (eventType === "subscription.pending" || providerStatus === "created") return "past_due";
  return "past_due";
}

function mapPaymentStatus(eventType: RazorpaySubscriptionEvent): PaymentStatus {
  if (eventType === "payment.failed") return "failed";
  if (["subscription.activated", "subscription.charged"].includes(eventType)) return "paid";
  if (eventType === "subscription.cancelled") return "unknown";
  return "pending";
}

function findPlanByRazorpayPlanId(planId?: string): SubscriptionPlan | undefined {
  if (!planId) return undefined;
  const usdPlanEnvByPlan: Partial<Record<SubscriptionPlan, string | undefined>> = {
    starter: normalizeRazorpayPlanId(process.env.RAZORPAY_PLAN_STARTER_USD),
    premium: normalizeRazorpayPlanId(process.env.RAZORPAY_PLAN_PREMIUM_USD),
    family_plus: normalizeRazorpayPlanId(process.env.RAZORPAY_PLAN_PLUS_USD),
  };
  const plan = new SubscriptionService()
    .getPlans()
    .find((item) => normalizeRazorpayPlanId(item.razorpayPlanId) === planId || usdPlanEnvByPlan[item.plan] === planId);
  return plan?.plan;
}

export class RazorpayService {
  private subscriptionRepository = new SubscriptionRepository();

  isConfiguredForSubscriptions(plan: SubscriptionPlan) {
    if (!paymentRuntimeAllowed()) return false;
    const keys = configuredRazorpayKey();
    const planDefinition = new SubscriptionService().getPlan(plan);
    return Boolean(keys.keyId && keys.keySecret && planDefinition.razorpayPlanId);
  }

  async createSubscription(input: CreateRazorpaySubscriptionInput) {
    if (!paymentRuntimeAllowed()) return { configured: false, message: "Payments are disabled in this isolated environment.", requiredEnvironment: [] };
    const current = await this.subscriptionRepository.getLatestSubscriptionForUser(input.userId);
    if (hasCurrentEntitlement(current) || needsPaymentReconciliation(current)) throw new Error("An existing subscription must be checked before starting another checkout.");
    const keys = configuredRazorpayKey();
    const planDefinition = new SubscriptionService().getPlan(input.plan);
    const isInternational = input.billingMarket === "INT";
    const rawSelectedPlanId = isInternational
      ? input.plan === "starter"
        ? process.env.RAZORPAY_PLAN_STARTER_USD
        : input.plan === "premium"
        ? process.env.RAZORPAY_PLAN_PREMIUM_USD
        : process.env.RAZORPAY_PLAN_PLUS_USD
      : planDefinition.razorpayPlanId;
    const selectedPlanId = normalizeRazorpayPlanId(rawSelectedPlanId);
    const selectedPlanIdEnv = isInternational
      ? input.plan === "starter"
        ? "RAZORPAY_PLAN_STARTER_USD"
        : input.plan === "premium"
        ? "RAZORPAY_PLAN_PREMIUM_USD"
        : "RAZORPAY_PLAN_PLUS_USD"
      : planDefinition.razorpayPlanIdEnv;

    if (!keys.keyId || !keys.keySecret || !selectedPlanId) {
      return {
        configured: false,
        message:
          "Razorpay test-mode subscription creation is not configured yet. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and the MAMAAI-specific Razorpay plan ID environment variables.",
        requiredEnvironment: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", selectedPlanIdEnv],
      };
    }

    const auth = Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: selectedPlanId,
        total_count: 120,
        quantity: 1,
        customer_notify: input.customerNotify ? 1 : 0,
        notes: {
          project: "mamaai",
          userId: input.userId,
          plan: input.plan,
          billingMarket: isInternational ? "international" : "india",
        },
      }),
    });

    const data = (await response.json()) as RazorpaySubscriptionResponse & {
      error?: { description?: string };
    };

    if (!response.ok) {
      throw new Error(data.error?.description ?? "Razorpay subscription creation failed.");
    }

    const subscriptionRecord = await this.upsertSubscriptionFromProvider({
      userId: input.userId,
      plan: input.plan,
      razorpaySubscriptionId: data.id,
      razorpayPlanId: data.plan_id ?? selectedPlanId,
      providerStatus: data.status ?? "created",
      eventType: "subscription.pending",
      startsAt: toIsoFromSeconds(data.current_start),
      renewsAt: toIsoFromSeconds(data.current_end ?? data.charge_at),
    });

    return {
      configured: true,
      subscriptionId: data.id,
      shortUrl: data.short_url,
      keyId: keys.keyId,
      billingMarket: input.billingMarket ?? "IN",
      plan: planDefinition,
      subscriptionRecord,
    };
  }

  async cancelSubscription(input: {
    userId: string;
    razorpaySubscriptionId: string;
    cancelAtCycleEnd: boolean;
  }) {
    if (!paymentRuntimeAllowed()) return { configured: false, message: "Payments are disabled in this isolated environment." };
    const keys = configuredRazorpayKey();
    if (!keys.keyId || !keys.keySecret) {
      return {
        configured: false,
        message: "Razorpay cancellation is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      };
    }

    const auth = Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64");
    const response = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${input.razorpaySubscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancel_at_cycle_end: input.cancelAtCycleEnd ? 1 : 0,
        }),
      }
    );

    const data = (await response.json()) as RazorpaySubscriptionResponse & {
      error?: { description?: string };
    };
    if (!response.ok) {
      throw new Error(data.error?.description ?? "Razorpay subscription cancellation failed.");
    }

    if (input.cancelAtCycleEnd && data.status !== "cancelled") {
      const subscriptionRecord = await this.subscriptionRepository.getSubscriptionForUserByRazorpaySubscriptionId(input.userId, input.razorpaySubscriptionId);
      return { configured: true, subscriptionRecord };
    }

    const record = await this.upsertSubscriptionFromProvider({
      userId: input.userId,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpayPlanId: data.plan_id,
      providerStatus: data.status ?? "cancelled",
      eventType: "subscription.cancelled",
      cancelledAt: nowIso(),
    });

    return { configured: true, subscriptionRecord: record };
  }

  verifyCheckoutSignature(input: {
    razorpayPaymentId: string;
    razorpaySubscriptionId: string;
    razorpaySignature: string;
  }) {
    if (!paymentRuntimeAllowed()) return false;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(input.razorpaySignature);
    return (
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    );
  }

  verifyWebhookSignature(rawBody: string, signature: string | null) {
    if (!paymentRuntimeAllowed()) return false;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signature);
    return (
      expectedBuffer.length === providedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    );
  }

  async resolveProviderPlan(razorpaySubscriptionId: string) {
    if (!paymentRuntimeAllowed()) throw new Error("Payments are disabled in this isolated environment.");
    const keys = configuredRazorpayKey();
    if (!keys.keyId || !keys.keySecret) throw new Error("Razorpay credentials are not configured.");
    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(razorpaySubscriptionId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString("base64")}` },
      cache: "no-store",
    });
    const provider = (await response.json()) as RazorpaySubscriptionResponse & { error?: { description?: string } };
    if (!response.ok || !provider.plan_id) throw new Error(provider.error?.description ?? "Unable to verify Razorpay subscription plan.");
    const plan = findPlanByRazorpayPlanId(normalizeRazorpayPlanId(provider.plan_id));
    if (!plan) throw new Error("The Razorpay plan is not mapped to a MamaAI subscription.");
    return { plan, planId: normalizeRazorpayPlanId(provider.plan_id), status: provider.status, startsAt: toIsoFromSeconds(provider.current_start), expiresAt: toIsoFromSeconds(provider.current_end) };
  }

  async confirmCapturedPayment(paymentId: string) {
    if (!paymentRuntimeAllowed()) throw new Error("Payments are disabled in this isolated environment.");
    const { keyId, keySecret } = configuredRazorpayKey();
    if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured.");
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Unable to verify payment with Razorpay.");
    const payment = await response.json();
    return payment.id === paymentId && payment.status === "captured" && payment.captured === true;
  }

  async upsertSubscriptionFromProvider(input: {
    userId: string;
    plan?: SubscriptionPlan;
    razorpaySubscriptionId: string;
    razorpayPaymentId?: string;
    razorpayPlanId?: string;
    providerStatus?: string;
    eventType: RazorpaySubscriptionEvent;
    amount?: number;
    currency?: "INR" | "USD";
    providerInvoiceId?: string;
    startsAt?: string;
    renewsAt?: string;
    cancelledAt?: string;
    webhookKey?: string;
    eventAt?: string;
  }) {

    const existing = await this.subscriptionRepository.getSubscriptionForUserByRazorpaySubscriptionId(
      input.userId,
      input.razorpaySubscriptionId
    );
    const plan = findPlanByRazorpayPlanId(normalizeRazorpayPlanId(input.razorpayPlanId)) ?? existing?.plan ?? input.plan;
    if (!plan) throw new Error("Unmapped subscription plan");
    if (existing?.lastProviderEventAt && input.eventAt && input.eventAt < existing.lastProviderEventAt && !(existing.paymentStatus === "pending" && input.eventType === "subscription.charged")) return existing;
    if (existing?.cancelledAt && input.eventType !== "subscription.cancelled") return existing;
    const timestamp = nowIso();
    const preservePaidPeriod = ["subscription.pending", "payment.failed"].includes(input.eventType) && hasCurrentEntitlement(existing);
    if (preservePaidPeriod) return existing!;
    const status = mapSubscriptionStatus(input.eventType, input.providerStatus);
    const eventPaymentStatus = mapPaymentStatus(input.eventType);
    const paymentStatus = eventPaymentStatus === "pending" && existing?.paymentStatus === "paid" ? "paid" : eventPaymentStatus;

    const record: SubscriptionRecord = {
      subscriptionRecordId: existing?.subscriptionRecordId ?? createId("sub"),
      userId: input.userId,
      plan,
      status,
      paymentChannel: "razorpay",
      paymentStatus,
      source: "razorpay",
      memberLimit: subscriptionLimits[plan] ?? 4,
      startsAt: input.startsAt ?? existing?.startsAt ?? timestamp,
      renewsAt: input.renewsAt ?? existing?.renewsAt,
      expiresAt: status === "active" && paymentStatus === "paid" ? input.renewsAt ?? existing?.expiresAt : existing?.expiresAt,
      cancelledAt: input.cancelledAt ?? existing?.cancelledAt,
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      razorpayPlanId: input.razorpayPlanId ?? existing?.razorpayPlanId,
      providerStatus: input.providerStatus ?? existing?.providerStatus,
      lastProviderEvent: input.eventType,
      lastProviderEventAt: input.eventAt ?? timestamp,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    const payment: PaymentTransaction = {
      transactionId: createId("txn"),
      userId: input.userId,
      plan,
      subscriptionRecordId: record.subscriptionRecordId,
      paymentChannel: "razorpay",
      paymentStatus,
      amount: input.amount,
      currency: input.currency,
      providerPaymentId: input.razorpayPaymentId,
      providerSubscriptionId: input.razorpaySubscriptionId,
      providerInvoiceId: input.providerInvoiceId,
      providerEvent: input.eventType,
      rawStatus: input.providerStatus,
      createdAt: timestamp,
    };

    return this.subscriptionRepository.saveSubscriptionAndPayment({
      subscription: record,
      payment,
      webhookKey: input.webhookKey,
      expectedUpdatedAt: existing?.updatedAt,
    });
  }
}




