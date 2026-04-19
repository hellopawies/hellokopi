"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";
import { CATEGORIES, type Drink } from "@/data/drinks";

// Base lookup map for hardcoded drinks
const BASE_DRINKS_MAP = new Map(
  CATEGORIES.flatMap((c) => c.drinks).map((d) => [d.name, d])
);

interface CustomDrink { id: string; name: string; description: string; category_id: string; }

type Tab = "crowd" | "yours" | "all";
type CartItem = { name: string; qty: number };
type OrderState = "idle" | "loading" | { orderRef: string; items: CartItem[] } | "error";
type CrowdItem = { drink_name: string; order_count: number };

// Sort hot drinks first, iced (Peng) last
function sortHotFirst(drinks: Drink[]): Drink[] {
  return [...drinks].sort((a, b) => {
    const aIced = /peng/i.test(a.name);
    const bIced = /peng/i.test(b.name);
    if (aIced === bIced) return 0;
    return aIced ? 1 : -1;
  });
}

// ─── Heart icon ───────────────────────────────────────────────
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-[15px] h-[15px] transition-colors duration-150 flex-shrink-0 ${
        filled ? "text-rose-400" : "text-stone-250 group-hover/heart:text-stone-400"
      }`}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
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
  drink, selected, qty, onSelect, favourited, onToggleFavourite, count,
}: {
  drink: Drink;
  selected: boolean;
  qty: number;
  onSelect: (d: Drink) => void;
  favourited: boolean;
  onToggleFavourite: (name: string) => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(drink)}
      className={`
        relative text-left p-3.5 border transition-all duration-150 touch-manipulation active:scale-[0.98]
        ${selected
          ? "bg-stone-800 border-stone-800 dark:bg-stone-200 dark:border-stone-200"
          : "bg-white dark:bg-[#111] border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"}
      `}
    >
      {/* Heart toggle */}
      <span
        role="button"
        className="group/heart absolute top-2.5 right-2.5 p-1 touch-manipulation"
        onClick={(e) => { e.stopPropagation(); onToggleFavourite(drink.name); }}
      >
        <Heart filled={favourited} />
      </span>

      <p className={`text-sm font-sans font-medium leading-snug pr-5 ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
        {drink.name}
      </p>
      <p className={`text-[11px] font-sans mt-0.5 leading-snug ${selected ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
        {drink.description}
      </p>
      {count !== undefined && (
        <p className={`text-[10px] font-sans mt-1.5 font-medium tabular-nums ${selected ? "text-stone-400 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
          {count} {count === 1 ? "order" : "orders"}
        </p>
      )}
      {selected && qty > 1 && (
        <span className="absolute bottom-2 left-3 text-[10px] font-sans font-medium text-stone-400 dark:text-stone-600 tabular-nums">
          ×{qty}
        </span>
      )}
    </button>
  );
}

