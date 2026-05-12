// Drink-name helpers.
// Display rules and temperature classification are kept here so every render
// site (cards, rows, cart bar, /orders, WhatsApp share) reads from one place.
//
// "Peng" is the kopitiam suffix for iced. We keep the raw name ("Kopi Peng")
// in storage and DB rows so historical orders, search, and the existing
// hot/iced detection on /orders all keep working — only the display flips
// to a more universally-readable form when the language toggle is in "en".

import type { Lang } from "@/lib/language";

// Modifier translation map for the EN language mode. Used both for the
// drink-name transform (qualifiers below) and for builder pill labels.
export const MODIFIER_TRANSLATIONS: Record<string, string> = {
  "Peng": "Iced",
  "Pua Sio": "Lukewarm",
  "Siew Dai": "Less sweet",
  "Gah Dai": "Extra sweet",
  "Kosong": "No sugar",
  "Gao": "Extra thick",
  "Po": "Weak",
  "Di Lo": "Extra strong",
  "Tarik": "Pulled",
};

// Tokens that become a trailing comma-qualifier in EN-mode names
// (vs. inlined into the name itself). Longest-first so multi-word matches
// don't get partially eaten by single-word ones.
const QUALIFIER_TOKENS = ["Siew Dai", "Gah Dai", "Kosong", "Gao"];

/**
 * Look up the English label for a single modifier token; returns the input
 * unchanged in SIN mode or when the token isn't in the map.
 */
export function translateModifier(token: string, lang: Lang = "en"): string {
  if (lang === "sin") return token;
  return MODIFIER_TRANSLATIONS[token] ?? token;
}

/**
 * Render a drink name for the UI.
 *
 * SIN mode: pass-through (raw kopitiam terms preserved).
 *
 * EN mode:
 * - Trailing " Peng" stripped, "Iced " prepended.
 * - "Siew Dai", "Gah Dai", "Kosong", "Gao" extracted and appended as
 *   lowercase comma qualifiers.
 *
 * Examples (EN):
 *   "Kopi Peng"            -> "Iced Kopi"
 *   "Kopi C Siew Dai Peng" -> "Iced Kopi C, less sweet"
 *   "Kopi Gao Siew Dai"    -> "Kopi, less sweet, extra thick"
 *   "Teh O Kosong Peng"    -> "Iced Teh O, no sugar"
 */
export function displayDrinkName(raw: string, lang: Lang = "en"): string {
  if (lang === "sin") return raw;

  let working = raw;
  let iced = false;
  if (/\bpeng$/i.test(working)) {
    working = working.replace(/\s*\bpeng$/i, "").trim();
    iced = true;
  }

  const qualifiers: string[] = [];
  for (const token of QUALIFIER_TOKENS) {
    const re = new RegExp(`\\s*\\b${token.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(working)) {
      working = working.replace(re, "").replace(/\s+/g, " ").trim();
      qualifiers.push((MODIFIER_TRANSLATIONS[token] ?? token).toLowerCase());
    }
  }

  const parts: string[] = [];
  if (iced) parts.push("Iced");
  if (working) parts.push(working);
  let result = parts.join(" ");
  if (qualifiers.length > 0) result += ", " + qualifiers.join(", ");
  return result || raw;
}

/**
 * Classify a drink as hot, iced, or neither. Detection runs on the raw
 * name regardless of language mode — Peng-suffix and the known-cold
 * "Others" drinks both pass through.
 */
export function drinkTemp(raw: string): "iced" | "hot" | null {
  const n = raw.toLowerCase();
  if (/\bpeng\b/.test(n)) return "iced";
  if (/(sng bao|soya cincau|michael jackson|lime juice)/.test(n)) return "iced";
  if (/^(kopi|teh|yuan yang|milo|horlicks|bandung|barley|tiao he)\b/.test(n)) return "hot";
  return null;
}
