import Script from "next/script";
import { SENSITIVE_BROWSER_STORAGE_KEYS } from "@/lib/shared/client-privacy";

/** Runs before interactive client code, including legacy screens still being migrated. */
export function PrivacyStorageGuard() {
  const keys = JSON.stringify(SENSITIVE_BROWSER_STORAGE_KEYS);
  return <Script id="mamaai-private-storage-guard" strategy="beforeInteractive">{`
    (() => {
      const blocked = new Set(${keys});
      const blockSensitiveWrites = (storage) => {
        const original = storage.setItem.bind(storage);
        storage.setItem = (key, value) => {
          if (blocked.has(String(key))) { storage.removeItem(String(key)); return; }
          original(key, value);
        };
        blocked.forEach((key) => storage.removeItem(key));
      };
      try { blockSensitiveWrites(window.localStorage); blockSensitiveWrites(window.sessionStorage); } catch (_) {}
      if ("caches" in window) caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("mamaai-pwa-")).map((key) => caches.delete(key)))).catch(() => {});
    })();
  `}</Script>;
}
