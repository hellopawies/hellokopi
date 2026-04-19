"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";
import { CATEGORIES, type Drink } from "@/data/drinks";

// Flat lookup map built once at module level
const DRINKS_MAP = new Map(
  CATEGORIES.flatMap((c) => c.drinks).map((d) => [d.name, d])
);

type Tab = "crowd" | "yours" | "all";
type OrderState = "idle" | "loading" | { orderRef: string; drinkName: string } | "error";
type CrowdItem = { drink_name: string; order_count: number };

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
  drink, selected, onSelect, favourited, onToggleFavourite, count,
}: {
  drink: Drink;
  selected: boolean;
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
        ${selected ? "bg-stone-800 border-stone-800" : "bg-white border-stone-200 hover:border-stone-400"}
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

      <p className={`text-sm font-sans font-medium leading-snug pr-5 ${selected ? "text-white" : "text-stone-800"}`}>
        {drink.name}
      </p>
      <p className={`text-[11px] font-sans mt-0.5 leading-snug ${selected ? "text-stone-300" : "text-stone-400"}`}>
        {drink.description}
      </p>
      {count !== undefined && (
        <p className={`text-[10px] font-sans mt-1.5 font-medium tabular-nums ${selected ? "text-stone-400" : "text-stone-400"}`}>
          {count} {count === 1 ? "order" : "orders"}
        </p>
      )}
    </button>
  );
}

