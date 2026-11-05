import type { SubscriptionRecord } from "@/lib/shared/contracts";

export function hasCurrentEntitlement(record?: SubscriptionRecord, now = Date.now()): boolean {
  if (!record || record.cancelledAt) return false;
  const end = record.expiresAt ?? record.renewsAt;
  if (record.startsAt && !(Date.parse(record.startsAt) <= now)) return false;
  if (record.status === "trialing") {
    return record.paymentChannel !== "razorpay" && Boolean(end && Date.parse(end) > now);
  }
  if (record.status !== "active" || record.paymentStatus !== "paid") return false;
  return Boolean(end && Date.parse(end) > now);
}

export function needsPaymentReconciliation(record?: SubscriptionRecord): boolean {
  return Boolean(record && !record.cancelledAt && (
    (record.status === "active" && record.paymentStatus === "paid" && !Number.isFinite(Date.parse(record.expiresAt ?? record.renewsAt ?? ""))) ||
    (record.paymentChannel === "razorpay" && record.paymentStatus === "pending" && ["created", "authenticated", "active"].includes(record.providerStatus ?? ""))
  ));
}
