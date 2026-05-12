// Drink-name helpers.
// Display rules and temperature classification are kept here so every render
// site (cards, rows, cart bar, /orders, WhatsApp share) reads from one place.
//
// "Peng" is the kopitiam suffix for iced. We keep the raw name ("Kopi Peng")
// in storage and DB rows so historical orders, search, and the existing
// hot/iced detection on /orders all keep working — only the display flips
// to a more universally-readable "Iced Kopi" form.

/**
 * Render a drink name for the UI.
 * - Trailing " Peng" (case-insensitive) gets stripped and "Iced " prepended.
 * - Everything else passes through unchanged.
 *
 * Examples:
 *   "Kopi Peng"            -> "Iced Kopi"
 *   "Teh C Kosong Peng"    -> "Iced Teh C Kosong"
 *   "Kopi C Siew Dai"      -> "Kopi C Siew Dai"
 */
export function displayDrinkName(raw: string): string {
  if (/\bpeng$/i.test(raw)) {
    const stripped = raw.replace(/\s*\bpeng$/i, "").trim();
    return `Iced ${stripped}`;
  }
  return raw;
}

/**
 * Classify a drink as hot, iced, or neither. The "neither" path keeps the
 * temp icon off cards where we can't reliably tell (custom drinks,
 * non-standard names).
 */
export function drinkTemp(raw: string): "iced" | "hot" | null {
  const n = raw.toLowerCase();
  // Iced markers — Peng suffix or known cold "Others" drinks.
  if (/\bpeng\b/.test(n)) return "iced";
  if (/(sng bao|soya cincau|michael jackson|lime juice)/.test(n)) return "iced";
  // Known-hot bases default to hot.
  if (/^(kopi|teh|yuan yang|milo|horlicks|bandung|barley|tiao he)\b/.test(n)) return "hot";
  return null;
}
