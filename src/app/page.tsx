"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

function getDateLine(): string {
  const sgNow = new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE_SG }));
  return sgNow.toLocaleDateString("en-GB", {
    timeZone: TIMEZONE_SG, weekday: "long", day: "numeric", month: "long",
  });
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
  const [dateLine, setDateLine] = useState("");
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
    setDateLine(getDateLine());
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
      {/* Newsprint pass: matte cream / pure black background. Ambient
          gradient washes are dialled to ~0 — broadsheets don't glow. */}
      <div
        className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8 sm:gap-10"
      >
        {/* Masthead — heavy rule above + below, wordmark + cup pictogram
            between them. Reads like a newspaper nameplate. */}
        <div
          style={firstLoad ? (ready ? { animation: "fadeUp 0.7s ease-out both" } : { opacity: 0 }) : {}}
          className="flex flex-col items-center gap-2.5 w-full"
        >
          <div className="w-full h-[3px] bg-stone-900 dark:bg-stone-100" />
          <div className="flex items-center gap-2.5 py-1">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className="text-stone-800 dark:text-stone-200" aria-hidden="true">
              <path d="M5 9 L6.5 18 Q6.8 19.5 8 19.5 L14 19.5 Q15.2 19.5 15.5 18 L17 9 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
              <path d="M15.5 12 Q19.5 12 19.5 14.5 Q19.5 17 15.5 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M3.5 21.5 Q11 23 18.5 21.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
            </svg>
            <span className="font-serif text-base font-light tracking-wide text-stone-900 dark:text-stone-100">
              Hello Kopi
            </span>
          </div>
          <div className="w-full h-px bg-stone-900 dark:bg-stone-100" />
          {/* Issue line — italic, like a newspaper's volume / date */}
          <p className="font-serif italic font-light text-[12px] text-stone-500 dark:text-stone-400 leading-none">
            {dateLine || " "} <span className="not-italic mx-1">·</span> Daily edition
          </p>
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
                  mt-1 w-full sm:w-auto sm:px-12 py-3.5
                  border-2 border-stone-900 dark:border-stone-100
                  bg-transparent text-stone-900 dark:text-stone-100
                  font-serif text-lg font-light italic tracking-wide
                  transition-colors duration-200 touch-manipulation
                  hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-cream dark:hover:text-stone-900
                  active:bg-stone-900 dark:active:bg-stone-100 active:text-cream dark:active:text-stone-900
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
              {/* Bylines — names presented as a serif column with hairline
                  separators, the way a magazine lists its contributors.
                  Selected name gets a heavier weight + ink-fill background.
                  Touch target remains ≥40px tall. */}
              <p className="text-[10px] uppercase tracking-[0.22em] font-sans font-medium text-stone-500 dark:text-stone-400">
                Sign your name
              </p>
              <div className="w-full flex flex-col border-t border-b border-stone-900 dark:border-stone-100 divide-y divide-stone-200 dark:divide-stone-800">
                {colleagues.map((c) => {
                  const isSelected = selected === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => { setSelected(c.name); if (c.name !== "Others") setOtherName(""); }}
                      aria-pressed={isSelected}
                      className={`w-full py-3 font-serif text-lg font-light tracking-wide transition-colors duration-200 touch-manipulation ${
                        isSelected
                          ? "bg-stone-900 dark:bg-stone-100 text-cream dark:text-stone-900 italic"
                          : "text-stone-800 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-900"
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
                  mt-1 w-full sm:w-auto sm:px-12 py-3.5
                  border-2 border-stone-900 dark:border-stone-100
                  bg-transparent text-stone-900 dark:text-stone-100
                  font-serif text-lg font-light italic tracking-wide
                  transition-colors duration-200 touch-manipulation
                  hover:bg-stone-900 dark:hover:bg-stone-100 hover:text-cream dark:hover:text-stone-900
                  active:bg-stone-900 dark:active:bg-stone-100 active:text-cream dark:active:text-stone-900
                  disabled:opacity-25 disabled:cursor-not-allowed
                  disabled:hover:bg-transparent disabled:hover:text-stone-900 dark:disabled:hover:text-stone-100
                  focus:outline-none
                "
              >
                Continue
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer — newsprint colophon. Italic serif so the version reads
          like a small-print issue line at the foot of a broadsheet. */}
      <div className="absolute bottom-6 sm:bottom-8 flex justify-center">
        <span className="font-serif italic font-light text-[12px] text-stone-400 dark:text-stone-500">
          {VERSIONS[0].version}
        </span>
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