// ─── Drink row (accordion view) ───────────────────────────────
function DrinkRow({
  drink, selected, qty, onSelect, favourited, onToggleFavourite,
}: {
  drink: Drink;
  selected: boolean;
  qty: number;
  onSelect: (d: Drink) => void;
  favourited: boolean;
  onToggleFavourite: (name: string) => void;
}) {
  return (
    <div className={`flex items-center mb-0.5 transition-colors duration-150 ${selected ? "bg-stone-800 dark:bg-stone-200" : "hover:bg-stone-50 dark:hover:bg-[#111] active:bg-stone-100 dark:active:bg-[#1a1a1a]"}`}>
      <button
        type="button"
        onClick={() => onSelect(drink)}
        className="flex-1 flex items-center justify-between px-3 py-3 text-left touch-manipulation min-w-0"
      >
        <div className="flex flex-col gap-0.5 min-w-0 mr-2">
          <span className={`text-sm font-sans font-medium truncate ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
            {drink.name}
          </span>
          <span className={`text-[11px] font-sans truncate ${selected ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
            {drink.description}
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
        onClick={() => onToggleFavourite(drink.name)}
        className="group/heart px-3 py-3 touch-manipulation flex-shrink-0"
      >
        <Heart filled={favourited} />
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

// ─── Main order content ───────────────────────────────────────
function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";

  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [tab, setTab] = useState<Tab>("yours");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [crowdData, setCrowdData] = useState<CrowdItem[]>([]);
  const [userFavs, setUserFavs] = useState<Set<string>>(new Set());
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [hiddenDrinks, setHiddenDrinks] = useState<Set<string>>(new Set());
  const [loadingCrowd, setLoadingCrowd] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(true);

  // Merged drink map (hardcoded + custom)
  const DRINKS_MAP = useMemo(() => {
    const map = new Map(BASE_DRINKS_MAP);
    for (const d of customDrinks) map.set(d.name, { name: d.name, description: d.description });
    return map;
  }, [customDrinks]);

  // Effective categories (hide hidden, append custom)
  const effectiveCategories = useMemo(() => {
    return CATEGORIES.map(cat => ({
      ...cat,
      drinks: [
        ...cat.drinks.filter(d => !hiddenDrinks.has(d.name)),
        ...customDrinks.filter(cd => cd.category_id === cat.id).map(cd => ({ name: cd.name, description: cd.description })),
      ],
    })).filter(cat => cat.drinks.length > 0);
  }, [customDrinks, hiddenDrinks]);

  useEffect(() => {
    if (!isConfigured) {
      setLoadingCrowd(false);
      setLoadingFavs(false);
      return;
    }
    supabase.rpc("get_crowd_favourites").then(({ data }) => {
      if (data) setCrowdData(data as CrowdItem[]);
      setLoadingCrowd(false);
    });
    supabase
      .from("user_favourites")
      .select("drink_name")
      .eq("person_name", name)
      .then(({ data }) => {
        if (data) setUserFavs(new Set(data.map((d: { drink_name: string }) => d.drink_name)));
        setLoadingFavs(false);
      });
    Promise.all([
      supabase.from("custom_drinks").select("*"),
      supabase.from("hidden_drinks").select("drink_name"),
    ]).then(([custom, hidden]) => {
      if (custom.data) setCustomDrinks(custom.data as CustomDrink[]);
      if (hidden.data) setHiddenDrinks(new Set(hidden.data.map((h: { drink_name: string }) => h.drink_name)));
    });
  }, [name]);

  function toggleCategory(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCart(drink: Drink) {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(drink.name)) {
        next.delete(drink.name);
      } else {
        next.set(drink.name, 1);
      }
      return next;
    });
  }

  function incrementCart(drinkName: string) {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(drinkName, (next.get(drinkName) ?? 0) + 1);
      return next;
    });
  }

  function decrementCart(drinkName: string) {
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

  async function placeOrder() {
    if (cart.size === 0) return;
    setOrderState("loading");
    const orderRef = generateOrderRef();
    // Expand cart: qty > 1 = repeated item entries (backward-compatible with orders display)
    const items = [...cart.entries()].flatMap(([drinkName, qty]) => {
      const drink = DRINKS_MAP.get(drinkName)!;
      return Array(qty).fill({ name: drink.name, description: drink.description });
    });
    try {
      const { error } = await supabase.from("orders").insert({
        order_ref: orderRef,
        person_name: name,
        items,
      });
      if (error) throw error;
      const cartItems: CartItem[] = [...cart.entries()].map(([drinkName, qty]) => ({ name: drinkName, qty }));
      setOrderState({ orderRef, items: cartItems });
    } catch {
      setOrderState("error");
    }
  }

  if (typeof orderState === "object") {
    return <ConfirmedState name={name} orderRef={orderState.orderRef} items={orderState.items} />;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "yours", label: "My Picks" },
    { id: "crowd", label: "Top Orders" },
    { id: "all", label: "All Drinks" },
  ];

  const cartEntries = [...cart.entries()];
  const totalDrinks = cartEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />

      {/* Sticky header + tabs block */}
      <div className="sticky top-0 z-30 bg-[#FAFAF8] dark:bg-black">
        {/* Brand + greeting */}
        <div className="px-5 sm:px-8 pt-12 sm:pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
              hello kopi
            </span>
            <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
              Hello, {name}
            </h1>
            <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 dark:text-stone-500 mt-1.5">
              What would you like today?
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-8 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto flex gap-5 sm:gap-7">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`
                  pb-3 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em]
                  font-sans font-medium border-b-2 transition-colors duration-150 touch-manipulation whitespace-nowrap
                  ${tab === t.id
                    ? "text-stone-800 dark:text-stone-100 border-stone-800 dark:border-stone-100"
                    : "text-stone-400 dark:text-stone-500 border-transparent hover:text-stone-600 dark:hover:text-stone-300"}
                `}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 sm:px-8 pt-5 ${cart.size > 0 ? "pb-64" : "pb-12"}`}>
        <div className="max-w-lg mx-auto">

          {/* MY PICKS */}
          {tab === "yours" && (
            <>
              {loadingFavs && <TabLoading />}
              {!loadingFavs && userFavs.size === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 text-center px-8">
                    Tap ♡ on any drink to save it here
                  </p>
                </div>
              )}
              {!loadingFavs && userFavs.size > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[...userFavs].map((drinkName) => {
                    const drink = DRINKS_MAP.get(drinkName);
                    if (!drink) return null;
                    return (
                      <DrinkCard
                        key={drinkName}
                        drink={drink}
                        selected={cart.has(drinkName)}
                        qty={cart.get(drinkName) ?? 0}
                        onSelect={toggleCart}
                        favourited={true}
                        onToggleFavourite={toggleFavourite}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TOP ORDERS */}
          {tab === "crowd" && (
            <>
              {loadingCrowd && <TabLoading />}
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
                  {crowdData.map(({ drink_name, order_count }) => {
                    const drink = DRINKS_MAP.get(drink_name);
                    if (!drink) return null;
                    return (
                      <DrinkCard
                        key={drink_name}
                        drink={drink}
                        selected={cart.has(drink_name)}
                        qty={cart.get(drink_name) ?? 0}
                        onSelect={toggleCart}
                        favourited={userFavs.has(drink_name)}
                        onToggleFavourite={toggleFavourite}
                        count={order_count}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ALL DRINKS */}
          {tab === "all" && (
            <div>
              {effectiveCategories.map((cat) => (
                <div key={cat.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between py-4 touch-manipulation"
                  >
                    <span className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400">
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-stone-300 dark:text-stone-600 font-sans tabular-nums">
                        {cat.drinks.length}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 transition-transform duration-200 ${expanded.has(cat.id) ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expanded.has(cat.id) && (
                    <div className="pb-2">
                      {sortHotFirst(cat.drinks).map((drink) => (
                        <DrinkRow
                          key={drink.name}
                          drink={drink}
                          selected={cart.has(drink.name)}
                          qty={cart.get(drink.name) ?? 0}
                          onSelect={toggleCart}
                          favourited={userFavs.has(drink.name)}
                          onToggleFavourite={toggleFavourite}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Sticky cart + place-order bar */}
      {cart.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAF8] dark:bg-black border-t border-stone-200 dark:border-stone-700 px-5 sm:px-8 pt-3.5 pb-5">
          <div className="max-w-lg mx-auto flex flex-col gap-2.5">
            {cartEntries.map(([drinkName, qty]) => (
              <div key={drinkName} className="flex items-center gap-3">
                <p className="flex-1 min-w-0 text-sm font-sans font-medium text-stone-800 dark:text-stone-100 truncate">
                  {drinkName}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => decrementCart(drinkName)}
                    className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation"
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
                    className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation"
                    aria-label="Increase quantity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={placeOrder}
              disabled={orderState === "loading" || !isConfigured}
              className="
                mt-1 w-full py-3
                bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900
                text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                transition-all duration-200 touch-manipulation
                hover:bg-stone-700 dark:hover:bg-stone-300 active:bg-stone-900 dark:active:bg-stone-100
                disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none
              "
            >
              {orderState === "loading"
                ? "Placing…"
                : `Place Order — ${totalDrinks} ${totalDrinks === 1 ? "drink" : "drinks"}`}
            </button>
            {orderState === "error" && (
              <p className="text-center text-xs text-red-400 font-sans">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Confirmation screen ──────────────────────────────────────
function ConfirmedState({ name, orderRef, items }: { name: string; orderRef: string; items: CartItem[] }) {
  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">hello kopi</span>
          <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 dark:text-stone-500 font-sans">Order placed</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 dark:text-stone-100">{name}</h1>
          <div className="flex flex-col items-center gap-1 mt-1">
            {items.map(({ name: drinkName, qty }) => (
              <p key={drinkName} className="font-serif text-xl font-light italic text-stone-500 dark:text-stone-400">
                {drinkName}{qty > 1 ? ` ×${qty}` : ""}
              </p>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans">Order reference</p>
            <p className="font-serif text-3xl sm:text-4xl font-light tracking-[0.2em] text-stone-700 dark:text-stone-200">{orderRef}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <Link href="/orders" className="w-full sm:w-auto sm:px-8 py-3.5 text-center bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 touch-manipulation hover:bg-stone-700 dark:hover:bg-stone-300 focus:outline-none">
            View Orders
          </Link>
          <Link href="/" className="w-full sm:w-auto sm:px-8 py-3.5 text-center border border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 touch-manipulation hover:border-stone-600 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 focus:outline-none">
            Back
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />
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
