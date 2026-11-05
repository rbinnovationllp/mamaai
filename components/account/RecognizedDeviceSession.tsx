"use client";
import { useEffect } from "react";

/** Check on app open/resume; credentials stay in HTTP-only cookies. */
export function RecognizedDeviceSession() {
  useEffect(() => {
    let lastCheck = 0, active = true;
    const check = () => {
      if (!active || document.visibilityState !== "visible" || Date.now() - lastCheck < 15 * 60 * 1000) return;
      lastCheck = Date.now();
      void fetch("/api/customer/session", { cache: "no-store" }).catch(() => undefined);
    };
    check(); document.addEventListener("visibilitychange", check);
    return () => { active = false; document.removeEventListener("visibilitychange", check); };
  }, []);
  return null;
}
