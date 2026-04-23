"use client";

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";
import { CATEGORIES } from "@/data/drinks";
import { DRINK_BASES, OTHERS_DRINKS, type DrinkSpecial } from "@/data/menu";

function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern); } catch {}
}

function getInitials(n: string): string {
  return n.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
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

// Lookup map for My Picks + Top Orders descriptions (pre-defined drinks only)
const BASE_DRINKS_MAP = new Map(
  CATEGORIES.flatMap((c) => c.drinks).map((d) => [d.name, d])
);

interface CustomDrink { id: string; name: string; description: string; category_id: string; }

type Tab = "crowd" | "yours" | "all";
type CartItem = { name: string; qty: number };
type OrderState = "idle" | "loading" | { orderedAt: Date; sessionStart: Date; items: CartItem[] } | "error";
type CrowdItem = { drink_name: string; order_count: number };

// ─── Heart icon ───────────────────────────────────────────────
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
  name, description, selected, qty, onSelect, favourited, onToggleFavourite, count, enterDelay,
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
}) {
  const [bursting, setBursting] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      style={enterDelay !== undefined ? { animation: `pageIn 0.3s ease-out ${enterDelay}ms both` } : undefined}
      className={`
        relative text-left p-3.5 border rounded-xl transition-all duration-200 touch-manipulation active:scale-[0.97] w-full
        ${selected
          ? "bg-stone-800 border-stone-800 dark:bg-stone-200 dark:border-stone-200 shadow-md"
          : "bg-white dark:bg-[#111] border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-md hover:-translate-y-0.5 shadow-sm"}
      `}
    >
      <span
        role="button"
        className="group/heart absolute top-2.5 right-2.5 p-1 touch-manipulation"
        onClick={(e) => {
          e.stopPropagation();
          if (!favourited) { setBursting(true); setTimeout(() => setBursting(false), 520); }
          onToggleFavourite();
        }}
      >
        <Heart filled={favourited} bursting={bursting} />
      </span>

      <p className={`text-sm font-sans font-medium leading-snug pr-5 ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
        {name}{selected && qty > 1 ? <span className="ml-1 text-[11px] font-normal opacity-60">×{qty}</span> : null}
      </p>
      {description && (
        <p className={`text-[11px] font-sans mt-0.5 leading-snug ${selected ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
          <AnnotatedText text={description} selected={selected} />
        </p>
      )}
      {count !== undefined && (
        <p className={`text-[10px] font-sans mt-1.5 font-medium tabular-nums ${selected ? "text-stone-400 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
          {count} {count === 1 ? "cup" : "cups"}
        </p>
      )}
    </button>
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
  return (
    <div className={`flex items-center mb-0.5 rounded-xl transition-colors duration-150 ${selected ? "bg-stone-800 dark:bg-stone-200" : "hover:bg-stone-50 dark:hover:bg-stone-900 active:bg-stone-100 dark:active:bg-stone-900"}`}>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex items-center justify-between px-3 py-3 text-left touch-manipulation min-w-0"
      >
        <div className="flex flex-col gap-0.5 min-w-0 mr-2">
          <span className={`text-sm font-sans font-medium truncate ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
            {name}
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

// ─── Inline loading placeholder ───────────────────────────────
function TabLoading() {
  return (
    <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-16">
      Loading…
    </p>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-[#111] p-3.5 shadow-sm">
      <div className="h-3 w-3/4 rounded-full skeleton-shimmer mb-2.5" />
      <div className="h-2.5 w-1/2 rounded-full skeleton-shimmer mb-4" />
      <div className="h-2 w-1/3 rounded-full skeleton-shimmer" />
    </div>
  );
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
    `px-3 py-1.5 text-[11px] font-sans border rounded-full transition-all duration-200 touch-manipulation active:scale-[0.95] ${
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

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearchSelect = useCallback((drinkName: string) => {
    onToggleCart(drinkName);
    setSearch("");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [onToggleCart]);

  const allDrinksFlat = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; description: string }[] = [];
    for (const cat of CATEGORIES) {
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

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return allDrinksFlat.filter((d) => d.name.toLowerCase().includes(q));
  }, [search, allDrinksFlat]);

  const baseChipCls = (active: boolean) =>
    `px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 touch-manipulation active:scale-[0.95] ${
      active
        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
        : "bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500 shadow-sm hover:shadow-md"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <input
        ref={searchRef}
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); if (e.target.value) setBaseId(null); }}
        placeholder="Search drinks…"
        className="w-full bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-500 dark:focus:border-stone-400 focus:outline-none text-stone-800 dark:text-stone-100 text-sm font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-2.5 tracking-wide transition-colors duration-200"
      />

      {/* Search results */}
      {searchResults ? (
        <div className="border-t border-stone-100 dark:border-stone-800 -mt-2">
          {searchResults.length === 0 ? (
            <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 py-8 text-center">No results.</p>
          ) : searchResults.map((drink) => (
            <DrinkRow
              key={drink.name}
              name={drink.name}
              description={drink.description}
              selected={cart.has(drink.name)}
              qty={cart.get(drink.name) ?? 0}
              onSelect={() => handleSearchSelect(drink.name)}
              favourited={userFavs.has(drink.name)}
              onToggleFavourite={() => onToggleFavourite(drink.name)}
            />
          ))}
        </div>
      ) : (
      <>

      {/* Base selector */}
      <div className="flex flex-wrap gap-2">
        {DRINK_BASES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => { setSearch(""); setBaseId(baseId === b.id ? null : b.id); }}
            className={baseChipCls(baseId === b.id)}
          >
            {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setSearch(""); setBaseId(baseId === "others" ? null : "others"); }}
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
            options={base.sweetness.map((s) => ({ id: s, label: s }))}
            selected={sweetness}
            onChange={setSweetness}
            disabled={!!special}
          />
          {base.strength.length > 0 && (
            <ModifierRow
              label="Strength"
              defaultLabel="Normal"
              options={base.strength.map((s) => ({ id: s, label: s }))}
              selected={strength}
              onChange={setStrength}
              disabled={!!special}
            />
          )}
          {base.temp.length > 0 && (
            <ModifierRow
              label="Temp"
              defaultLabel="Hot"
              options={base.temp.map((t) => ({ id: t, label: t }))}
              selected={temp}
              onChange={setTemp}
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
                    className={`px-3 py-1.5 text-[11px] font-sans border rounded-full transition-all duration-200 touch-manipulation active:scale-[0.95] ${
                      special === sp.label
                        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
                        : "bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      </>
      )}
    </div>
  );
}


// ─── Active order countdown ───────────────────────────────────
const SESSION_MS = 15 * 60 * 1000;
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
const SGT_ORDER = "Asia/Singapore";

function SuccessToast({ items, orderedAt, onDismiss }: {
  items: CartItem[];
  orderedAt: Date;
  onDismiss: () => void;
}) {
  const [width, setWidth] = useState(100);
  const cbRef = useRef(onDismiss);
  cbRef.current = onDismiss;

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

  const time = orderedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SGT_ORDER });
  const drinkLine = items.map(({ name, qty }) => qty > 1 ? `${name} ×${qty}` : name).join(" · ");

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
                className="text-[11px] uppercase tracking-[0.15em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-full hover:border-stone-400 dark:hover:border-stone-500 transition-all duration-200 touch-manipulation active:scale-[0.95]"
              >
                View
              </Link>
              <button type="button" onClick={onDismiss} className="w-7 h-7 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 touch-manipulation transition-colors">
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

  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [tab, setTab] = useState<Tab>("yours");
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [crowdData, setCrowdData] = useState<CrowdItem[]>([]);
  const [userFavs, setUserFavs] = useState<Set<string>>(new Set());
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [hiddenDrinks, setHiddenDrinks] = useState<Set<string>>(new Set());
  const [loadingCrowd, setLoadingCrowd] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [lastOrder, setLastOrder] = useState<{ name: string; qty: number }[] | null>(null);
  const [builderDrink, setBuilderDrink] = useState("");
  const [existingOrder, setExistingOrder] = useState<{ id: string; items: CartItem[]; sessionStart: Date } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [surprise, setSurprise] = useState<"idle" | "picking" | string>("idle");
  const [rouletteName, setRouletteName] = useState("");
  const [rouletteIdx, setRouletteIdx] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [presentUsers, setPresentUsers] = useState<string[]>([]);
  const editingOrderId = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [headerCompact, setHeaderCompact] = useState(false);
  const prevTotalRef = useRef(0);
  const [cartJustGrew, setCartJustGrew] = useState(false);

  // Description lookup for display in My Picks/Top Orders (pre-defined + custom)
  const DRINKS_MAP = useMemo(() => {
    const map = new Map(BASE_DRINKS_MAP);
    for (const d of customDrinks) map.set(d.name, { name: d.name, description: d.description });
    return map;
  }, [customDrinks]);

  // Full drink pool for Surprise Me (all drinks minus hidden)
  const allDrinksPool = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; description: string }[] = [];
    for (const cat of CATEGORIES) {
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
      setLoadingCrowd(false);
      setLoadingFavs(false);
      return;
    }
    const sessionWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("orders").select("items"),
      supabase.from("user_favourites").select("drink_name").eq("person_name", name),
      supabase.from("custom_drinks").select("*"),
      supabase.from("hidden_drinks").select("drink_name"),
      supabase.from("orders").select("id, items, created_at").eq("person_name", name).order("created_at", { ascending: false }),
    ]).then(([allOrders, favs, custom, hidden, userOrders]) => {
      if (allOrders.data) {
        const counts = new Map<string, number>();
        for (const order of allOrders.data)
          for (const item of order.items ?? [])
            if (item?.name) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
        setCrowdData([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([drink_name, order_count]) => ({ drink_name, order_count })));
      }
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
      setLoadingCrowd(false);
      setLoadingFavs(false);
    });
  }, [name]);

  // Detect when the active session window expires
  useEffect(() => {
    if (!existingOrder) { setSessionExpired(false); return; }
    const remaining = existingOrder.sessionStart.getTime() + SESSION_MS - Date.now();
    if (remaining <= 0) { setSessionExpired(true); return; }
    setSessionExpired(false);
    const t = setTimeout(() => setSessionExpired(true), remaining);
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

  // Header compression via IntersectionObserver on a sentinel at top of content
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setHeaderCompact(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Cart depth pulse — highlight border when cart grows
  useEffect(() => {
    const total = [...cart.values()].reduce((s, q) => s + q, 0);
    if (total > prevTotalRef.current) {
      setCartJustGrew(true);
      const t = setTimeout(() => setCartJustGrew(false), 600);
      prevTotalRef.current = total;
      return () => clearTimeout(t);
    }
    prevTotalRef.current = total;
  }, [cart]);

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
    setUserFavs((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(drinkName) : next.add(drinkName);
      return next;
    });
    if (isFav) {
      await supabase.from("user_favourites").delete().eq("person_name", name).eq("drink_name", drinkName);
    } else {
      await supabase.from("user_favourites").insert({ person_name: name, drink_name: drinkName });
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
    const sessionWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
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
      const sessionWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      await supabase.from("orders").delete().eq("person_name", name).gte("created_at", sessionWindowStart);
      editingOrderId.current = null;
      const { error } = await supabase.from("orders").insert({
        order_ref: generateOrderRef(),
        person_name: name,
        items: finalItems,
      });
      if (error) throw error;
      // Find session start: earliest order placed in the last 15 minutes
      const windowStart = new Date(orderedAt.getTime() - 15 * 60 * 1000).toISOString();
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
    const sessionWindowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
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
    { id: "crowd", label: "Top Choice" },
    { id: "all", label: "All Drinks" },
  ];
  const tabIndex = TABS.findIndex((t) => t.id === tab);

  const cartEntries = [...cart.entries()];
  const totalDrinks = cartEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />

      {/* Sticky header + tabs block */}
      <div className="liquid-glass-top sticky top-0 z-30 bg-[#FAFAF8]/80 dark:bg-black/75">
        {/* Brand + greeting */}
        <div className="px-5 sm:px-8 pt-12 sm:pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
              hello kopi
            </span>
            <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
            <h1 className={`font-serif font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight transition-all duration-300 ${headerCompact ? "text-lg sm:text-xl" : "text-3xl sm:text-4xl"}`}>
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
                    <span className="w-[22px] h-[22px] rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[8px] font-sans text-stone-400 dark:text-stone-500">
                      +{presentUsers.length - 5}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] font-sans text-stone-300 dark:text-stone-600">
                  also ordering
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-8 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto">
            <div className="relative flex bg-stone-100 dark:bg-stone-900 rounded-full p-1">
              {/* Sliding pill */}
              <div
                className="absolute top-1 bottom-1 bg-white dark:bg-stone-700 shadow-sm rounded-full pointer-events-none"
                style={{
                  left: 4,
                  width: "calc((100% - 8px) / 3)",
                  transform: `translateX(${tabIndex * 100}%)`,
                  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); if (t.id !== "all") setBuilderDrink(""); }}
                  className={`
                    relative z-10 flex-1 py-1.5 text-center text-[10px] uppercase tracking-[0.15em]
                    font-sans font-medium rounded-full transition-colors duration-200 touch-manipulation whitespace-nowrap
                    ${tab === t.id
                      ? "text-stone-800 dark:text-stone-100"
                      : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"}
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

          {/* Active order card */}
          {existingOrder && !isEditing && (
            <div className="relative mb-5">
              {!sessionExpired && (
                <div
                  className="absolute inset-0 rounded-2xl border border-stone-400 dark:border-stone-500 pointer-events-none"
                  style={{ animation: "cardBreathe 4s ease-in-out infinite" }}
                />
              )}
              <div className={`rounded-2xl bg-[#FAFAF8]/95 dark:bg-[#111]/95 backdrop-blur-xl border shadow-2xl shadow-black/10 dark:shadow-black/50 px-4 py-3.5 flex flex-col gap-2 transition-colors duration-500 ${
                sessionExpired
                  ? "border-amber-200 dark:border-amber-800/60"
                  : "border-stone-200 dark:border-stone-700/60"
              }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">
                      {sessionExpired ? "Session ended" : "Active order"}
                    </p>
                    {!sessionExpired && <ActiveCountdown sessionStart={existingOrder.sessionStart} />}
                  </div>
                  <p className="text-sm font-sans text-stone-600 dark:text-stone-400 truncate">
                    {existingOrder.items.map(({ name: n, qty }) => `${n}${qty > 1 ? ` ×${qty}` : ""}`).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={cancelOrder}
                    className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-red-400 dark:text-red-300 border border-red-200 dark:border-red-800 dark:bg-red-950 px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200 touch-manipulation active:scale-[0.95]"
                  >
                    Cancel
                  </button>
                  {!sessionExpired && (
                    <button
                      type="button"
                      onClick={() => {
                        editingOrderId.current = existingOrder.id;
                        setCart(new Map(existingOrder.items.map(({ name: n, qty }) => [n, qty])));
                        setIsEditing(true);
                        setExistingOrder(null);
                      }}
                      className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-stone-500 dark:text-stone-200 border border-stone-200 dark:border-stone-600 dark:bg-stone-800 px-3 py-1.5 rounded-full hover:border-stone-500 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-white transition-all duration-200 touch-manipulation active:scale-[0.95]"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              {sessionExpired && (
                <p className="text-[11px] font-sans text-amber-500 dark:text-amber-400">
                  The order window has closed — the collector may have already left.
                </p>
              )}
              </div>
            </div>
          )}

          {/* MY PICKS */}
          {tab === "yours" && (
            <div style={{ animation: "tabIn 0.18s ease-out both" }}>
              {loadingFavs && <TabLoading />}
              {!loadingFavs && lastOrder && lastOrder.length > 0 && (
                <div className="mb-5 pb-5 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium mb-2.5">Last order</p>
                  <div className="flex flex-col gap-1 mb-3">
                    {lastOrder.map(({ name: n, qty }) => (
                      <p key={n} className="text-sm font-sans text-stone-600 dark:text-stone-400">
                        {n}{qty > 1 ? ` ×${qty}` : ""}
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCart(new Map(lastOrder.map(({ name: n, qty }) => [n, qty])))}
                    className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-xl hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all duration-200 touch-manipulation shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
                  >
                    Re-order
                  </button>
                </div>
              )}
              {!loadingFavs && userFavs.size === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 text-center px-8">
                    Tap ♡ on any drink to save it here
                  </p>
                </div>
              )}
              {!loadingFavs && userFavs.size > 0 && (
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {[...userFavs].map((drinkName, index) => {
                    const drink = DRINKS_MAP.get(drinkName);
                    return (
                      <DrinkCard
                        key={drinkName}
                        name={drinkName}
                        description={drink?.description}
                        selected={cart.has(drinkName)}
                        qty={cart.get(drinkName) ?? 0}
                        onSelect={() => toggleCart(drinkName)}
                        favourited={true}
                        onToggleFavourite={() => toggleFavourite(drinkName)}
                        enterDelay={index * 35}
                      />
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
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed transition-all duration-200 touch-manipulation active:scale-[0.98] ${
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
                          {rouletteName || "…"}
                        </p>
                      )}
                      {surprise !== "idle" && surprise !== "picking" && (
                        <>
                          <p className="text-sm font-sans font-medium text-stone-700 dark:text-stone-200 truncate">{surprise}</p>
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

          {/* TOP ORDERS */}
          {tab === "crowd" && (
            <div style={{ animation: "tabIn 0.18s ease-out both" }}>
              {loadingCrowd && (
                <div className="grid grid-cols-2 gap-2.5">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}
              {!loadingCrowd && crowdData.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 text-center">
                    No orders yet — be the first!
                  </p>
                </div>
              )}
              {!loadingCrowd && crowdData.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {crowdData.map(({ drink_name, order_count }, index) => {
                    const drink = DRINKS_MAP.get(drink_name);
                    return (
                      <DrinkCard
                        key={drink_name}
                        name={drink_name}
                        description={drink?.description}
                        selected={cart.has(drink_name)}
                        qty={cart.get(drink_name) ?? 0}
                        onSelect={() => toggleCart(drink_name)}
                        favourited={userFavs.has(drink_name)}
                        onToggleFavourite={() => toggleFavourite(drink_name)}
                        count={order_count}
                        enterDelay={index * 35}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ALL DRINKS — builder */}
          {tab === "all" && (
            <div style={{ animation: "tabIn 0.18s ease-out both" }}>
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

      {/* Fixed bottom bar — builder preview and/or cart */}
      {(cart.size > 0 || builderDrink) && (
        <div className="fixed bottom-8 left-0 right-0 z-40 px-4 sm:px-6">
          <div className={`max-w-lg mx-auto rounded-2xl bg-[#FAFAF8]/95 dark:bg-[#111]/95 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/50 px-4 pt-3.5 pb-4 flex flex-col gap-2.5 border transition-colors duration-300 ${cartJustGrew ? "border-stone-400 dark:border-stone-400/80" : "border-stone-200 dark:border-stone-700/60"}`}>

            {/* Builder preview row */}
            {builderDrink && (
              <div className={`flex items-center justify-between gap-3 ${cart.size > 0 ? "pb-2.5 border-b border-stone-100 dark:border-stone-800" : ""}`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <p className="font-serif text-lg font-light tracking-wide text-stone-800 dark:text-stone-100 truncate">
                    {builderDrink}
                  </p>
                  <button type="button" onClick={() => toggleFavourite(builderDrink)} className="group/heart flex-shrink-0 p-1 touch-manipulation">
                    <Heart filled={userFavs.has(builderDrink)} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCart(builderDrink)}
                  className={`flex-shrink-0 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 touch-manipulation active:scale-[0.95] shadow-sm hover:shadow-md ${
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
                <p className="flex-1 min-w-0 text-sm font-sans font-medium text-stone-800 dark:text-stone-100 truncate">
                  {drinkName}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => decrementCart(drinkName)}
                    className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation rounded-full active:scale-[0.95]"
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
                    className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation rounded-full active:scale-[0.95]"
                    aria-label="Increase quantity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div
              className="mt-1 rounded-xl"
              style={orderState !== "loading" ? { animation: "btnPulse 2.5s ease-in-out infinite" } : undefined}
            >
            <button
              onClick={placeOrder}
              disabled={orderState === "loading" || !isConfigured}
              className="
                w-full py-3 rounded-xl
                bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900
                text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                transition-all duration-200 touch-manipulation
                shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
                hover:bg-stone-700 dark:hover:bg-stone-300 active:bg-stone-900 dark:active:bg-stone-100
                disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none
              "
            >
              {orderState === "loading"
                ? (isEditing ? "Updating…" : "Placing…")
                : <>
                    {isEditing ? "Update Order" : "Place Order"}{" — "}
                    <span key={totalDrinks} style={{ display: "inline-block", animation: "countPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
                      {totalDrinks} {totalDrinks === 1 ? "drink" : "drinks"}
                    </span>
                  </>
              }
            </button>
            </div>
            {orderState === "error" && (
              <p className="text-center text-xs text-red-400 font-sans">
                Something went wrong. Please try again.
              </p>
            )}
            </>)}
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
    <Suspense>
      <OrderContent />
    </Suspense>
  );
}
