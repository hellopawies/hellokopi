"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const COLLEAGUES = [
  "Aaron", "Steve", "YK", "Kristie", "Alvin",
  "Saw", "Jerwin", "Kai Mun", "Adric", "Zaki", "Others",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function GreetingPage() {
  const [greeting, setGreeting] = useState("");
  const [selected, setSelected] = useState("");
  const [otherName, setOtherName] = useState("");
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setGreeting(getGreeting());
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isOthers = selected === "Others";
  const canContinue = selected && (!isOthers || otherName.trim());

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    const name = isOthers ? otherName.trim() : selected;
    router.push(`/order?name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] dark:bg-black flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div
        className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8 sm:gap-10"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.6s ease-out" }}
      >
        {/* Brand */}
        <div
          style={{ animation: ready ? "fadeUp 0.7s ease-out forwards" : "none" }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1" />
        </div>

        {/* Greeting */}
        <div
          style={{ animation: ready ? "fadeUp 0.7s 0.15s ease-out both" : "none" }}
          className="flex flex-col items-center gap-3 sm:gap-4"
        >
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
            {greeting}
          </h1>
          <p className="font-serif text-lg sm:text-xl font-light italic text-stone-400 dark:text-stone-500 leading-relaxed">
            Who shall we say is ordering?
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleContinue}
          className="w-full flex flex-col items-center gap-5 sm:gap-6"
          style={{ animation: ready ? "fadeUp 0.7s 0.3s ease-out both" : "none" }}
        >
          {/* Dropdown */}
          <div className="w-full relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="
                w-full bg-transparent border-0 border-b border-stone-300 dark:border-stone-600
                hover:border-stone-600 dark:hover:border-stone-400 focus:border-stone-600 dark:focus:border-stone-400 focus:outline-none
                text-center py-3.5 transition-colors duration-300
                flex items-center justify-center gap-2
                touch-manipulation
              "
            >
              <span className={`text-base sm:text-lg font-sans font-light tracking-wide ${selected ? "text-stone-800 dark:text-stone-100" : "text-stone-300 dark:text-stone-600"}`}>
                {selected || "Select your name"}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Options */}
            {open && (
              <div className="
                absolute top-full left-0 right-0 z-10 mt-1
                bg-white dark:bg-[#2c2c2c] border border-stone-200 dark:border-stone-600 shadow-md dark:shadow-black
                divide-y divide-stone-50 dark:divide-[#3a3a3a]
                max-h-[55vh] overflow-y-auto
              ">
                {COLLEAGUES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setSelected(name); setOpen(false); setOtherName(""); }}
                    className={`
                      w-full px-4 py-3.5 text-center text-sm font-sans font-light tracking-wide
                      transition-colors duration-150 touch-manipulation
                      ${selected === name
                        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900"
                        : "text-stone-600 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#3a3a3a] active:bg-stone-100 dark:active:bg-[#444] hover:text-stone-800 dark:hover:text-stone-100"
                      }
                      ${name === "Others" ? "italic" : ""}
                    `}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Others name input */}
          {isOthers && (
            <div className="w-full" style={{ animation: "fadeUp 0.35s ease-out forwards" }}>
              <input
                type="text"
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="
                  w-full bg-transparent border-0 border-b border-stone-300 dark:border-stone-600
                  focus:border-stone-600 dark:focus:border-stone-400 focus:outline-none
                  text-center text-stone-800 dark:text-stone-100 text-base sm:text-lg font-sans font-light
                  placeholder:text-stone-300 dark:placeholder:text-stone-600 py-3.5 tracking-wide
                  transition-colors duration-300
                "
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!canContinue}
            className="
              mt-1 w-full sm:w-auto sm:px-10 py-3.5
              border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300
              text-[11px] uppercase tracking-[0.25em] font-sans font-medium
              transition-all duration-300 touch-manipulation
              hover:bg-stone-800 dark:hover:bg-stone-300 hover:text-white dark:hover:text-stone-900
              active:bg-stone-800 dark:active:bg-stone-300 active:text-white dark:active:text-stone-900
              disabled:opacity-25 disabled:cursor-not-allowed
              disabled:hover:bg-transparent disabled:hover:text-stone-800 dark:disabled:hover:text-stone-300
              focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 focus:ring-offset-2
            "
          >
            Continue
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 sm:bottom-8 flex flex-col items-center gap-2 pointer-events-none">
        <div className="w-px h-5 sm:h-6 bg-stone-200 dark:bg-stone-700" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-stone-300 dark:text-stone-600 font-sans">
          Lunch Orders
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
