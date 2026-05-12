"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VERSIONS } from "@/data/changelog";
import { TIMEZONE_SG } from "@/lib/constants";
import { supabase, isConfigured } from "@/lib/supabase";
import { useLanguage, type Lang } from "@/lib/language";

interface Colleague {
  name: string;
  // Admin's chosen default language for this member. Applied to the app's
  // language toggle when this user picks their name (first-time or
  // identity-switch flow); their session toggle still takes precedence
  // for the rest of the visit.
  default_lang?: Lang;
}

const COLLEAGUES_FALLBACK: Colleague[] = [
  "Aaron", "Steve", "YK", "Kristie", "Alvin",
  "Saw", "Jerwin", "Kai Mun", "Adric", "Zaki", "Rob", "Others",
].map((name) => ({ name }));

// Persists across client-side navigations so animations only fire on fresh page load
let hasMounted = false;

function getGreeting(): string {
  const hour = parseInt(
    new Date().toLocaleString("en-GB", { timeZone: TIMEZONE_SG, hour: "2-digit", hour12: false })
  );
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

const PICK = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function getSubtitle(): string {
  const sgNow = new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE_SG }));
  const hour = sgNow.getHours();
  const day = sgNow.getDay(); // 0 = Sun, 5 = Fri
  if (day === 5 && hour < 17) return PICK(["Friday energy. Treat yourself?", "TGIF kopi run incoming?", "Friday vibes only.", "Reward run?"]);
  if (day === 1 && hour < 12)  return PICK(["Easing into Monday — kopi first?", "Monday gentle start?", "Morning. Kopi to soften the landing?"]);
  if (hour < 11)               return PICK(["Start ordering?", "What's it gonna be?", "Pick your poison.", "Slow start, strong kopi?"]);
  if (hour < 14)               return PICK(["Lunch run?", "Midday refuel?", "Pick your fix."]);
  if (hour < 17)               return PICK(["The 3pm slump? We've got you.", "Afternoon push?", "One more cup till home time."]);
  if (hour < 21)               return PICK(["Working late? Kopi's on you.", "Evening session?", "Last call?"]);
  return PICK(["Burning the midnight oil?", "Late one tonight?", "Quiet hours kopi?"]);
}

export default function GreetingPage() {
  const [greeting, setGreeting] = useState("");
  const [subtitle, setSubtitle] = useState("Start ordering?");
  const [colleagues, setColleagues] = useState<Colleague[]>(COLLEAGUES_FALLBACK);
  // Read synchronously so the correct view renders on first paint — no state flip or black flash
  const [cachedName, setCachedName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("hellokopi_name"); } catch { return null; }
  });
  const [selected, setSelected] = useState("");
  const [otherName, setOtherName] = useState("");
  const [ready, setReady] = useState(false);
  const [firstLoad] = useState(!hasMounted);
  const { setLang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    hasMounted = true;
    setGreeting(getGreeting());
    setSubtitle(getSubtitle());
    setReady(true);
    if (!isConfigured) return;
    let cancelled = false;
    supabase.from("members").select("name, sort_order, default_lang").order("sort_order")
      .then(
        ({ data }) => {
          if (cancelled) return;
          if (data && data.length > 0) {
            type Row = { name: string; default_lang?: Lang };
            const fetched: Colleague[] = (data as Row[]).map((m) => ({
              name: m.name,
              default_lang: m.default_lang === "sin" ? "sin" : "en",
            }));
            setColleagues([...fetched, { name: "Others" }]);
          }
        },
        // Network failure is non-fatal — fall back to the hard-coded COLLEAGUES list.
        () => { /* silent fallback */ },
      );
    return () => { cancelled = true; };
  }, []);

  const isOthers = selected === "Others";
  const canContinue = selected && (!isOthers || otherName.trim());

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    const name = isOthers ? otherName.trim() : selected;
    try { localStorage.setItem("hellokopi_name", name); } catch {}
    // Apply this user's admin-set default language. Others (free-text)
    // has no member row, so keep the current toggle.
    if (!isOthers) {
      const colleague = colleagues.find((c) => c.name === name);
      if (colleague?.default_lang) setLang(colleague.default_lang);
    }
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
                {subtitle}
              </p>
            </div>

            <div
              style={firstLoad ? (ready ? { animation: "fadeUp 0.7s 0.3s ease-out both" } : { opacity: 0 }) : {}}
              className="w-full flex flex-col items-center gap-4"
            >
              <button
                onClick={handleCachedContinue}
                style={{ animation: "btnPulse 2.5s ease-in-out infinite" }}
                className="
                  mt-1 w-full sm:w-auto sm:px-10 py-3.5 rounded-xl
                  border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300
                  text-sm tracking-wide font-sans font-medium
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
              {/* Name chips — same shape and rhythm as the drink-builder base
                  picker (Kopi / Teh / Milo / etc.) for app-wide consistency.
                  Others sits last and reveals a text field below. */}
              <div className="w-full flex flex-wrap gap-2 justify-center">
                {colleagues.map((c) => {
                  const isSelected = selected === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => { setSelected(c.name); if (c.name !== "Others") setOtherName(""); }}
                      aria-pressed={isSelected}
                      className={`px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-200 touch-manipulation active:scale-[0.95] ${
                        isSelected
                          ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200 shadow-md"
                          : "bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
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
                style={canContinue ? { animation: "btnPulse 2.5s ease-in-out infinite" } : undefined}
                className="
                  mt-1 w-full sm:w-auto sm:px-10 py-3.5 rounded-xl
                  border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300
                  text-sm tracking-wide font-sans font-medium
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
          {VERSIONS[0].version}
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
