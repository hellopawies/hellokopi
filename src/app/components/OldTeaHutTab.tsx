"use client";

import { Fragment, useState, useEffect, useMemo, useRef } from "react";
import {
  OTH_CATEGORIES,
  ADD_ON_LABELS,
  INTENSITY_OPTIONS,
  EVA_MILK_OPTIONS,
  composeOTHName,
  type OTHDrink,
  type OTHAddOn,
} from "@/data/oldTeaHut";

function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern); } catch {}
}

// ─── Inline customisation panel (expands in-grid under the tapped card) ───
function OTHExpandPanel({
  drink,
  cart,
  onAdd,
  onClose,
}: {
  drink: OTHDrink;
  cart: Map<string, number>;
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  const [temp, setTemp]           = useState("Hot");
  const [intensity, setIntensity] = useState("Regular");
  const [evaMilk, setEvaMilk]     = useState("Regular");
  const [addOns, setAddOns]       = useState<Set<OTHAddOn>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTemp("Hot");
    setIntensity("Regular");
    setEvaMilk("Regular");
    setAddOns(new Set());
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [drink.code]);

  const composedName = composeOTHName(drink, intensity, evaMilk, [...addOns], temp);
  const cartQty      = cart.get(composedName) ?? 0;

  const showTemp      = !drink.icedOnly;
  const intensityOpts = drink.intensity ? INTENSITY_OPTIONS[drink.intensity] : null;
  const evaMilkOpts   = drink.evaMilk   ? EVA_MILK_OPTIONS[drink.evaMilk]   : null;
  const hasOptions    = !!(showTemp || intensityOpts || evaMilkOpts || drink.addOns.length > 0);

  function toggleAddOn(a: OTHAddOn) {
    setAddOns(prev => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  const PILL = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-[11px] font-sans font-medium tracking-wide transition-all duration-150 touch-manipulation border ${
      active
        ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-800 dark:border-stone-100"
        : "bg-transparent text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"
    }`;

  return (
    <div
      ref={ref}
      className="rounded-2xl bg-[#FAFAF8] dark:bg-[#0b0b0b] border border-stone-200 dark:border-stone-700/60 shadow-sm overflow-hidden"
      style={{ animation: "tabIn 0.18s ease-out both" }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-3 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
            {drink.name}
          </h3>
          {drink.icedOnly && (
            <span className="text-[10px] uppercase tracking-[0.15em] font-sans text-blue-400 dark:text-blue-300">
              Iced only
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Options */}
      {hasOptions && (
        <div className="px-4 pt-3 pb-4 flex flex-col gap-3.5">
          {showTemp && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-400 dark:text-stone-500 mb-2">Temperature</p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setTemp("Hot")} className={PILL(temp === "Hot")}>Hot</button>
                <button type="button" onClick={() => setTemp("Iced")} className={PILL(temp === "Iced")}>Iced</button>
              </div>
            </div>
          )}
          {intensityOpts && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-400 dark:text-stone-500 mb-2">Intensity</p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {intensityOpts.map((opt) => (
                  <button key={opt} type="button" onClick={() => setIntensity(opt)} className={PILL(intensity === opt) + " flex-shrink-0"}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {evaMilkOpts && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-400 dark:text-stone-500 mb-2">Eva Milk</p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {evaMilkOpts.map((opt) => (
                  <button key={opt} type="button" onClick={() => setEvaMilk(opt)} className={PILL(evaMilk === opt) + " flex-shrink-0"}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {drink.addOns.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-400 dark:text-stone-500 mb-2">Add Ons</p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {drink.addOns.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAddOn(a)} className={PILL(addOns.has(a)) + " flex-shrink-0"}>
                    +{ADD_ON_LABELS[a]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA — composed name lives here */}
      <div className={`px-4 pb-4 ${hasOptions ? "border-t border-stone-100 dark:border-stone-800 pt-0 mt-1" : "pt-3"}`}>
        <div className="flex items-baseline gap-2 py-3 mb-1">
          <p className="text-[11px] font-sans font-medium text-stone-800 dark:text-stone-100 leading-snug flex-1 min-w-0 truncate">{composedName}</p>
          {cartQty > 0 && (
            <span className="text-[11px] font-sans text-stone-400 dark:text-stone-500 flex-shrink-0">{cartQty} in cart</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { haptic([5, 30, 5]); onAdd(composedName); }}
          className="w-full py-3 rounded-xl bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-200 touch-manipulation active:scale-[0.98] hover:bg-stone-700 dark:hover:bg-white shadow-sm"
        >
          {cartQty > 0 ? "Add Another" : "Add to Order"}
        </button>
      </div>
    </div>
  );
}

// ─── Tab content ──────────────────────────────────────────────
export default function OldTeaHutTab({
  cart,
  onAddToCart,
  userFavs,
  onToggleFavourite,
}: {
  cart: Map<string, number>;
  onAddToCart: (name: string) => void;
  userFavs: Set<string>;
  onToggleFavourite: (name: string) => void;
}) {
  const [selectedDrink, setSelectedDrink] = useState<OTHDrink | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function toggleDrink(drink: OTHDrink) {
    setSelectedDrink((prev) => (prev?.code === drink.code ? null : drink));
  }

  const activeCategory = OTH_CATEGORIES.find((c) => c.name === selectedCat) ?? null;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    const results: OTHDrink[] = [];
    for (const cat of OTH_CATEGORIES) {
      for (const d of cat.drinks) {
        if (d.name.toLowerCase().includes(q)) results.push(d);
      }
    }
    return results;
  }, [search]);

  const pillCls = (active: boolean) =>
    `px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 touch-manipulation active:scale-[0.95] ${
      active
        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
        : "bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500 shadow-sm hover:shadow-md"
    }`;

  function drinkCartCount(drink: OTHDrink): number {
    let total = 0;
    for (const [key, qty] of cart) {
      if (key === drink.name || key.startsWith(drink.name + " (")) total += qty;
    }
    return total;
  }

  function renderCard(drink: OTHDrink) {
    const count = drinkCartCount(drink);
    const fav = userFavs.has(drink.name);
    const selected = selectedDrink?.code === drink.code;
    return (
      <button
        key={drink.code}
        type="button"
        onClick={() => toggleDrink(drink)}
        className={`relative text-left p-3.5 border rounded-xl transition-all duration-200 touch-manipulation active:scale-[0.97] w-full bg-white dark:bg-[#111] ${
          selected
            ? "border-stone-500 dark:border-stone-400 shadow-md"
            : "border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-md hover:-translate-y-0.5 shadow-sm"
        }`}
      >
        <span
          role="button"
          className="group/heart absolute top-0.5 right-0.5 p-2.5 touch-manipulation"
          onClick={(e) => { e.stopPropagation(); onToggleFavourite(drink.name); }}
        >
          <svg
            className={`w-[15px] h-[15px] flex-shrink-0 transition-colors duration-150 ${
              fav ? "text-amber-800 dark:text-amber-700" : "text-stone-250 group-hover/heart:text-stone-400"
            }`}
            fill={fav ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={fav ? 0 : 1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </span>

        <p className="text-sm font-sans font-medium leading-snug pr-6 text-stone-800 dark:text-stone-100">
          {drink.name}
          {drink.icedOnly && (
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.1em] font-sans text-blue-400 dark:text-blue-300">
              iced
            </span>
          )}
        </p>
        {count > 0 && (
          <p className="text-[10px] font-sans mt-1.5 font-medium tabular-nums text-stone-400 dark:text-stone-500">
            {count} in cart
          </p>
        )}
      </button>
    );
  }

  return (
    <div style={{ animation: "tabIn 0.18s ease-out both" }}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); if (e.target.value) setSelectedCat(null); }}
        placeholder="Search drinks…"
        className="w-full bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-500 dark:focus:border-stone-400 focus:outline-none text-stone-800 dark:text-stone-100 text-sm font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-2.5 mb-3 tracking-wide transition-colors duration-200"
      />

      {/* Order direct link */}
      <a
        href="https://autopos.cloud/h5/qr?c=2DbtNuxweLMuE2mgLR8vWMJyBtoE4LrFE6QKymyrjLKpvfHYTVGrZAnpR6PKz1&h=1L5Clg&t=S"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 mb-5 text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-stone-500 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-700 transition-colors duration-150 touch-manipulation py-2"
      >
        Order direct from Old Tea Hut
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {searchResults ? (
        searchResults.length === 0 ? (
          <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 py-8 text-center">No results.</p>
        ) : (
          renderGrid(searchResults)
        )
      ) : (
        <>
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {OTH_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCat(selectedCat === cat.name ? null : cat.name)}
                className={pillCls(selectedCat === cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Drinks for selected category */}
          {activeCategory && <div className="mt-6">{renderGrid(activeCategory.drinks)}</div>}
        </>
      )}
    </div>
  );

  function renderGrid(drinks: OTHDrink[]) {
    const selCode = selectedDrink?.code;
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {drinks.map((drink, i) => {
          const isEndOfRow = i % 2 === 1 || i === drinks.length - 1;
          const rowStart = i - (i % 2);
          const rowContainsSelected =
            !!selCode && drinks.slice(rowStart, rowStart + 2).some((d) => d.code === selCode);
          const showPanel = isEndOfRow && rowContainsSelected && selectedDrink;
          return (
            <Fragment key={drink.code}>
              {renderCard(drink)}
              {showPanel && (
                <div className="col-span-2">
                  <OTHExpandPanel
                    drink={selectedDrink}
                    cart={cart}
                    onAdd={(name) => { onAddToCart(name); setSelectedDrink(null); }}
                    onClose={() => setSelectedDrink(null)}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }
}
