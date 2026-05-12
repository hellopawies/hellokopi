"use client";

import { useLanguage } from "@/lib/language";

/**
 * Tiny EN / SIN text toggle for the header. Shows the current mode as a
 * compact uppercase chip, matching the rest of the app's small-label
 * typography. Tap to switch — persisted to localStorage by the provider.
 */
export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage();
  const label = lang === "en" ? "EN" : "SIN";
  const nextLabel = lang === "en" ? "Singlish" : "English";

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={`Language: ${label}. Switch to ${nextLabel}.`}
      className="text-[10px] uppercase tracking-[0.25em] font-sans font-medium text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors duration-200 touch-manipulation tabular-nums"
    >
      {label}
    </button>
  );
}
