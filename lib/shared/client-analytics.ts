"use client";

import type { AnalyticsEventName } from "@/lib/repositories/in-memory-store";

function randomId(prefix: string) {
  const cryptoValue = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${cryptoValue}`;
}

function getOrCreateStorageId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = randomId(prefix);
  storage.setItem(key, next);
  return next;
}

function deviceCategory() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (ua.includes("mobi") || ua.includes("android")) return "mobile";
  return "desktop";
}

function trafficSource() {
  if (typeof document === "undefined") return "Direct";
  if (!document.referrer) return "Direct";
  try {
    return new URL(document.referrer).hostname;
  } catch {
    return "Referral";
  }
}

export function trackAnalyticsEvent(eventName: AnalyticsEventName, details?: { category?: string; label?: string }) {
  if (typeof window === "undefined") return;

  const visitorId = getOrCreateStorageId(window.localStorage, "mamaai_visitor_id", "visitor");
  const sessionId = getOrCreateStorageId(window.sessionStorage, "mamaai_session_id", "session");

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName,
      visitorId,
      sessionId,
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
      source: trafficSource(),
      category: details?.category,
      label: details?.label,
      deviceCategory: deviceCategory()
    })
  }).catch(() => {
    // Analytics must never interrupt the core meal-planning flow.
  });
}
