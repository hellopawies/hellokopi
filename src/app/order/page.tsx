"use client";

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import BrewingCup from "@/app/components/BrewingCup";
import { MyPicksBentoSkeleton } from "@/app/components/Skeleton";
import { useDelayed } from "@/lib/useDelayed";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";
import { drinkColor } from "@/lib/drinkColor";
import { displayDrinkName, translateModifier, drinkTemp } from "@/lib/drinkName";
import { useLanguage } from "@/lib/language";
import { TempIcon } from "@/app/components/TempIcon";
import { SESSION_MS, TIMEZONE_SG, formatTime } from "@/lib/constants";
import { CATEGORIES } from "@/data/drinks";
import { DRINK_BASES, OTHERS_DRINKS, type DrinkSpecial } from "@/data/menu";
import { searchDrinks, parseChunks } from "@/lib/drinkSearch";

function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern); } catch {}
}

function getInitials(n: string): string {
  return n.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

function presenceCopy(others: string[]): string {
  if (others.length === 0) return "";
  if (others.length === 1) return `${others[0]} is deciding too.`;
  if (others.length === 2) return `${others[0]} and ${others[1]} are deciding.`;
  return `${others[0]}, ${others[1]} and ${others.length - 2} other${others.length - 2 === 1 ? "" : "s"} deciding.`;
}


const GLOSSARY: Record<string, string> = {
  "Siew Dai": "Less sweet — reduced condensed milk or sugar.",
  "Gah Dai": "Extra sweet — more condensed milk or sugar than usual.",
  "Di Lo": "Extra strong, no water — the most concentrated drippings from the brew.",
  "Pua Sio": "Lukewarm — not hot, not cold.",
  "Gu You": "Butter kopi — a pat of butter added, giving a rich, silky texture.",
  "Kopi": "Singaporean coffee made from Robusta beans roasted with butter and sugar.",
  "Teh": "Tea — usually a strong Ceylon or local blend, served with milk.",
  "Gao": "Strong or thick — extra-concentrated brew, about 1.5× strength.",
  "Peng": "Iced — served cold over ice.",
  "Tarik": "Pulled — frothed by pouring between cups at height to aerate.",
  "Halia": "Ginger — brewed or blended with fresh ginger root.",
  "Kosong": "Zero / none — no sugar or sweetener added at all.",
  "Cham": "Mixed — half coffee, half tea.",
  "Dinosaur": "Extra Milo powder heaped on top.",
  "Godzilla": "Double Milo powder on top — even messier than Dinosaur.",
};

const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

function tokenize(text: string): { text: string; term?: string }[] {
  const tokens: { text: string; term?: string }[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let bestIdx = remaining.length;
    let bestTerm = "";
    for (const term of GLOSSARY_TERMS) {
      const idx = remaining.toLowerCase().indexOf(term.toLowerCase());
      if (idx !== -1 && idx < bestIdx) { bestIdx = idx; bestTerm = term; }
    }
    if (bestTerm) {
      if (bestIdx > 0) tokens.push({ text: remaining.slice(0, bestIdx) });
      tokens.push({ text: remaining.slice(bestIdx, bestIdx + bestTerm.length), term: bestTerm });
      remaining = remaining.slice(bestIdx + bestTerm.length);
    } else {
      tokens.push({ text: remaining });
      remaining = "";
    }
  }
  return tokens;
}

function GlossarySheet({ term, onClose }: { term: string; onClose: () => void }) {
  const def = GLOSSARY[term];
  if (!def || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm mx-4 mb-8 sm:mb-0 rounded-2xl bg-[#FAFAF8]/98 dark:bg-[#111]/98 backdrop-blur-xl border border-stone-200 dark:border-stone-700/60 shadow-2xl shadow-black/15 dark:shadow-black/60 px-5 py-5"
        style={{ animation: "toastSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] uppercase tracking-[0.25em] font-sans font-medium text-stone-400 dark:text-stone-500 mb-1">Glossary</p>
        <p className="font-serif text-2xl font-light tracking-wide text-stone-800 dark:text-stone-100 mb-2">{term}</p>
        <p className="text-sm font-sans font-light text-stone-500 dark:text-stone-400 leading-relaxed">{def}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors touch-manipulation"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body
  );
}

function AnnotatedText({ text, selected }: { text: string; selected?: boolean }) {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const tokens = useMemo(() => tokenize(text), [text]);
  return (
    <>
      {tokens.map((tok, i) =>
        tok.term ? (
          <span
            key={i}
            className={`border-b border-dotted cursor-pointer ${selected ? "border-stone-400 dark:border-stone-500" : "border-stone-300 dark:border-stone-600"}`}
            onClick={(e) => { e.stopPropagation(); setActiveTerm(tok.term ?? null); }}
          >
            {tok.text}
          </span>
        ) : (
          <span key={i}>{tok.text}</span>
        )
      )}
      {activeTerm && <GlossarySheet term={activeTerm} onClose={() => setActiveTerm(null)} />}
    </>
  );
}

// Lookup map for descriptions on rendered drink cards (pre-defined drinks only).
// Combines drinks.ts CATEGORIES (Kopi/Teh/Milo/etc base entries) with menu.ts
// OTHERS_DRINKS (Bandung Peng, Barley, Michael Jackson, etc.) so every drink
// surfaced in the UI has a resolvable description.
const BASE_DRINKS_MAP = new Map<string, { name: string; description: string }>([
  ...CATEGORIES.flatMap((c) => c.drinks).map((d) => [d.name, d] as const),
  ...OTHERS_DRINKS.map((d) => [d.name, d] as const),
]);

// Cart auto-save: persists the in-progress cart per user so an accidental tab
// close or reload doesn't lose progress. Cleared the moment cart goes empty.
const CART_DRAFT_KEY = "hellokopi_cart_draft";
const CART_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

// Synthesise a description for builder-composed drink names that have no
// literal entry in drinks.ts (e.g. "Teh C Po Kosong"). Mirrors the literal
// style: capitalised, " + " separators, ", no sugar" tail for Kosong.
// Returns undefined if the name has unknown tokens.
function synthesiseDescription(name: string): string | undefined {
  const tokens = name.split(/\s+/);
  let i = 0;

  // Skip the base — the card title already carries it. Just confirm the name
  // starts with a known base, otherwise bail.
  if (tokens[i] === "Teh" && tokens[i + 1] === "Halia") i += 2;
  else if (tokens[i] === "Yuan" && tokens[i + 1] === "Yang") i += 2;
  else if (tokens[i] === "Kopi" || tokens[i] === "Teh" || tokens[i] === "Milo" || tokens[i] === "Horlicks") i += 1;
  else return undefined;

  let temp: string | null = null;
  let strength: string | null = null;
  let style: string | null = null;
  let milk: "O" | "C" | "default" = "default";
  let sweetness: "Siew Dai" | "Gah Dai" | "Kosong" | null = null;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "Di" && tokens[i + 1] === "Lo") { strength = "extra strong"; i += 2; continue; }
    if (t === "Pua" && tokens[i + 1] === "Sio") { temp = "lukewarm"; i += 2; continue; }
    if (t === "Siew" && tokens[i + 1] === "Dai") { sweetness = "Siew Dai"; i += 2; continue; }
    if (t === "Gah" && tokens[i + 1] === "Dai") { sweetness = "Gah Dai"; i += 2; continue; }
    if (t === "O")      { milk = "O"; i++; continue; }
    if (t === "C")      { milk = "C"; i++; continue; }
    if (t === "Gao")    { strength = "strong"; i++; continue; }
    if (t === "Po")     { strength = "weak"; i++; continue; }
    if (t === "Peng")   { temp = "iced"; i++; continue; }
    if (t === "Tarik")  { style = "pulled"; i++; continue; }
    if (t === "Kosong") { sweetness = "Kosong"; i++; continue; }
    return undefined;
  }

  const parts: string[] = [];
  if (temp) parts.push(temp);
  if (strength) parts.push(strength);
  if (style) parts.push(style);
  parts.push(milk === "O" ? "black" : milk === "C" ? "evap milk" : "condensed milk");
  if (sweetness === "Siew Dai") parts.push("less sweet");
  else if (sweetness === "Gah Dai") parts.push("extra sweet");

  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  let out = parts.join(" + ");
  if (sweetness === "Kosong") out += ", no sugar";
  return out;
}

interface CustomDrink { id: string; name: string; description: string; category_id: string; }

type Tab = "yours" | "all";
type CartItem = { name: string; qty: number };
type OrderState = "idle" | "loading" | { orderedAt: Date; sessionStart: Date; items: CartItem[] } | "error";

// ─── Heart icon ───────────────────────────────────────────────
/**
 * Inline qty indicator (B6). Renders up to 3 tiny cup pictograms; 4+
 * fall back to a plain "× N" numeral so the line doesn't blow out.
 * Sits next to the drink name in the cart bar + last-order card.
 */
function CupGlyph({ qty }: { qty: number }) {
  if (qty <= 1) return null;
  if (qty <= 3) {
    return (
      <span className="inline-flex items-center gap-[3px] ml-2 align-middle text-stone-400 dark:text-stone-500">
        {Array.from({ length: qty }).map((_, i) => (
          <svg key={i} viewBox="0 0 16 16" width={10} height={10} fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M3 5 L4 12 Q4.2 13 5 13 L11 13 Q11.8 13 12 12 L13 5 Z" strokeLinejoin="round" />
            <path d="M12 7 Q14.2 7 14.2 8.5 Q14.2 10 12 10" strokeLinecap="round" />
          </svg>
        ))}
      </span>
    );
  }
  return <span className="ml-1.5 text-[11px] font-normal text-stone-400 dark:text-stone-500 tabular-nums align-middle">× {qty}</span>;
}

function Heart({ filled, bursting }: { filled: boolean; bursting?: boolean }) {
  return (
    <svg
      className={`w-[15px] h-[15px] transition-colors duration-150 flex-shrink-0 ${
        filled ? "text-rose-400" : "text-stone-250 group-hover/heart:text-stone-400"
      }`}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      style={bursting ? { animation: "heartPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" } : {}}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

// ─── Drink card (grid view) ───────────────────────────────────
function DrinkCard({
  name, description, selected, qty, onSelect, favourited, onToggleFavourite, count, enterDelay, hero,
}: {
  name: string;
  description?: string;
  selected: boolean;
  qty: number;
  onSelect: () => void;
  favourited: boolean;
  onToggleFavourite: () => void;
  count?: number;
  enterDelay?: number;
  /** Promotes the card to a larger bento tile — larger serif name, drink-
      colour dot, room for description to breathe. Used for the first
      saved pick on My Picks. */
  hero?: boolean;
}) {
  const [bursting, setBursting] = useState(false);
  const { lang } = useLanguage();
  return (
    <div
      className="relative h-full"
      style={enterDelay !== undefined ? { animation: `pageIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${enterDelay}ms both` } : undefined}
    >
      {/* Newsprint: hairline-bordered card with sharper corners, no drop
          shadow, no hover-lift. The card *is* the page — it doesn't float
          above it. Temperature band + drink-colour dot stay (functional). */}
      <button
        type="button"
        onClick={onSelect}
        className={`
          relative overflow-hidden h-full w-full flex flex-col text-left border-2 rounded-sm transition-colors duration-200 touch-manipulation active:opacity-80
          ${hero ? "p-5 sm:p-6" : "p-3.5"}
          ${selected
            ? "bg-stone-900 border-stone-900 dark:bg-stone-100 dark:border-stone-100"
            : "bg-cream dark:bg-black border-stone-900 dark:border-stone-100 hover:bg-stone-100 dark:hover:bg-stone-900"}
        `}
      >
        {/* Temperature band — kept as a functional signal. Slightly thicker
            (3px) for newsprint emphasis; spans the full card width. */}
        {!selected && (() => {
          const t = drinkTemp(name);
          if (!t) return null;
          return (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] pointer-events-none"
              style={{
                background: t === "iced" ? "rgba(99,152,238,0.85)" : "rgba(239,68,68,0.8)",
              }}
            />
          );
        })()}
        {hero && (
          <div className="flex items-center gap-2 mb-2 relative">
            <span
              aria-hidden
              className="block w-2.5 h-2.5"
              style={{ background: drinkColor(name) }}
            />
            <span className={`font-serif italic text-[13px] font-light ${
              selected ? "text-stone-300 dark:text-stone-600" : "text-stone-500 dark:text-stone-400"
            }`}>
              Featured
            </span>
          </div>
        )}
        {/* Drink name — now serif (C9) so cards read like a menu, not a UI. */}
        <p className={`relative font-serif font-light tracking-wide leading-snug pr-7 ${
          hero ? "text-lg sm:text-xl" : "text-[15px]"
        } ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
          {displayDrinkName(name, lang)}
          <TempIcon name={name} className={`inline ml-1.5 align-middle ${hero ? "w-3.5 h-3.5" : "w-3 h-3"}`} />
          {selected && qty > 1 ? <span className="ml-1.5 text-[11px] font-normal opacity-60">×{qty}</span> : null}
        </p>
        {description && (
          // Quoted-aside treatment (E15): italic serif with a thin vertical
          // rule. Reads as a chef's note rather than a UI label.
          <p className={`font-serif italic font-light leading-relaxed border-l ${
            hero ? "text-xs sm:text-[13px] mt-2 pl-2.5" : "text-[11px] mt-1 pl-2"
          } ${selected
            ? "text-stone-300 dark:text-stone-600 border-stone-600 dark:border-stone-400"
            : "text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700"}`}>
            <AnnotatedText text={description} selected={selected} />
          </p>
        )}
        {count !== undefined && (
          <p className={`text-[10px] font-sans mt-auto pt-1.5 font-medium tabular-nums ${selected ? "text-stone-400 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
            {count} {count === 1 ? "cup" : "cups"}
          </p>
        )}
      </button>
      <button
        type="button"
        aria-label={favourited ? `Remove ${name} from My Picks` : `Save ${name} to My Picks`}
        aria-pressed={favourited}
        className="group/heart absolute top-0.5 right-0.5 p-2.5 touch-manipulation"
        onClick={() => {
          if (!favourited) { setBursting(true); setTimeout(() => setBursting(false), 520); }
          onToggleFavourite();
        }}
      >
        <Heart filled={favourited} bursting={bursting} />
      </button>
    </div>
  );
}

// ─── Drink row (Others flat list) ─────────────────────────────
function DrinkRow({
  name, description, selected, qty, onSelect, favourited, onToggleFavourite,
}: {
  name: string;
  description: string;
  selected: boolean;
  qty: number;
  onSelect: () => void;
  favourited: boolean;
  onToggleFavourite: () => void;
}) {
  const [bursting, setBursting] = useState(false);
  const { lang } = useLanguage();
  return (
    <div className={`flex items-center mb-0.5 rounded-xl transition-colors duration-150 ${selected ? "bg-stone-800 dark:bg-stone-200" : "hover:bg-stone-50 dark:hover:bg-stone-900 active:bg-stone-100 dark:active:bg-stone-900"}`}>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex items-center justify-between px-3 py-3 text-left touch-manipulation min-w-0"
      >
        <div className="flex flex-col gap-0.5 min-w-0 mr-2">
          <span className={`text-sm font-sans font-medium truncate ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
            {displayDrinkName(name, lang)}
            <TempIcon name={name} className="inline w-3 h-3 ml-1.5 align-middle" />
          </span>
          <span className={`text-[11px] font-sans truncate ${selected ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
            {description}
          </span>
        </div>
        {selected && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {qty > 1 && (
              <span className="text-[11px] font-sans font-medium text-stone-400 dark:text-stone-600 tabular-nums">×{qty}</span>
            )}
            <svg className="w-4 h-4 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          if (!favourited) { setBursting(true); setTimeout(() => setBursting(false), 520); }
          onToggleFavourite();
        }}
        className="group/heart px-3 py-3 touch-manipulation flex-shrink-0"
      >
        <Heart filled={favourited} bursting={bursting} />
      </button>
    </div>
  );
}

function TabLoading() {
  // Layout-shaped skeleton instead of a centred cup — keeps the My Picks
  // grid from popping in once data lands.
  return <MyPicksBentoSkeleton count={5} />;
}

// ─── Modifier row (pill buttons, one selected at a time) ─────
function ModifierRow({
  label, defaultLabel, options, selected, onChange, disabled,
}: {
  label: string;
  defaultLabel: string;
  options: { id: string; label: string }[];
  selected: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const pillCls = (active: boolean) =>
    `px-3 py-1.5 text-[11px] font-sans border rounded-full transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95] ${
      active
        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
        : "bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 shadow-sm hover:shadow-md"
    }`;
  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-30 pointer-events-none" : ""}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange("")} className={pillCls(!selected)}>
          {defaultLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(selected === opt.id ? "" : opt.id)}
            className={pillCls(selected === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Just Type — natural-language order entry ─────────────────
// User types "kopi c siu dai pneg" / "2 milo peng" / "iced coffee less sweet"
// → fuzzy matcher (src/lib/drinkSearch.ts) suggests real menu items. Tap or
// press Enter on a suggestion to add to cart. Multi-drink chunks ("3 kopi,
// 1 teh") are parsed and matched separately. No LLM, no network, no deps.
function JustTypeTab({
  cart, onAddMultiple, userFavs, onToggleFavourite,
  customDrinks, hiddenDrinks,
}: {
  cart: Map<string, number>;
  /** Adds N copies of a drink to the cart. Typing always adds, never toggles. */
  onAddMultiple: (name: string, n: number) => void;
  userFavs: Set<string>;
  onToggleFavourite: (name: string) => void;
  customDrinks: CustomDrink[];
  hiddenDrinks: Set<string>;
}) {
  const { lang } = useLanguage();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build the search catalogue from the same sources as DrinkBuilder.
  const catalogue = useMemo(() => {
    const validCatIds = new Set<string>([...DRINK_BASES.map((b) => b.id), "others"]);
    const seen = new Set<string>();
    const out: { name: string; description: string }[] = [];
    for (const cat of CATEGORIES) {
      if (!validCatIds.has(cat.id)) continue;
      for (const d of cat.drinks) {
        if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push(d); }
      }
    }
    for (const d of OTHERS_DRINKS) {
      if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push(d); }
    }
    for (const d of customDrinks) {
      if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) {
        seen.add(d.name);
        out.push({ name: d.name, description: d.description });
      }
    }
    return out;
  }, [customDrinks, hiddenDrinks]);

  // Parse the input into 1+ chunks (multi-drink), match each against the
  // catalogue. For a single chunk we surface up to 5 suggestions; for
  // multi-chunk we show one best match per chunk so the screen doesn't
  // explode with options.
  const parsedChunks = useMemo(() => parseChunks(input), [input]);
  const matchesPerChunk = useMemo(() => {
    return parsedChunks.map((chunk) => ({
      chunk,
      matches: searchDrinks(chunk.query, catalogue, parsedChunks.length === 1 ? 5 : 1),
    }));
  }, [parsedChunks, catalogue]);

  const isMulti = parsedChunks.length > 1;
  const flatMatches = matchesPerChunk.flatMap((m) => m.matches);
  // Reset keyboard focus whenever the match list changes.
  useEffect(() => { setFocused(0); }, [input]);

  function commitMatch(name: string, qty: number) {
    // Always add (never toggle). Typing the same drink twice means "two of
    // them", not "remove the one I just added".
    onAddMultiple(name, qty);
    setInput("");
    inputRef.current?.focus();
  }

  function commitAllMulti() {
    for (const { chunk, matches } of matchesPerChunk) {
      const m = matches[0];
      if (m) onAddMultiple(m.name, chunk.qty);
    }
    setInput("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isMulti) {
        commitAllMulti();
      } else if (flatMatches[focused]) {
        commitMatch(flatMatches[focused].name, parsedChunks[0]?.qty ?? 1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, Math.max(flatMatches.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, 0));
    }
  }

  const trimmed = input.trim();

  return (
    <div style={{ animation: "tabIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both" }} className="flex flex-col gap-4">
      <div>
        <label htmlFor="just-type-input" className="text-[10px] uppercase tracking-[0.22em] font-sans font-medium text-stone-400 dark:text-stone-500 mb-2 block">
          Type your order
        </label>
        <input
          id="just-type-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Try: kopi c siew dai peng"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-transparent border-0 border-b border-stone-300 dark:border-stone-600 focus:border-stone-700 dark:focus:border-stone-300 focus:outline-none text-stone-800 dark:text-stone-100 font-serif text-xl sm:text-2xl font-light tracking-wide placeholder:text-stone-300 dark:placeholder:text-stone-600 py-3 transition-colors duration-200"
        />
      </div>

      {/* Multi-drink summary card */}
      {trimmed && isMulti && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#111] p-4 flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-[0.22em] font-sans text-stone-400 dark:text-stone-500">
            {matchesPerChunk.length} drinks parsed
          </p>
          <div className="flex flex-col gap-2">
            {matchesPerChunk.map(({ chunk, matches }, i) => {
              const m = matches[0];
              return (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 tabular-nums w-6 text-right flex-shrink-0">
                    × {chunk.qty}
                  </span>
                  {m ? (
                    <>
                      <span className="font-serif text-base font-light tracking-wide text-stone-800 dark:text-stone-100 truncate">
                        {displayDrinkName(m.name, lang)}
                      </span>
                      <TempIcon name={m.name} className="w-3 h-3 flex-shrink-0" />
                    </>
                  ) : (
                    <span className="font-serif italic font-light text-stone-400 dark:text-stone-500 text-sm truncate">
                      &ldquo;{chunk.query}&rdquo; — no match
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={commitAllMulti}
            disabled={matchesPerChunk.every((m) => !m.matches[0])}
            className="self-end px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95] shadow-sm hover:shadow-md bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add all to cart
          </button>
        </div>
      )}

      {/* Single-drink suggestion list */}
      {trimmed && !isMulti && flatMatches.length > 0 && (
        <div className="flex flex-col gap-1.5" role="listbox" aria-label="Drink suggestions">
          <p className="text-[10px] uppercase tracking-[0.22em] font-sans text-stone-400 dark:text-stone-500 mb-1">
            {parsedChunks[0]?.qty && parsedChunks[0].qty > 1
              ? `Adding × ${parsedChunks[0].qty} of`
              : "Did you mean"}
          </p>
          {flatMatches.map((m, i) => (
            <button
              key={m.name}
              type="button"
              onClick={() => commitMatch(m.name, parsedChunks[0]?.qty ?? 1)}
              onMouseEnter={() => setFocused(i)}
              role="option"
              aria-selected={focused === i}
              className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ease-spring touch-manipulation active:scale-[0.98] ${
                focused === i
                  ? "bg-stone-50 dark:bg-stone-900 border-stone-400 dark:border-stone-500 shadow-md"
                  : "bg-white dark:bg-[#111] border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 shadow-sm"
              }`}
            >
              <TempIcon name={m.name} className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base sm:text-lg font-light tracking-wide text-stone-800 dark:text-stone-100 leading-snug truncate">
                  {displayDrinkName(m.name, lang)}
                </p>
                {m.description && (
                  <p className="text-[11px] font-serif italic font-light text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                    {m.description}
                  </p>
                )}
              </div>
              <span
                onClick={(e) => { e.stopPropagation(); onToggleFavourite(m.name); }}
                className="flex-shrink-0 p-1.5 -mr-1 cursor-pointer touch-manipulation"
                role="button"
                aria-label={userFavs.has(m.name) ? `Remove ${m.name} from My Picks` : `Save ${m.name} to My Picks`}
              >
                <Heart filled={userFavs.has(m.name)} />
              </span>
              {cart.has(m.name) && (
                <span className="text-[10px] uppercase tracking-[0.15em] font-sans font-medium text-stone-400 dark:text-stone-500 flex-shrink-0">
                  in cart · {cart.get(m.name)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No match */}
      {trimmed && !isMulti && flatMatches.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
          <p className="font-serif text-base font-light italic text-stone-500 dark:text-stone-400">
            Couldn&rsquo;t place that.
          </p>
          <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500">
            Try a kopitiam term — &ldquo;kopi c peng&rdquo;, &ldquo;teh tarik&rdquo;, &ldquo;milo dinosaur&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Drink builder (replaces "All Drinks" flat list) ──────────
function DrinkBuilder({
  cart, onToggleCart, userFavs, onToggleFavourite, customDrinks, hiddenDrinks, onComposedNameChange,
}: {
  cart: Map<string, number>;
  onToggleCart: (name: string) => void;
  userFavs: Set<string>;
  onToggleFavourite: (name: string) => void;
  customDrinks: CustomDrink[];
  hiddenDrinks: Set<string>;
  onComposedNameChange: (name: string) => void;
}) {
  const { lang } = useLanguage();
  const [baseId, setBaseId] = useState<string | null>(null);
  const [milk, setMilk] = useState("");
  const [strength, setStrength] = useState("");
  const [sweetness, setSweetness] = useState("");
  const [temp, setTemp] = useState("");
  const [special, setSpecial] = useState("");

  const base = DRINK_BASES.find((b) => b.id === baseId) ?? null;

  // Reset modifiers when base changes
  useEffect(() => {
    setMilk(""); setStrength(""); setSweetness(""); setTemp(""); setSpecial("");
  }, [baseId]);

  const allSpecials = useMemo(() => {
    if (!base) return [];
    const custom = customDrinks
      .filter((cd) => cd.category_id === base.id && !hiddenDrinks.has(cd.name))
      .map<DrinkSpecial>((cd) => ({ label: cd.name, fullName: cd.name }));
    return [...base.specials, ...custom];
  }, [base, customDrinks, hiddenDrinks]);

  const composedName = useMemo(() => {
    if (!base) return "";
    if (special) {
      const sp = allSpecials.find((s) => s.label === special);
      return sp?.fullName ?? `${base.label} ${special}`;
    }
    const parts = [base.label];
    if (milk) parts.push(milk);
    if (strength) parts.push(strength);
    if (sweetness) parts.push(sweetness);
    if (temp) parts.push(temp);
    return parts.join(" ");
  }, [base, milk, strength, sweetness, temp, special, allSpecials]);

  useEffect(() => {
    onComposedNameChange(composedName);
  }, [composedName, onComposedNameChange]);

  const othersAll = useMemo(() => {
    const custom = customDrinks
      .filter((cd) => cd.category_id === "others" && !hiddenDrinks.has(cd.name))
      .map((cd) => ({ name: cd.name, description: cd.description }));
    return [
      ...OTHERS_DRINKS.filter((d) => !hiddenDrinks.has(d.name)),
      ...custom,
    ];
  }, [customDrinks, hiddenDrinks]);

  const baseChipCls = (active: boolean) =>
    `px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95] ${
      active
        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
        : "bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500 shadow-sm hover:shadow-md"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Base selector */}
      <div className="flex flex-wrap gap-2">
        {DRINK_BASES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setBaseId(baseId === b.id ? null : b.id)}
            className={baseChipCls(baseId === b.id)}
          >
            {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setBaseId(baseId === "others" ? null : "others")}
          className={baseChipCls(baseId === "others")}
        >
          Others
        </button>
      </div>

      {/* Others flat list */}
      {baseId === "others" && (
        <div className="border-t border-stone-100 dark:border-stone-800">
          {othersAll.length === 0 ? (
            <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 py-8 text-center">Nothing here.</p>
          ) : othersAll.map((drink) => (
            <DrinkRow
              key={drink.name}
              name={drink.name}
              description={drink.description}
              selected={cart.has(drink.name)}
              qty={cart.get(drink.name) ?? 0}
              onSelect={() => onToggleCart(drink.name)}
              favourited={userFavs.has(drink.name)}
              onToggleFavourite={() => onToggleFavourite(drink.name)}
            />
          ))}
        </div>
      )}

      {/* Builder modifiers */}
      {base && (
        <div className="flex flex-col gap-5">
          {base.temp.length > 0 && (
            <ModifierRow
              label="Temp"
              defaultLabel="Hot"
              options={base.temp.map((t) => ({ id: t, label: translateModifier(t, lang) }))}
              selected={temp}
              onChange={setTemp}
              disabled={!!special}
            />
          )}
          {base.milk.length > 0 && (
            <ModifierRow
              label="Milk"
              defaultLabel="Condensed"
              options={base.milk.map((m) => ({ id: m, label: m === "O" ? "O · Black" : "C · Evap" }))}
              selected={milk}
              onChange={setMilk}
              disabled={!!special}
            />
          )}
          <ModifierRow
            label="Sweetness"
            defaultLabel="Normal"
            options={base.sweetness.map((s) => ({ id: s, label: translateModifier(s, lang) }))}
            selected={sweetness}
            onChange={setSweetness}
            disabled={!!special}
          />
          {base.strength.length > 0 && (
            <ModifierRow
              label="Strength"
              defaultLabel="Normal"
              options={base.strength.map((s) => ({ id: s, label: translateModifier(s, lang) }))}
              selected={strength}
              onChange={setStrength}
              disabled={!!special}
            />
          )}

          {allSpecials.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">Specials</p>
              <div className="flex flex-wrap gap-1.5">
                {allSpecials.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => setSpecial(special === sp.label ? "" : sp.label)}
                    className={`px-3 py-1.5 text-[11px] font-sans border rounded-full transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95] ${
                      special === sp.label
                        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
                        : "bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {translateModifier(sp.label, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}


// ─── Active order countdown ───────────────────────────────────
function ActiveCountdown({ sessionStart }: { sessionStart: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = sessionStart.getTime() + SESSION_MS - now;
  if (remaining <= 0) return null;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const colour = remaining < 2 * 60000
    ? "text-red-400 dark:text-red-500"
    : remaining < 5 * 60000
    ? "text-amber-400 dark:text-amber-500"
    : "text-stone-400 dark:text-stone-500";
  return (
    <span className={`text-[10px] uppercase tracking-[0.2em] font-sans tabular-nums ${colour}`}>
      {mins > 0 ? `${mins}m ${secs}s left` : `${secs}s left`}
    </span>
  );
}

// ─── Success toast ────────────────────────────────────────────

function SuccessToast({ items, orderedAt, onDismiss }: {
  items: CartItem[];
  orderedAt: Date;
  onDismiss: () => void;
}) {
  const [width, setWidth] = useState(100);
  const cbRef = useRef(onDismiss);
  cbRef.current = onDismiss;
  const { lang } = useLanguage();

  useEffect(() => {
    const DURATION = 5000;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const pct = Math.max(0, 100 * (1 - (now - start) / DURATION));
      setWidth(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
      else cbRef.current();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const time = formatTime(orderedAt);
  const drinkLine = items.map(({ name, qty }) => {
    const display = displayDrinkName(name, lang);
    return qty > 1 ? `${display} ×${qty}` : display;
  }).join(" · ");

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto" style={{ animation: "toastSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
        <div className="rounded-2xl bg-[#FAFAF8]/95 dark:bg-[#111]/95 backdrop-blur-xl border border-stone-200 dark:border-stone-700/60 shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden">
          <div className="px-4 pt-3.5 pb-3 flex items-center gap-3">
            {/* Check */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-400 dark:text-stone-500">Order placed</p>
                <span className="text-[10px] font-sans text-stone-300 dark:text-stone-600 tabular-nums">{time}</span>
              </div>
              <p className="text-sm font-sans font-medium text-stone-700 dark:text-stone-200 truncate">{drinkLine}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Link
                href="/orders"
                className="text-[11px] uppercase tracking-[0.15em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-full hover:border-stone-400 dark:hover:border-stone-500 transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95]"
              >
                View
              </Link>
              <button type="button" onClick={onDismiss} aria-label="Dismiss" className="w-9 h-9 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 touch-manipulation transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {/* Draining progress bar */}
          <div className="h-0.5 bg-stone-100 dark:bg-stone-800">
            <div className="h-full bg-stone-300 dark:bg-stone-600" style={{ width: `${width}%`, transition: "none" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main order content ───────────────────────────────────────
function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";
  const { lang, setLang } = useLanguage();

  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [tab, setTab] = useState<Tab>("yours");
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [userFavs, setUserFavs] = useState<Set<string>>(new Set());
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [hiddenDrinks, setHiddenDrinks] = useState<Set<string>>(new Set());
  const [loadingFavs, setLoadingFavs] = useState(true);
  // Skeleton only renders if loading hasn't finished within 200ms — fast
  // fetches go straight to content without a flash of placeholder.
  const showSkeleton = useDelayed(200);
  const [lastOrder, setLastOrder] = useState<{ name: string; qty: number }[] | null>(null);
  const [builderDrink, setBuilderDrink] = useState("");
  const [existingOrder, setExistingOrder] = useState<{ id: string; items: CartItem[]; sessionStart: Date } | null>(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [surprise, setSurprise] = useState<"idle" | "picking" | string>("idle");
  const [rouletteName, setRouletteName] = useState("");
  const [rouletteIdx, setRouletteIdx] = useState(0);
  const [presentUsers, setPresentUsers] = useState<string[]>([]);
  const editingOrderId = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [headerCompact, setHeaderCompact] = useState(false);

  // Description lookup for display on drink cards (pre-defined + custom)
  const DRINKS_MAP = useMemo(() => {
    const map = new Map(BASE_DRINKS_MAP);
    for (const d of customDrinks) map.set(d.name, { name: d.name, description: d.description });
    return map;
  }, [customDrinks]);

  // Full drink pool for Surprise Me — only categories that match a real
  // builder base (DRINK_BASES) plus "others". Keeps unreachable categories
  // (e.g. legacy "bandung" entries that aren't a base) out of the random pool.
  const allDrinksPool = useMemo(() => {
    const validCatIds = new Set<string>([...DRINK_BASES.map((b) => b.id), "others"]);
    const seen = new Set<string>();
    const out: { name: string; description: string }[] = [];
    for (const cat of CATEGORIES) {
      if (!validCatIds.has(cat.id)) continue;
      for (const d of cat.drinks) {
        if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push(d); }
      }
    }
    for (const d of OTHERS_DRINKS) {
      if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push(d); }
    }
    for (const d of customDrinks) {
      if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push({ name: d.name, description: d.description }); }
    }
    return out;
  }, [customDrinks, hiddenDrinks]);

  useEffect(() => {
    if (!isConfigured) {
      setLoadingFavs(false);
      return;
    }
    let cancelled = false;
    const sessionWindowStart = new Date(Date.now() - SESSION_MS).toISOString();
    Promise.all([
      supabase.from("user_favourites").select("drink_name").eq("person_name", name),
      supabase.from("custom_drinks").select("*"),
      supabase.from("hidden_drinks").select("drink_name"),
      supabase.from("orders").select("id, items, created_at").eq("person_name", name).order("created_at", { ascending: false }),
    ]).then(([favs, custom, hidden, userOrders]) => {
      if (cancelled) return;
      if (favs.data) setUserFavs(new Set(favs.data.map((d: { drink_name: string }) => d.drink_name)));
      if (custom.data) setCustomDrinks(custom.data as CustomDrink[]);
      if (hidden.data) setHiddenDrinks(new Set(hidden.data.map((h: { drink_name: string }) => h.drink_name)));
      if (userOrders.data && userOrders.data.length > 0) {
        type Row = { id: string; items: { name: string }[]; created_at: string };
        const sessionOrders = (userOrders.data as Row[]).filter((o) => o.created_at >= sessionWindowStart);
        if (sessionOrders.length > 0) {
          const counts = new Map<string, number>();
          for (const order of sessionOrders)
            for (const item of order.items) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
          const oldest = sessionOrders[sessionOrders.length - 1];
          setExistingOrder({ id: oldest.id, sessionStart: new Date(oldest.created_at), items: [...counts.entries()].map(([n, qty]) => ({ name: n, qty })) });
        } else {
          const prev = userOrders.data[0] as Row;
          const counts = new Map<string, number>();
          for (const item of prev.items) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
          setLastOrder([...counts.entries()].map(([n, qty]) => ({ name: n, qty })));
        }
      }
      setLoadingFavs(false);
    }).catch(() => {
      // Network/Supabase failure — clear loaders so UI doesn't freeze.
      // Empty state renders gracefully (no favs, no existing order).
      if (cancelled) return;
      setLoadingFavs(false);
    });
    return () => { cancelled = true; };
  }, [name]);

  // Hide the active order card when the session window closes.
  // The order stays in history — we just stop showing it as actionable.
  useEffect(() => {
    if (!existingOrder) return;
    const remaining = existingOrder.sessionStart.getTime() + SESSION_MS - Date.now();
    if (remaining <= 0) { setExistingOrder(null); return; }
    const t = setTimeout(() => {
      setExistingOrder(null);
      setSessionClosed(true);
      setTimeout(() => setSessionClosed(false), 4000);
    }, remaining);
    return () => clearTimeout(t);
  }, [existingOrder]);

  // Realtime presence — show who else is on the order page right now
  useEffect(() => {
    if (!isConfigured || name === "there") return;
    const channel = supabase.channel("ordering-presence");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string }>();
        const others = (Object.values(state) as { name: string }[][])
          .flat()
          .map((p) => p.name)
          .filter((n) => n !== name);
        setPresentUsers([...new Set(others)]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ name });
      });
    return () => { channel.untrack(); supabase.removeChannel(channel); };
  }, [name]);

  // Apply this user's admin-set default language on every /order visit, so
  // a cached returning user picks up admin changes without going through
  // the name selector. Silent on failure — keeps whatever lang is current.
  useEffect(() => {
    if (!isConfigured || name === "there") return;
    let cancelled = false;
    supabase.from("members").select("default_lang").eq("name", name).maybeSingle()
      .then(
        ({ data }) => {
          if (cancelled) return;
          const v = (data as { default_lang?: string } | null)?.default_lang;
          if (v === "en" || v === "sin") setLang(v);
        },
        () => { /* silent — keep existing lang */ },
      );
    return () => { cancelled = true; };
  }, [name, setLang]);

  // Restore in-progress cart from previous visit (same user, fresh enough)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CART_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { name: string; cart: [string, number][]; savedAt: number };
      const tooOld = Date.now() - (parsed.savedAt ?? 0) > CART_DRAFT_TTL_MS;
      const wrongUser = parsed.name !== name;
      if (tooOld || wrongUser) {
        if (tooOld) localStorage.removeItem(CART_DRAFT_KEY);
        return;
      }
      if (Array.isArray(parsed.cart) && parsed.cart.length > 0) {
        setCart(new Map(parsed.cart));
      }
    } catch {
      try { localStorage.removeItem(CART_DRAFT_KEY); } catch {}
    }
  }, [name]);

  // Persist cart to localStorage on every change. Empty cart clears the draft.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (cart.size === 0) {
        localStorage.removeItem(CART_DRAFT_KEY);
      } else {
        localStorage.setItem(CART_DRAFT_KEY, JSON.stringify({
          name,
          cart: [...cart.entries()],
          savedAt: Date.now(),
        }));
      }
    } catch {}
  }, [cart, name]);

  // Header compression via IntersectionObserver on a sentinel at top of content
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setHeaderCompact(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function toggleCart(drinkName: string) {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(drinkName)) {
        next.delete(drinkName);
        haptic(4);
      } else {
        next.set(drinkName, 1);
        haptic(8);
      }
      return next;
    });
  }

  /** Adds N copies of a drink to the cart in one call — Just Type uses
      this to convert "2 kopi c" into a cart entry of qty 2. */
  function addToCart(drinkName: string, n: number) {
    if (n <= 0) return;
    haptic(8);
    setCart((prev) => {
      const next = new Map(prev);
      next.set(drinkName, (next.get(drinkName) ?? 0) + n);
      return next;
    });
  }

  function incrementCart(drinkName: string) {
    haptic(8);
    setCart((prev) => {
      const next = new Map(prev);
      next.set(drinkName, (next.get(drinkName) ?? 0) + 1);
      return next;
    });
  }

  function decrementCart(drinkName: string) {
    haptic(4);
    setCart((prev) => {
      const next = new Map(prev);
      const qty = (next.get(drinkName) ?? 1) - 1;
      if (qty <= 0) {
        next.delete(drinkName);
      } else {
        next.set(drinkName, qty);
      }
      return next;
    });
  }

  async function toggleFavourite(drinkName: string) {
    if (!isConfigured) return;
    const isFav = userFavs.has(drinkName);
    // Optimistic update
    setUserFavs((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(drinkName) : next.add(drinkName);
      return next;
    });
    const { error } = isFav
      ? await supabase.from("user_favourites").delete().eq("person_name", name).eq("drink_name", drinkName)
      : await supabase.from("user_favourites").insert({ person_name: name, drink_name: drinkName });
    // Roll back if the write failed (offline, RLS, etc.) so the heart matches reality
    if (error) {
      setUserFavs((prev) => {
        const next = new Set(prev);
        isFav ? next.add(drinkName) : next.delete(drinkName);
        return next;
      });
    }
  }

  function handleSurprise() {
    if (allDrinksPool.length === 0 || surprise === "picking") return;
    setSurprise("picking");
    // Staggered delays that ease out — gives a slot-machine deceleration feel
    const DELAYS = [70, 90, 120, 160, 220, 300];
    let elapsed = 0;
    DELAYS.forEach((delay, i) => {
      elapsed += delay;
      const isFinal = i === DELAYS.length - 1;
      const at = elapsed;
      setTimeout(() => {
        const pick = allDrinksPool[Math.floor(Math.random() * allDrinksPool.length)];
        setRouletteName(pick.name);
        setRouletteIdx((n) => n + 1);
        if (isFinal) {
          setCart((prev) => {
            const next = new Map(prev);
            next.set(pick.name, (next.get(pick.name) ?? 0) + 1);
            return next;
          });
          haptic([5, 30, 5, 30, 10]);
          setSurprise(pick.name);
          setTimeout(() => setSurprise("idle"), 2500);
        }
      }, at);
    });
  }

  async function cancelOrder() {
    if (!existingOrder) return;
    haptic([8, 60, 8]);
    const sessionWindowStart = new Date(Date.now() - SESSION_MS).toISOString();
    await supabase.from("orders").delete().eq("person_name", name).gte("created_at", sessionWindowStart);
    setExistingOrder(null);
  }

  async function placeOrder() {
    if (cart.size === 0) return;
    setOrderState("loading");
    const orderedAt = new Date();
    const newItems = [...cart.entries()].flatMap(([drinkName, qty]) => {
      const drink = DRINKS_MAP.get(drinkName) ?? { name: drinkName, description: "" };
      return Array(qty).fill({ name: drink.name, description: drink.description });
    });
    // If not editing (Edit button not clicked) and there's an existing active order,
    // merge the new items on top of the existing ones rather than replacing.
    const existingItems = !isEditing && existingOrder
      ? existingOrder.items.flatMap(({ name: n, qty }) => {
          const drink = DRINKS_MAP.get(n) ?? { name: n, description: "" };
          return Array(qty).fill({ name: drink.name, description: drink.description });
        })
      : [];
    const finalItems = [...existingItems, ...newItems];
    try {
      // Delete all of this user's orders in the current session window before inserting,
      // so there's always exactly one order row per user per session.
      const sessionWindowStart = new Date(Date.now() - SESSION_MS).toISOString();
      await supabase.from("orders").delete().eq("person_name", name).gte("created_at", sessionWindowStart);
      editingOrderId.current = null;
      const { error } = await supabase.from("orders").insert({
        order_ref: generateOrderRef(),
        person_name: name,
        items: finalItems,
      });
      if (error) throw error;
      // Find session start: earliest order placed within the current session window
      const windowStart = new Date(orderedAt.getTime() - SESSION_MS).toISOString();
      const { data: sessionData } = await supabase
        .from("orders")
        .select("created_at")
        .gte("created_at", windowStart)
        .order("created_at", { ascending: true })
        .limit(1);
      const sessionStart = sessionData?.[0] ? new Date(sessionData[0].created_at) : orderedAt;
      const mergedCounts = new Map<string, number>();
      for (const item of finalItems) mergedCounts.set(item.name, (mergedCounts.get(item.name) ?? 0) + 1);
      const cartItems: CartItem[] = [...mergedCounts.entries()].map(([n, qty]) => ({ name: n, qty }));
      haptic([10, 40, 10]);
      setCart(new Map());
      setBuilderDrink("");
      setIsEditing(false);
      setOrderState({ orderedAt, sessionStart, items: cartItems });
    } catch {
      setOrderState("error");
    }
  }

  const handleToastDismiss = useCallback(async () => {
    setOrderState("idle");
    if (!isConfigured) return;
    const sessionWindowStart = new Date(Date.now() - SESSION_MS).toISOString();
    const { data } = await supabase
      .from("orders")
      .select("id, items, created_at")
      .eq("person_name", name)
      .gte("created_at", sessionWindowStart)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      type Row = { id: string; items: { name: string }[]; created_at: string };
      const counts = new Map<string, number>();
      for (const order of data as Row[])
        for (const item of order.items) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
      const oldest = (data as Row[])[data.length - 1];
      setExistingOrder({
        id: oldest.id,
        sessionStart: new Date(oldest.created_at),
        items: [...counts.entries()].map(([n, qty]) => ({ name: n, qty })),
      });
    }
  }, [name]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "yours", label: "My Picks" },
    { id: "all",   label: "All Drinks" },
  ];
  const tabIndex = TABS.findIndex((t) => t.id === tab);

  const cartEntries = [...cart.entries()];
  const totalDrinks = cartEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />

      {/* Sticky header + tabs block */}
      <div className="liquid-glass-top sticky top-0 z-30 bg-[#FAFAF8]/80 dark:bg-black/75">
        {/* Greeting */}
        <div className="px-5 sm:px-8 pt-16 sm:pt-10 pb-4">
          <div className="max-w-lg mx-auto">
            <h1 className={`font-serif font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight transition-all duration-300 ${headerCompact ? "text-lg sm:text-xl" : "text-[2.4rem] sm:text-[3rem]"}`}>
              Hello, {name}
            </h1>
            <p className={`font-serif font-light italic text-stone-400 dark:text-stone-500 overflow-hidden transition-all duration-300 ${headerCompact ? "opacity-0 max-h-0 mt-0" : "text-base sm:text-lg opacity-100 max-h-16 mt-1.5"}`}>
              What would you like today?
            </p>
            {presentUsers.length > 0 && (
              <div className="flex items-center gap-2 mt-2.5" style={{ animation: "pageIn 0.35s ease-out both" }}>
                <div className="flex items-center -space-x-1">
                  {presentUsers.slice(0, 5).map((user) => (
                    <span
                      key={user}
                      title={user}
                      className="relative w-[22px] h-[22px] rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[8px] font-sans font-semibold text-stone-500 dark:text-stone-400 shadow-sm"
                      style={{ animation: "pageIn 0.3s ease-out both" }}
                    >
                      {getInitials(user)}
                      <span className="absolute bottom-[-1px] right-[-1px] w-[6px] h-[6px] rounded-full bg-green-400 border border-white dark:border-black" />
                    </span>
                  ))}
                  {presentUsers.length > 5 && (
                    <span className="w-[22px] h-[22px] rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[8px] font-sans font-semibold text-stone-400 dark:text-stone-500">
                      +{presentUsers.length - 5}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-sans text-stone-400 dark:text-stone-500">
                  {presenceCopy(presentUsers)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-8 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto">
            {/* Newsprint tabs — top + bottom black rules, sliding ink-fill
                pill underneath that's square (no rounding) and shadowless.
                Active label flips italic + cream/black. Inactive labels
                stay tracked-uppercase since they're UI chrome. */}
            <div className="relative flex border-y-2 border-stone-900 dark:border-stone-100">
              <div
                className="absolute top-0 bottom-0 bg-stone-900 dark:bg-stone-100 pointer-events-none"
                style={{
                  width: `calc(100% / ${TABS.length})`,
                  transform: `translateX(${tabIndex * 100}%)`,
                  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); if (t.id !== "all") setBuilderDrink(""); }}
                  className={`
                    relative z-10 flex-1 py-2.5 text-center text-[11px] uppercase tracking-[0.2em]
                    font-sans font-medium transition-colors duration-200 touch-manipulation whitespace-nowrap
                    ${tab === t.id
                      ? "text-cream dark:text-stone-900"
                      : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"}
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 sm:px-8 pt-5 ${cart.size > 0 || builderDrink ? "pb-64" : "pb-12"}`}>
        <div className="max-w-lg mx-auto">
          <div ref={sentinelRef} className="h-px" aria-hidden />

          {/* Active order card — only shown while the session window is open */}
          {existingOrder && !isEditing && (
            <div className="relative mb-5">
              <div
                className="absolute inset-0 rounded-2xl border border-stone-400 dark:border-stone-500 pointer-events-none"
                style={{ animation: "cardBreathe 4s ease-in-out infinite" }}
              />
              <div className="rounded-2xl bg-[#FAFAF8]/95 dark:bg-[#111]/95 backdrop-blur-xl border border-stone-200 dark:border-stone-700/60 shadow-2xl shadow-black/10 dark:shadow-black/50 px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">
                      Active order
                    </p>
                    <ActiveCountdown sessionStart={existingOrder.sessionStart} />
                  </div>
                  <p className="text-sm font-sans text-stone-600 dark:text-stone-400 truncate">
                    {existingOrder.items.map(({ name: n, qty }) => `${displayDrinkName(n, lang)}${qty > 1 ? ` ×${qty}` : ""}`).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={cancelOrder}
                    className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-red-400 dark:text-red-300 border border-red-200 dark:border-red-800 dark:bg-red-950 px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editingOrderId.current = existingOrder.id;
                      setCart(new Map(existingOrder.items.map(({ name: n, qty }) => [n, qty])));
                      setIsEditing(true);
                      setExistingOrder(null);
                    }}
                    className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-stone-500 dark:text-stone-200 border border-stone-200 dark:border-stone-600 dark:bg-stone-800 px-3 py-1.5 rounded-full hover:border-stone-500 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-white transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95]"
                  >
                    Edit
                  </button>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Session closed notice */}
          {sessionClosed && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 animate-fade-in">
              <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-[11px] uppercase tracking-[0.2em] font-sans text-stone-400 dark:text-stone-500">
                Session closed — your order is saved
              </p>
            </div>
          )}

          {/* MY PICKS */}
          {tab === "yours" && (
            <div style={{ animation: "tabIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
              {/* Just Type — fast natural-language entry at the top of My
                  Picks. Sits above the saved picks so a regular ("kopi c
                  peng") goes in two taps without ever needing to scroll. */}
              <div className="mb-5 pb-5 border-b border-stone-100 dark:border-stone-800">
                <JustTypeTab
                  cart={cart}
                  onAddMultiple={addToCart}
                  userFavs={userFavs}
                  onToggleFavourite={toggleFavourite}
                  customDrinks={customDrinks}
                  hiddenDrinks={hiddenDrinks}
                />
              </div>
              {loadingFavs && showSkeleton && <TabLoading />}
              {!loadingFavs && lastOrder && lastOrder.length > 0 && (
                <div className="mb-5 pb-5 border-b border-stone-100 dark:border-stone-800">
                  <div className="rounded-xl border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#111] p-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">Last order</p>
                      <button
                        type="button"
                        onClick={() => setCart(new Map(lastOrder.map(({ name: n, qty }) => [n, qty])))}
                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-sans font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-full hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-all duration-200 touch-manipulation shadow-sm hover:shadow-md active:scale-[0.95]"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-order
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {lastOrder.map(({ name: n, qty }) => (
                        <div key={n} className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="inline-block w-[7px] h-[7px] rounded-full flex-shrink-0"
                            style={{ backgroundColor: drinkColor(n) }}
                          />
                          <span className="font-serif text-[15px] font-light tracking-wide text-stone-800 dark:text-stone-100 leading-snug">
                            {displayDrinkName(n, lang)}
                            <TempIcon name={n} className="inline w-3 h-3 ml-1.5 align-middle" />
                            <CupGlyph qty={qty} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!loadingFavs && userFavs.size === 0 && (
                // Settled empty state (E18) — mirrors the /orders treatment:
                // small cup outline + serif italic line + tracked-uppercase
                // sub-label. Consistent voice across every empty surface.
                <div className="flex flex-col items-center gap-4 py-16">
                  <svg viewBox="0 0 64 64" width="40" height="40" className="text-stone-300 dark:text-stone-700" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                    <path d="M16 26 L20 50 Q21 54 25 54 L39 54 Q43 54 44 50 L48 26 Z" strokeLinejoin="round" />
                    <path d="M44 34 Q54 34 54 41 Q54 48 44 48" strokeLinecap="round" />
                    <path d="M12 56 Q32 61 52 56" strokeLinecap="round" opacity="0.6" />
                    <path d="M28 18 L32 12 L36 18" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  </svg>
                  <div className="flex flex-col items-center gap-1.5 px-8">
                    <p className="font-serif text-base font-light italic text-stone-500 dark:text-stone-400 text-center">
                      Save the ones you like.
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.22em] font-sans text-stone-400 dark:text-stone-500">
                      Tap ♡ on any drink
                    </p>
                  </div>
                </div>
              )}
              {!loadingFavs && userFavs.size > 0 && (
                // Bento layout. Mobile keeps a 2-col grid (preserves the
                // comfortable density small tiles used to have); ≥sm
                // expands to 4 cols so the first pick (when 3+ saved)
                // can take a 2x2 hero slot beside the smaller tiles.
                // grid-auto-flow:dense fills any gaps the hero leaves.
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5"
                  style={{ gridAutoFlow: "dense" }}
                >
                  {[...userFavs].map((drinkName, index) => {
                    const drink = DRINKS_MAP.get(drinkName);
                    const promoteHero = userFavs.size >= 3 && index === 0;
                    const span = promoteHero
                      ? "col-span-2 sm:row-span-2"
                      : "col-span-1 sm:col-span-2";
                    return (
                      <div key={drinkName} className={span}>
                        <DrinkCard
                          name={drinkName}
                          description={drink?.description ?? synthesiseDescription(drinkName)}
                          selected={cart.has(drinkName)}
                          qty={cart.get(drinkName) ?? 0}
                          onSelect={() => toggleCart(drinkName)}
                          favourited={true}
                          onToggleFavourite={() => toggleFavourite(drinkName)}
                          enterDelay={index * 35}
                          hero={promoteHero}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Surprise Me */}
              {!loadingFavs && (
                <div className={userFavs.size > 0 || (lastOrder && lastOrder.length > 0) ? "border-t border-stone-100 dark:border-stone-800 pt-4" : ""}>
                  <button
                    type="button"
                    onClick={handleSurprise}
                    disabled={surprise === "picking"}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed transition-all duration-200 ease-spring touch-manipulation active:scale-[0.98] ${
                      surprise !== "idle" && surprise !== "picking"
                        ? "border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900"
                        : "border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"
                      className={`flex-shrink-0 text-stone-400 dark:text-stone-500 transition-transform ${surprise === "picking" ? "animate-spin" : ""}`}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="3.5" strokeLinejoin="round" />
                      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
                      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                    <div className="flex-1 min-w-0 text-left">
                      {surprise === "idle" && (
                        <p className="text-sm font-sans text-stone-500 dark:text-stone-400">Surprise me</p>
                      )}
                      {surprise === "picking" && (
                        <p
                          key={rouletteIdx}
                          className="text-sm font-sans font-medium text-stone-700 dark:text-stone-200 truncate"
                          style={{ animation: "pageIn 0.07s ease-out both" }}
                        >
                          {rouletteName ? displayDrinkName(rouletteName, lang) : "…"}
                        </p>
                      )}
                      {surprise !== "idle" && surprise !== "picking" && (
                        <>
                          <p className="text-sm font-sans font-medium text-stone-700 dark:text-stone-200 truncate">{displayDrinkName(surprise, lang)}</p>
                          <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500">Added to cart</p>
                        </>
                      )}
                    </div>
                    {surprise === "idle" && (
                      <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-300 dark:text-stone-600 flex-shrink-0">Try it</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ALL DRINKS — builder */}
          {tab === "all" && (
            <div style={{ animation: "tabIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
              <DrinkBuilder
                cart={cart}
                onToggleCart={toggleCart}
                userFavs={userFavs}
                onToggleFavourite={toggleFavourite}
                customDrinks={customDrinks}
                hiddenDrinks={hiddenDrinks}
                onComposedNameChange={setBuilderDrink}
              />
            </div>
          )}


        </div>
      </div>

      {/* Newsprint cart strip — no more rounded dock. A flat panel pinned
          to the bottom edge with a 3px black rule on top, like a footer
          block on a broadsheet's back page. Subtle backdrop blur stays
          so content scrolls behind it. */}
      {(cart.size > 0 || builderDrink) && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="border-t-[3px] border-stone-900 dark:border-stone-100 bg-cream/95 dark:bg-black/95 backdrop-blur-xl">
            <div className="max-w-lg mx-auto px-4 sm:px-6 pt-3.5 pb-5 flex flex-col gap-2.5">

            {/* Builder preview row */}
            {builderDrink && (
              <div className={`flex items-center justify-between gap-3 ${cart.size > 0 ? "pb-2.5 border-b border-stone-100 dark:border-stone-800" : ""}`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <p className="font-serif text-base sm:text-lg font-light tracking-wide text-stone-800 dark:text-stone-100 leading-snug line-clamp-2 break-words min-w-0">
                    {displayDrinkName(builderDrink, lang)}
                  </p>
                  {/* Lifted out of the <p> so the flex row's items-center
                      keeps icon, heart, and text on the same axis instead of
                      inline-relative-to-x-height. */}
                  <TempIcon name={builderDrink} className="w-4 h-4 flex-shrink-0" />
                  <button type="button" onClick={() => toggleFavourite(builderDrink)} className="group/heart flex-shrink-0 p-2 -mr-1 touch-manipulation">
                    <Heart filled={userFavs.has(builderDrink)} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCart(builderDrink)}
                  className={`flex-shrink-0 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95] shadow-sm hover:shadow-md ${
                    cart.has(builderDrink)
                      ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                      : "text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-stone-600 dark:hover:border-stone-400"
                  }`}
                >
                  {cart.has(builderDrink) ? `In cart · ${cart.get(builderDrink)}` : "+ Add"}
                </button>
              </div>
            )}

            {cart.size > 0 && (<>
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400 dark:text-stone-500">Your order</p>
              <button
                type="button"
                onClick={() => setCart(new Map())}
                className="text-[10px] font-sans text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors touch-manipulation"
              >
                Clear
              </button>
            </div>
            {cartEntries.map(([drinkName, qty]) => (
              <div key={drinkName} className="flex items-center gap-3">
                {/* C9: drink name in serif within the cart too, so the
                    list reads like a menu rather than a sans-serif tally. */}
                <p className="flex-1 min-w-0 font-serif text-[15px] font-light tracking-wide text-stone-800 dark:text-stone-100 truncate">
                  {displayDrinkName(drinkName, lang)}
                  <TempIcon name={drinkName} className="inline w-3 h-3 ml-1.5 align-middle" />
                  <CupGlyph qty={qty} />
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => decrementCart(drinkName)}
                    className="w-9 h-9 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation rounded-full active:scale-[0.95]"
                    aria-label="Decrease quantity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100 w-5 text-center tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => incrementCart(drinkName)}
                    className="w-9 h-9 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation rounded-full active:scale-[0.95]"
                    aria-label="Increase quantity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-1">
            <button
              onClick={placeOrder}
              disabled={orderState === "loading" || !isConfigured}
              className="
                w-full py-3.5
                bg-stone-900 dark:bg-stone-100 text-cream dark:text-stone-900
                font-serif text-lg font-light italic tracking-wide
                border-2 border-stone-900 dark:border-stone-100
                transition-colors duration-200 touch-manipulation
                hover:bg-cream hover:text-stone-900 dark:hover:bg-black dark:hover:text-stone-100
                disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none
              "
            >
              {orderState === "loading"
                ? (isEditing ? "Updating your order…" : "Sending it…")
                : <>
                    {isEditing ? "Update order" : "Place order"} —{" "}
                    {/* Spring-scale the count on change (E17). The key
                        forces React to re-mount the badge, replaying the
                        keyframe each time. */}
                    <span
                      key={totalDrinks}
                      className="inline-block tabular-nums"
                      style={{ animation: "qtyPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
                    >
                      {totalDrinks}
                    </span>{" "}
                    {totalDrinks === 1 ? "drink" : "drinks"}
                  </>
              }
            </button>
            </div>
            {orderState === "error" && (
              <p className="text-center text-xs text-red-400 font-sans">
                Order didn&apos;t go through — check your connection and try again.
              </p>
            )}
            </>)}
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {typeof orderState === "object" && (
        <SuccessToast items={orderState.items} orderedAt={orderState.orderedAt} onDismiss={handleToastDismiss} />
      )}

    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#FAFAF8] dark:bg-black">
        <BrewingCup />
      </main>
    }>
      <OrderContent />
    </Suspense>
  );
}
