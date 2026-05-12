"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "sin";
const STORAGE_KEY = "hellokopi_lang";

interface Ctx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<Ctx | null>(null);

function readStored(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "sin" ? "sin" : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Lazy-init reads localStorage synchronously so the first paint shows the
  // user's chosen language — no flicker from a default "en" to stored "sin".
  const [lang, setLangState] = useState<Lang>(() => readStored());

  // Mirror back to localStorage on any change so a tab can update and the
  // next session picks it up. Skipped on SSR.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
  }
  function toggleLang() {
    setLangState((prev) => (prev === "en" ? "sin" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Read the current language. Falls back to "en" with no-op setters if used
 * outside the provider so SSR / stray renders don't crash.
 */
export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "en", setLang: () => {}, toggleLang: () => {} };
  return ctx;
}
