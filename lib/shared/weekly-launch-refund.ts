export type RefundTier = "pending" | "full" | "half";

const windowStarts = ["2026-11-16", "2026-11-23", "2026-11-30", "2026-12-07", "2026-12-14", "2026-12-21", "2026-12-28"] as const;
const IST = "Asia/Kolkata";

function istParts(at: Date) {
  const values = new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(at);
  return Object.fromEntries(values.filter((item) => item.type !== "literal").map((item) => [item.type, item.value]));
}

export interface OfferWindow { id: string; opensAtIst: string; closesAtIst: string; }
export const weeklyLaunchRefundWindows: OfferWindow[] = windowStarts.map((date) => {
  const close = new Date(`${date}T00:00:00Z`); close.setUTCDate(close.getUTCDate() + 3);
  return { id: date, opensAtIst: `${date}T00:00:00+05:30`, closesAtIst: `${close.toISOString().slice(0, 10)}T00:00:00+05:30` };
});

export function activeOfferWindow(at = new Date()): OfferWindow | undefined {
  const local = istParts(at); const localKey = `${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}:${local.second}+05:30`;
  return weeklyLaunchRefundWindows.find((window) => localKey >= window.opensAtIst && localKey < window.closesAtIst);
}

export function nextOfferWindow(at = new Date()): OfferWindow | undefined {
  const local = istParts(at); const localKey = `${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}:${local.second}+05:30`;
  return weeklyLaunchRefundWindows.find((window) => window.opensAtIst > localKey);
}

/** Tier is final only after the reconciliation worker has ordered all earlier captured payments. */
export function tierForFinalRank(rank: number, reconciled: boolean): RefundTier {
  if (!reconciled || rank < 1) return "pending";
  return rank <= 20 ? "full" : "half";
}

export function refundAmountPaise(chargeAmountPaise: number, tier: RefundTier, basisApproved: boolean): number | undefined {
  if (!basisApproved || chargeAmountPaise < 0) return undefined;
  return tier === "full" ? chargeAmountPaise : tier === "half" ? Math.floor(chargeAmountPaise / 2) : undefined;
}
