"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";

type State = "idle" | "loading" | { orderRef: string } | "error";

function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";
  const [state, setState] = useState<State>("idle");

  async function placeOrder() {
    setState("loading");
    const orderRef = generateOrderRef();
    try {
      const { error } = await supabase
        .from("orders")
        .insert({ order_ref: orderRef, person_name: name, items: [] });
      if (error) throw error;
      setState({ orderRef });
    } catch {
      setState("error");
    }
  }

  if (typeof state === "object") {
    return <ConfirmedState name={name} orderRef={state.orderRef} />;
  }

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
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 leading-tight">
            Hello, {name}
          </h1>
          <p className="font-serif text-lg font-light italic text-stone-400">
            What would you like today?
          </p>
        </div>

        {/* Drink selection placeholder */}
        <div className="w-full border border-dashed border-stone-200 py-10 flex items-center justify-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-300 font-sans">
            Drink selection coming soon
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={placeOrder}
            disabled={state === "loading" || !isConfigured}
            className="
              w-full sm:w-auto sm:px-10 py-3.5
              border border-stone-800 text-stone-800
              text-[11px] uppercase tracking-[0.25em] font-sans font-medium
              transition-all duration-300 touch-manipulation
              hover:bg-stone-800 hover:text-white
              active:bg-stone-800 active:text-white
              disabled:opacity-25 disabled:cursor-not-allowed
              focus:outline-none
            "
          >
            {state === "loading" ? "Placing…" : "Place Order"}
          </button>

          {state === "error" && (
            <p className="text-xs text-red-400 font-sans">
              Something went wrong. Please try again.
            </p>
          )}
          {!isConfigured && (
            <p className="text-[10px] text-stone-300 font-sans uppercase tracking-widest">
              Supabase not configured
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
    </main>
  );
}

function ConfirmedState({ name, orderRef }: { name: string; orderRef: string }) {
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

        <div className="flex flex-col items-center gap-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 font-sans">
            Order placed
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800">
            {name}
          </h1>
          <div className="flex flex-col items-center gap-1.5 mt-2">
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
