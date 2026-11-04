"use client";

import { Analytics } from "@vercel/analytics/next";
import { createContext, useContext, useEffect, useState } from "react";

type Consent = "granted" | "denied" | "unknown";
const ConsentContext = createContext<Consent>("unknown");
export const useAnalyticsConsent = () => useContext(ConsentContext);

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent>("unknown");
  useEffect(() => { const timer = window.setTimeout(() => setConsent((localStorage.getItem("mamaai_analytics_consent") as Consent) || "unknown"), 0); return () => window.clearTimeout(timer); }, []);
  const choose = (next: Exclude<Consent, "unknown">) => { localStorage.setItem("mamaai_analytics_consent", next); setConsent(next); };
  return <ConsentContext.Provider value={consent}>{consent === "granted" ? <Analytics /> : null}{consent === "unknown" ? <section role="dialog" aria-label="Analytics preference" className="fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:bottom-5"><p className="text-sm text-slate-700">Help improve MAMAAI with optional, privacy-minimised usage analytics. You can change this choice by clearing this browser preference.</p><div className="mt-3 flex gap-2"><button onClick={() => choose("denied")} className="min-h-11 rounded-lg border px-4 text-sm font-bold">Decline</button><button onClick={() => choose("granted")} className="min-h-11 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white">Allow analytics</button></div></section> : null}</ConsentContext.Provider>;
}
