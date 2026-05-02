"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (typeof console !== "undefined") console.error(error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] dark:bg-black flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
            Something cracked.
          </h1>
          <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 dark:text-stone-500 leading-relaxed">
            The kettle slipped — try again?
          </p>
        </div>
        <button
          onClick={reset}
          className="w-full sm:w-auto sm:px-10 py-3.5 rounded-xl border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-200 touch-manipulation hover:bg-stone-800 dark:hover:bg-stone-300 hover:text-white dark:hover:text-stone-900 focus:outline-none"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