// ─── Drink row (accordion view) ───────────────────────────────
function DrinkRow({
  drink, selected, onSelect, favourited, onToggleFavourite,
}: {
  drink: Drink;
  selected: boolean;
  onSelect: (d: Drink) => void;
  favourited: boolean;
  onToggleFavourite: (name: string) => void;
}) {
  return (
    <div className={`flex items-center mb-0.5 transition-colors duration-150 ${selected ? "bg-stone-800" : "hover:bg-stone-50 active:bg-stone-100"}`}>
      <button
        type="button"
        onClick={() => onSelect(drink)}
        className="flex-1 flex items-center justify-between px-3 py-3 text-left touch-manipulation min-w-0"
      >
        <div className="flex flex-col gap-0.5 min-w-0 mr-2">
          <span className={`text-sm font-sans font-medium truncate ${selected ? "text-white" : "text-stone-800"}`}>
            {drink.name}
          </span>
          <span className={`text-[11px] font-sans truncate ${selected ? "text-stone-300" : "text-stone-400"}`}>
            {drink.description}
          </span>
        </div>
        {selected && (
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
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
    <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 text-center py-16">
      Loading…
    </p>
  );
}

// ─── Main order content ───────────────────────────────────────
function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";

  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [tab, setTab] = useState<Tab>("crowd");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [crowdData, setCrowdData] = useState<CrowdItem[]>([]);
  const [userFavs, setUserFavs] = useState<Set<string>>(new Set());
  const [loadingCrowd, setLoadingCrowd] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(true);

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
  }, [name]);

  function toggleCategory(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectDrink(drink: Drink) {
    setSelectedDrink((prev) => (prev?.name === drink.name ? null : drink));
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
    if (!selectedDrink) return;
    setOrderState("loading");
    const orderRef = generateOrderRef();
    try {
      const { error } = await supabase.from("orders").insert({
        order_ref: orderRef,
        person_name: name,
        items: [{ name: selectedDrink.name, description: selectedDrink.description }],
      });
      if (error) throw error;
      setOrderState({ orderRef, drinkName: selectedDrink.name });
    } catch {
      setOrderState("error");
    }
  }

  if (typeof orderState === "object") {
    return <ConfirmedState name={name} orderRef={orderState.orderRef} drinkName={orderState.drinkName} />;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "crowd", label: "Top Orders" },
    { id: "yours", label: "My Picks" },
    { id: "all", label: "All Drinks" },
  ];

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      {/* Header */}
      <div className="px-5 sm:px-8 pt-12 pb-5">
        <div className="max-w-lg mx-auto">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-sans font-medium">
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 mt-1.5 mb-4" />
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 leading-tight">
            Hello, {name}
          </h1>
          <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 mt-1.5">
            What would you like today?
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 sm:px-8 border-b border-stone-100">
        <div className="max-w-lg mx-auto flex gap-5 sm:gap-7">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`
                pb-3 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em]
                font-sans font-medium border-b-2 transition-colors duration-150 touch-manipulation whitespace-nowrap
                ${tab === t.id ? "text-stone-800 border-stone-800" : "text-stone-400 border-transparent hover:text-stone-600"}
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 sm:px-8 pt-5 ${selectedDrink ? "pb-28" : "pb-12"}`}>
        <div className="max-w-lg mx-auto">

          {/* TOP ORDERS */}
          {tab === "crowd" && (
            <>
              {loadingCrowd && <TabLoading />}
              {!loadingCrowd && crowdData.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200" />
                  <p className="font-serif text-base font-light italic text-stone-400 text-center">
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
                        selected={selectedDrink?.name === drink_name}
                        onSelect={selectDrink}
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

          {/* MY PICKS */}
          {tab === "yours" && (
            <>
              {loadingFavs && <TabLoading />}
              {!loadingFavs && userFavs.size === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200" />
                  <p className="font-serif text-base font-light italic text-stone-400 text-center px-8">
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
                        selected={selectedDrink?.name === drinkName}
                        onSelect={selectDrink}
                        favourited={true}
                        onToggleFavourite={toggleFavourite}
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
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="border-b border-stone-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between py-4 touch-manipulation"
                  >
                    <span className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600">
                      {cat.label}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-stone-300 font-sans tabular-nums">
                        {cat.drinks.length}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${expanded.has(cat.id) ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {expanded.has(cat.id) && (
                    <div className="pb-2">
                      {cat.drinks.map((drink) => (
                        <DrinkRow
                          key={drink.name}
                          drink={drink}
                          selected={selectedDrink?.name === drink.name}
                          onSelect={selectDrink}
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

      {/* Sticky place-order bar */}
      {selectedDrink && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAF8] border-t border-stone-200 px-5 sm:px-8 py-3.5">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-medium text-stone-800 truncate">{selectedDrink.name}</p>
              <p className="text-[11px] text-stone-400 font-sans truncate">{selectedDrink.description}</p>
            </div>
            <button
              onClick={placeOrder}
              disabled={orderState === "loading" || !isConfigured}
              className="
                flex-shrink-0 px-6 py-3 bg-stone-800 text-white
                text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                transition-all duration-200 touch-manipulation
                hover:bg-stone-700 active:bg-stone-900
                disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none
              "
            >
              {orderState === "loading" ? "Placing…" : "Place Order"}
            </button>
          </div>
          {orderState === "error" && (
            <p className="text-center text-xs text-red-400 font-sans mt-2">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      )}
    </main>
  );
}

// ─── Confirmation screen ──────────────────────────────────────
function ConfirmedState({ name, orderRef, drinkName }: { name: string; orderRef: string; drinkName: string }) {
  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-sans font-medium">hello kopi</span>
          <div className="w-6 h-px bg-stone-300 mt-1" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 font-sans">Order placed</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800">{name}</h1>
          <p className="font-serif text-xl font-light italic text-stone-500 mt-1">{drinkName}</p>
          <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-stone-100 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-sans">Order reference</p>
            <p className="font-serif text-3xl sm:text-4xl font-light tracking-[0.2em] text-stone-700">{orderRef}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <Link href="/orders" className="w-full sm:w-auto sm:px-8 py-3.5 text-center bg-stone-800 text-white text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 touch-manipulation hover:bg-stone-700 focus:outline-none">
            View Orders
          </Link>
          <Link href="/" className="w-full sm:w-auto sm:px-8 py-3.5 text-center border border-stone-300 text-stone-500 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 touch-manipulation hover:border-stone-600 hover:text-stone-700 focus:outline-none">
            Back
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
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
