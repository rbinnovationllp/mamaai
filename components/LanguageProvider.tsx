"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type AppLanguage, defaultLanguage, isAppLanguage, supportedLanguages } from "@/lib/i18n";

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(defaultLanguage);

  useEffect(() => {
    const saved = window.localStorage.getItem("mamaai_language");
    if (isAppLanguage(saved)) {
      setLanguageState(saved);
      document.documentElement.lang = supportedLanguages[saved].htmlLang;
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        setLanguageState(nextLanguage);
        window.localStorage.setItem("mamaai_language", nextLanguage);
        document.documentElement.lang = supportedLanguages[nextLanguage].htmlLang;
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return value;
}

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(event) => setLanguage(event.target.value as AppLanguage)}
      className={`rounded-full border border-amber-200 bg-white font-black text-stone-700 shadow-sm ${compact ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs"}`}
      aria-label="Select language"
    >
      {(Object.keys(supportedLanguages) as AppLanguage[]).map((code) => (
        <option key={code} value={code}>
          {supportedLanguages[code].label}
        </option>
      ))}
    </select>
  );
}
