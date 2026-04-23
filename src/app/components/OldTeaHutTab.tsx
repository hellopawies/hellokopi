"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

// ─── Customisation sheet ──────────────────────────────────────
function OTHSheet({
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
  const [intensity, setIntensity] = useState("Regular");
  const [evaMilk, setEvaMilk]     = useState("Regular");
  const [addOns, setAddOns]       = useState<Set<OTHAddOn>>(new Set());
  const [mounted, setMounted]     = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setIntensity("Regular");
    setEvaMilk("Regular");
    setAddOns(new Set());
  }, [drink.code]);

  const composedName = composeOTHName(drink, intensity, evaMilk, [...addOns]);
  const cartQty      = cart.get(composedName) ?? 0;

  const intensityOpts = drink.intensity ? INTENSITY_OPTIONS[drink.intensity] : null;
  const evaMilkOpts   = drink.evaMilk   ? EVA_MILK_OPTIONS[drink.evaMilk]   : null;
  const hasOptions    = !!(intensityOpts || evaMilkOpts || drink.addOns.length > 0);

  function toggleAddOn(a: OTHAddOn) {
    setAddOns(prev => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  if (!mounted) return null;

  const PILL = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-[11px] font-sans font-medium tracking-wide transition-all duration-150 touch-manipulation border ${
      active
        ? "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-800 dark:border-stone-100"
        : "bg-transparent text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" />

      {/* Bubble card — same style as GlossarySheet */}
      <div
        className="relative w-full max-w-sm mx-4 mb-8 rounded-2xl bg-[#FAFAF8]/98 dark:bg-[#111]/98 backdrop-blur-xl border border-stone-200 dark:border-stone-700/60 shadow-2xl shadow-black/15 dark:shadow-black/60 z-10 overflow-hidden"
        style={{ animation: "toastSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-0.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-sans font-medium text-stone-500 dark:text-stone-400 tracking-wide flex-shrink-0">
              {drink.code}
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
                {drink.name}
              </h3>
              {drink.icedOnly && (
                <span className="text-[10px] uppercase tracking-[0.15em] font-sans text-blue-400 dark:text-blue-300">
                  Iced only
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options — single-row scrollable strips per section */}
        {hasOptions && (
          <div className="px-5 pt-3 pb-4 flex flex-col gap-3.5">
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
        <div className="px-5 pt-0 pb-5 border-t border-stone-100 dark:border-stone-800 mt-1">
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
    </div>,
    document.body,
  );
}

// ─── Tab content ──────────────────────────────────────────────
export default function OldTeaHutTab({
  cart,
  onAddToCart,
}: {
  cart: Map<string, number>;
  onAddToCart: (name: string) => void;
}) {
  const [sheetDrink, setSheetDrink] = useState<OTHDrink | null>(null);

  function drinkCartCount(drink: OTHDrink): number {
    let total = 0;
    for (const [key, qty] of cart) {
      if (key === drink.name || key.startsWith(drink.name + " (")) total += qty;
    }
    return total;
  }

  return (
    <div style={{ animation: "tabIn 0.18s ease-out both" }}>
      {/* Header note */}
      <div className="mb-5 pb-4 border-b border-stone-100 dark:border-stone-800 flex items-baseline gap-2.5">
        <span className="text-[11px] uppercase tracking-[0.25em] font-sans font-semibold text-stone-800 dark:text-stone-100">
          Old Tea Hut
        </span>
        <span className="font-serif text-sm font-light italic text-stone-400 dark:text-stone-500">
          — tap any drink to customise.
        </span>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-7">
        {OTH_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="text-[10px] uppercase tracking-[0.25em] font-sans font-semibold text-stone-400 dark:text-stone-500 mb-3">
              {cat.name}
            </p>
            <div className="border-t border-stone-100 dark:border-stone-800">
              {cat.drinks.map((drink) => {
                const count = drinkCartCount(drink);
                return (
                  <button
                    key={drink.code}
                    type="button"
                    onClick={() => setSheetDrink(drink)}
                    className="w-full flex items-center gap-3 py-3 border-b border-stone-100 dark:border-stone-800 text-left transition-colors duration-150 hover:bg-stone-50 dark:hover:bg-stone-900/50 active:bg-stone-100 dark:active:bg-stone-900 touch-manipulation -mx-1 px-1 rounded"
                  >
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[9px] font-sans font-medium text-stone-500 dark:text-stone-400 tracking-wide min-w-[34px] text-center">
                      {drink.code}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100 leading-snug">
                        {drink.name}
                      </span>
                      {drink.icedOnly && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-[0.1em] font-sans text-blue-400 dark:text-blue-300">
                          iced
                        </span>
                      )}
                    </span>
                    {count > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-sans font-medium flex items-center justify-center">
                        {count}
                      </span>
                    )}
                    <svg className="w-3 h-3 flex-shrink-0 text-stone-300 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Customisation sheet */}
      {sheetDrink && (
        <OTHSheet
          drink={sheetDrink}
          cart={cart}
          onAdd={(name) => { onAddToCart(name); setSheetDrink(null); }}
          onClose={() => setSheetDrink(null)}
        />
      )}
    </div>
  );
}
