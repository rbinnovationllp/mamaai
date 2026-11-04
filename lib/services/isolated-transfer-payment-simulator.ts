import { AccountSecurityRepository } from "@/lib/repositories/account-security-repository";

/**
 * Test-only settlement hook. It has no HTTP route: a browser cannot mark a
 * transfer paid. Preview test harnesses call it after creating a pending intent.
 */
export async function settleIsolatedTransferPaymentForTest(userId: string, paymentIntentId: string) {
  if (process.env.MAMA_AI_ISOLATED_PREVIEW !== "true") throw new Error("SIMULATED_TRANSFER_PAYMENTS_DISABLED");
  const repository = new AccountSecurityRepository();
  const payment = await repository.getPayment(userId, paymentIntentId);
  if (!payment || payment.status !== "pending" || payment.amountPaise !== 19900 || payment.currency !== "INR") throw new Error("SIMULATED_TRANSFER_PAYMENT_INVALID");
  await repository.settleSimulatedPayment(userId, paymentIntentId, new Date().toISOString());
  return { paymentIntentId, status: "settled_simulated" as const };
}
