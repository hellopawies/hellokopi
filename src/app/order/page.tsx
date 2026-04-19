"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-sans font-medium">
          hello kopi
        </span>
        <div className="w-6 h-px bg-stone-300" />
        <h1 className="font-serif text-4xl font-light tracking-wide text-stone-800 leading-tight">
          Hello, {name}
        </h1>
        <p className="font-serif text-lg font-light italic text-stone-400">
          Drink selection coming soon.
        </p>
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
