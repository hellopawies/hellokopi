"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";
import { FAVOURITES, CATEGORIES, type Drink } from "@/data/drinks";

type OrderState = "idle" | "loading" | { orderRef: string; drinkName: string } | "error";

function DrinkCard({
  drink,
  selected,
  onSelect,
}: {
  drink: Drink;
  selected: boolean;
  onSelect: (d: Drink) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(drink)}
      className={`
        text-left p-3.5 border transition-all duration-150 touch-manipulation active:scale-[0.98]
        ${selected
          ? "bg-stone-800 border-stone-800"
          : "border-stone-200 hover:border-stone-400 bg-white active:bg-stone-50"
        }
      `}
    >
      <p className={`text-sm font-sans font-medium leading-snug ${selected ? "text-white" : "text-stone-800"}`}>
        {drink.name}
      </p>
      <p className={`text-[11px] font-sans mt-0.5 leading-snug ${selected ? "text-stone-300" : "text-stone-400"}`}>
        {drink.description}
      </p>
    </button>
  );
}

function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";
  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [tab, setTab] = useState<"favourites" | "all">("favourites");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);

  function toggleCategory(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectDrink(drink: Drink) {
    setSelectedDrink((prev) => (prev?.name === drink.name ? null : drink));
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
    return (
      <ConfirmedState
        name={name}
        orderRef={orderState.orderRef}
        drinkName={orderState.drinkName}
      />
    );
  }

  const isLoading = orderState === "loading";

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      {/* Page header */}
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
        <div className="max-w-lg mx-auto flex gap-7">
          {(["favourites", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                pb-3 text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                border-b-2 transition-colors duration-150 touch-manipulation
                ${tab === t
                  ? "text-stone-800 border-stone-800"
                  : "text-stone-400 border-transparent hover:text-stone-600"
                }
              `}
            >
              {t === "favourites" ? "Favourites" : "All Drinks"}
            </button>
          ))}
        </div>
      </div>

      {/* Drink content */}
      <div className={`px-5 sm:px-8 pt-5 transition-all ${selectedDrink ? "pb-28" : "pb-12"}`}>
        <div className="max-w-lg mx-auto">

          {/* Favourites grid */}
          {tab === "favourites" && (
            <div className="grid grid-cols-2 gap-2.5">
              {FAVOURITES.map((drink) => (
                <DrinkCard
                  key={drink.name}
                  drink={drink}
                  selected={selectedDrink?.name === drink.name}
                  onSelect={selectDrink}
                />
              ))}
            </div>
          )}

          {/* All Drinks accordion */}
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
                        className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                          expanded.has(cat.id) ? "rotate-180" : ""
                        }`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expanded.has(cat.id) && (
                    <div className="pb-2">
                      {cat.drinks.map((drink) => {
                        const isSelected = selectedDrink?.name === drink.name;
                        return (
                          <button
                            key={drink.name}
                            type="button"
                            onClick={() => selectDrink(drink)}
                            className={`
                              w-full flex items-center justify-between
                              px-3 py-3 mb-0.5 text-left touch-manipulation
                              transition-colors duration-150
                              ${isSelected
                                ? "bg-stone-800"
                                : "hover:bg-stone-50 active:bg-stone-100"
                              }
                            `}
                          >
                            <div className="flex flex-col gap-0.5 min-w-0 mr-3">
                              <span className={`text-sm font-sans font-medium truncate ${isSelected ? "text-white" : "text-stone-800"}`}>
                                {drink.name}
                              </span>
                              <span className={`text-[11px] font-sans truncate ${isSelected ? "text-stone-300" : "text-stone-400"}`}>
                                {drink.description}
                              </span>
                            </div>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
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
              <p className="text-sm font-sans font-medium text-stone-800 truncate">
                {selectedDrink.name}
              </p>
              <p className="text-[11px] text-stone-400 font-sans truncate">
                {selectedDrink.description}
              </p>
            </div>
            <button
              onClick={placeOrder}
              disabled={isLoading || !isConfigured}
              className="
                flex-shrink-0 px-6 py-3
                bg-stone-800 text-white
                text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                transition-all duration-200 touch-manipulation
                hover:bg-stone-700 active:bg-stone-900
                disabled:opacity-40 disabled:cursor-not-allowed
                focus:outline-none
              "
            >
              {isLoading ? "Placing…" : "Place Order"}
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

function ConfirmedState({
  name,
  orderRef,
  drinkName,
}: {
  name: string;
  orderRef: string;
  drinkName: string;
}) {
  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-sans font-medium">
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 mt-1" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 font-sans">
            Order placed
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800">
            {name}
          </h1>
          <p className="font-serif text-xl font-light italic text-stone-500 mt-1">
            {drinkName}
          </p>
          <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-stone-100 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-sans">
              Order reference
            </p>
            <p className="font-serif text-3xl sm:text-4xl font-light tracking-[0.2em] text-stone-700">
              {orderRef}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <Link
            href="/orders"
            className="
              w-full sm:w-auto sm:px-8 py-3.5 text-center
              bg-stone-800 text-white
              text-[11px] uppercase tracking-[0.25em] font-sans font-medium
              transition-all duration-300 touch-manipulation
              hover:bg-stone-700 focus:outline-none
            "
          >
            View Orders
          </Link>
          <Link
            href="/"
            className="
              w-full sm:w-auto sm:px-8 py-3.5 text-center
              border border-stone-300 text-stone-500
              text-[11px] uppercase tracking-[0.25em] font-sans font-medium
              transition-all duration-300 touch-manipulation
              hover:border-stone-600 hover:text-stone-700 focus:outline-none
            "
          >
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
