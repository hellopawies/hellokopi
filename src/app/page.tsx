"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";

const COLLEAGUES_FALLBACK = [
  "Aaron", "Steve", "YK", "Kristie", "Alvin",
  "Saw", "Jerwin", "Kai Mun", "Adric", "Zaki", "Rob", "Others",
];

// Persists across client-side navigations so animations only fire on fresh page load
let hasMounted = false;

function getGreeting(): string {
  const hour = parseInt(
    new Date().toLocaleString("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", hour12: false })
  );
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function GreetingPage() {
  const [greeting, setGreeting] = useState("");
  const [colleagues, setColleagues] = useState<string[]>(COLLEAGUES_FALLBACK);
  // Read synchronously so the correct view renders on first paint — no state flip or black flash
  const [cachedName, setCachedName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("hellokopi_name"); } catch { return null; }
  });
  const [selected, setSelected] = useState("");
  const [otherName, setOtherName] = useState("");
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [firstLoad] = useState(!hasMounted);
  const [nameSearch, setNameSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    hasMounted = true;
    setGreeting(getGreeting());
    setReady(true);
    if (isConfigured) {
      supabase.from("members").select("name, sort_order").order("sort_order")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setColleagues([...data.map((m: { name: string }) => m.name), "Others"]);
          }
        });
    }
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

  useEffect(() => {
    if (open) {
      setNameSearch("");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  const filteredColleagues = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    if (!q) return colleagues;
    const hasOthers = colleagues.includes("Others");
    const filtered = colleagues.filter((n) => n !== "Others" && n.toLowerCase().includes(q));
    return hasOthers ? [...filtered, "Others"] : filtered;
  }, [nameSearch, colleagues]);

  const isOthers = selected === "Others";
  const canContinue = selected && (!isOthers || otherName.trim());

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    const name = isOthers ? otherName.trim() : selected;
    try { localStorage.setItem("hellokopi_name", name); } catch {}
    router.push(`/order?name=${encodeURIComponent(name)}`);
  };

  const handleCachedContinue = () => {
    if (!cachedName) return;
    router.push(`/order?name=${encodeURIComponent(cachedName)}`);
  };

  const handleNotMe = () => {
    try { localStorage.removeItem("hellokopi_name"); } catch {}
    setCachedName(null);
  };

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      {/* Ambient gradient drift */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden dark:opacity-0">
        <div
          className="absolute w-[130%] h-[130%] -top-[15%] -left-[15%]"
          style={{
            background: "radial-gradient(ellipse 55% 45% at 35% 42%, rgba(214,211,209,0.55) 0%, transparent 65%)",
            animation: "gradientDrift 18s ease-in-out infinite",
          }}
        />
      </div>
      <div
        className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8 sm:gap-10"
      >
        {/* Brand */}
        <div
          style={firstLoad ? (ready ? { animation: "fadeUp 0.7s ease-out both" } : { opacity: 0 }) : {}}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1" />
        </div>

        {cachedName ? (
          /* ── Returning user view ── */
          <>
            <div
              style={firstLoad ? (ready ? { animation: "fadeUp 0.7s 0.15s ease-out both" } : { opacity: 0 }) : {}}
              className="flex flex-col items-center gap-3 sm:gap-4"
            >
              <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
                {greeting},
              </h1>
              <p className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 dark:text-stone-100">
                {cachedName}.
              </p>
              <p className="font-serif text-lg sm:text-xl font-light italic text-stone-400 dark:text-stone-500 leading-relaxed mt-1">
                Start ordering?
              </p>
            </div>

            <div
              style={firstLoad ? (ready ? { animation: "fadeUp 0.7s 0.3s ease-out both" } : { opacity: 0 }) : {}}
              className="w-full flex flex-col items-center gap-4"
            >
              <button
                onClick={handleCachedContinue}
                className="
                  mt-1 w-full sm:w-auto sm:px-10 py-3.5 rounded-xl
                  border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300
                  text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                  transition-all duration-200 touch-manipulation
                  shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
                  hover:bg-stone-800 dark:hover:bg-stone-300 hover:text-white dark:hover:text-stone-900
                  active:bg-stone-800 dark:active:bg-stone-300 active:text-white dark:active:text-stone-900
                  focus:outline-none
                "
              >
                Continue
              </button>
              <button
                onClick={handleNotMe}
                className="text-[11px] font-sans text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors duration-200 touch-manipulation tracking-wide"
              >
                Not {cachedName}?
              </button>
            </div>
          </>
        ) : (
          /* ── First-time / selector view ── */
          <>
            <div
              style={firstLoad ? (ready ? { animation: "fadeUp 0.7s 0.15s ease-out both" } : { opacity: 0 }) : {}}
              className="flex flex-col items-center gap-3 sm:gap-4"
            >
              <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
                {greeting}
              </h1>
              <p className="font-serif text-lg sm:text-xl font-light italic text-stone-400 dark:text-stone-500 leading-relaxed">
                Who shall we say is ordering?
              </p>
            </div>

            <form
              onSubmit={handleContinue}
              className="w-full flex flex-col items-center gap-5 sm:gap-6"
              style={firstLoad ? (ready ? { animation: "fadeUp 0.7s 0.3s ease-out both" } : { opacity: 0 }) : {}}
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

                {open && (
                  <div className="
                    absolute top-full left-0 right-0 z-10 mt-1
                    bg-[#FAFAF8] dark:bg-[#2c2c2c] border border-stone-200 dark:border-stone-600 rounded-xl shadow-md dark:shadow-black
                    overflow-hidden
                  ">
                    <div className="px-4 py-2.5 border-b border-stone-100 dark:border-[#3a3a3a]">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        placeholder="Search…"
                        className="w-full bg-transparent text-center text-sm font-sans font-light text-stone-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 focus:outline-none tracking-wide"
                      />
                    </div>
                    <div className="max-h-[45vh] overflow-y-auto divide-y divide-stone-100 dark:divide-[#3a3a3a]">
                      {filteredColleagues.length === 0 ? (
                        <p className="px-4 py-3.5 text-center text-sm font-sans font-light italic text-stone-300 dark:text-stone-600">No match.</p>
                      ) : filteredColleagues.map((name) => (
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
                  </div>
                )}
              </div>

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
                  mt-1 w-full sm:w-auto sm:px-10 py-3.5 rounded-xl
                  border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300
                  text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                  transition-all duration-200 touch-manipulation
                  shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]
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
          </>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 sm:bottom-8 flex justify-center">
        <Link
          href="/changelog"
          className="text-[10px] font-sans text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors duration-200 tracking-wide"
        >
          v3.0.0
        </Link>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
