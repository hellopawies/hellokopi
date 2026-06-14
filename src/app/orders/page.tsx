"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SessionSkeleton } from "@/app/components/Skeleton";
import { useDelayed } from "@/lib/useDelayed";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { groupOrders } from "@/lib/groupOrders";
import { drinkColor } from "@/lib/drinkColor";
import { displayDrinkName } from "@/lib/drinkName";
import { useLanguage } from "@/lib/language";
import { TempIcon } from "@/app/components/TempIcon";
import type { Order, DateGroup, Session } from "@/types/order";
import { SESSION_MS, TIMEZONE_SG, formatTime } from "@/lib/constants";

function groupByDrink(session: Session): { drink: string; names: string[] }[] {
  const map = new Map<string, string[]>();
  for (const order of session.orders) {
    for (const item of order.items ?? []) {
      if (!item?.name) continue;
      if (!map.has(item.name)) map.set(item.name, []);
      map.get(item.name)!.push(order.person_name);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([drink, names]) => ({ drink, names }));
}

function dateLabel(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00+08:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TIMEZONE_SG });
}

function getInitials(n: string): string {
  return n.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2);
}

// One-line summary for the live ticker — "Kopi C × 2" or "Kopi C + 1 more".
function describeOrderItems(items: { name: string }[], lang: "en" | "sin"): string {
  if (items.length === 0) return "";
  const counts = new Map<string, number>();
  for (const i of items) counts.set(i.name, (counts.get(i.name) ?? 0) + 1);
  const entries = [...counts.entries()];
  if (entries.length === 1) {
    const [n, qty] = entries[0];
    const display = displayDrinkName(n, lang);
    return qty > 1 ? `${display} × ${qty}` : display;
  }
  const [first] = entries;
  return `${displayDrinkName(first[0], lang)} + ${entries.length - 1} more`;
}

const QUIPS = [
  "So who's paying today?",
  "Today's forecast: 100% chance of kopi.",
  "No kopi, no talk.",
  "Confirm plus chop, someone forgot to order.",
  "Your kopi order says a lot about you.",
  "Boss says no OT, but the kopi must flow.",
  "All drinks, no drama. Hopefully.",
  "The real question: who's going to collect?",
  "Kopi first, meetings second.",
  "One does not simply skip kopi.",
];

// Day-aware quips — weighted in on the right day of the week.
const FRIDAY_QUIPS = [
  "TGIF kopi run incoming?",
  "Friday energy is real.",
  "Last kopi before the weekend.",
  "Knock-off mood, kopi mood.",
];
const MONDAY_QUIPS = [
  "Easing into the week, kopi-style.",
  "Monday's a state of mind. Kopi helps.",
  "Soft launch into the week.",
];
const PAYDAY_QUIPS = [
  "Payday energy. Treat the table?",
  "Pay just dropped — your shout?",
  "Today's order's on the boss. (Allegedly.)",
];

function pickQuip(): string {
  const sgNow = new Date(new Date().toLocaleString("en-US", { timeZone: TIMEZONE_SG }));
  const day = sgNow.getDay();      // 0 = Sun, 5 = Fri
  const date = sgNow.getDate();    // most SG salaries land late month
  const pool = [...QUIPS];
  if (day === 5) pool.push(...FRIDAY_QUIPS, ...FRIDAY_QUIPS); // doubled weight
  if (day === 1) pool.push(...MONDAY_QUIPS);
  if (date >= 25 || date <= 2) pool.push(...PAYDAY_QUIPS);
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildShareText(session: Session, lang: "en" | "sin"): string {
  const drinkGroups = groupByDrink(session);
  const cups = drinkGroups.reduce((sum, g) => sum + g.names.length, 0);
  const icedCups = drinkGroups.reduce((sum, g) => sum + (/\bpeng\b/i.test(g.drink) ? g.names.length : 0), 0);
  const hotCups = cups - icedCups;
  const timeStart = formatTime(session.sessionStart);
  const timeEnd = formatTime(new Date(session.sessionStart.getTime() + SESSION_MS));
  const date = session.sessionStart.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TIMEZONE_SG });

  const totalParts = [`${cups} ${cups === 1 ? "cup" : "cups"}`];
  if (hotCups > 0) totalParts.push(`${hotCups} hot`);
  if (icedCups > 0) totalParts.push(`${icedCups} iced`);

  const lines = [
    `☕ Drinks Order - ${date}`,
    `${timeStart}–${timeEnd}`,
    "",
    ...drinkGroups.map(({ drink, names }) => {
      const qty = names.length > 1 ? ` × ${names.length}` : "";
      return `${displayDrinkName(drink, lang)}${qty}`;
    }),
    "",
    totalParts.join(" · "),
  ];
  return lines.join("\n");
}

function WhatsAppShareButton({ session }: { session: Session }) {
  const { lang } = useLanguage();
  function handleShare() {
    const url = `https://wa.me/?text=${encodeURIComponent(buildShareText(session, lang))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleShare}
      title="Share on WhatsApp"
      className="p-1.5 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-200 touch-manipulation focus:outline-none"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </button>
  );
}

function Countdown({ sessionStart }: { sessionStart: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = sessionStart.getTime() + SESSION_MS - now;
  if (remaining <= 0) return null;

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const label = mins > 0 ? `${mins}m ${secs}s left` : `${secs}s left`;
  const urgent = remaining < 2 * 60000;
  const warning = remaining < 5 * 60000;
  const bgColour = urgent
    ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400"
    : warning
    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
    : "bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-sans font-medium tabular-nums tracking-wide ${bgColour}`}>
      {label}
    </span>
  );
}

/** Time-of-day-aware empty-state line shown when no orders exist yet. */
function emptyStateLine(): string {
  const h = new Date().getHours();
  if (h < 11) return "Quiet morning. First sip's all yours.";
  if (h < 14) return "Lunch lull — be the first to call a run?";
  if (h < 17) return "Afternoon slump approaching. Just saying.";
  if (h < 21) return "Evening hush. Nobody's brewing.";
  return "Late-night quiet — nothing in the cup yet.";
}

export default function OrdersPage() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Gate the skeleton placeholder so it only shows if the fetch actually
  // takes >200ms. Fast loads (cached, fresh page) skip straight to content.
  const showSkeleton = useDelayed(200);
  // Tracks whether the component is still mounted, so async fetches don't
  // setState after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const { lang } = useLanguage();
  // Mirror lang into a ref so the realtime channel handler reads the latest
  // value at INSERT time without forcing the channel to resubscribe.
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [quip, setQuip] = useState("");
  // Ephemeral "told the cashier" ticks — never persisted; resets on refresh.
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  // Who's currently on /order (picking right now). Listen-only — /orders
  // doesn't track itself onto the channel.
  const [presentPickers, setPresentPickers] = useState<string[]>([]);
  // Last new order that came in via realtime — surfaces as a transient line
  // at the top of the content area, auto-clears after a few seconds.
  const [latestActivity, setLatestActivity] = useState<{ name: string; drinkLabel: string; at: number } | null>(null);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggleTick(key: string) {
    setTicked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  useEffect(() => {
    setQuip(pickQuip());
  }, []);

  const silentRefresh = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (!mountedRef.current) return;
      if (data) {
        const g = groupOrders(data as Order[]);
        setGroups(g);
      }
    } catch { /* silent */ }
  }, []);

  const load = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .abortSignal(controller.signal);
      if (!mountedRef.current) return;
      if (error) throw error;
      const g = groupOrders(data as Order[]);
      setGroups(g);
      if (g.length > 0) setSelectedDate(g[0].dateKey);
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      clearTimeout(timer);
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isConfigured) return;
    const interval = setInterval(silentRefresh, 10000);
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as { person_name?: string; items?: { name: string }[] };
        if (mountedRef.current && row.person_name && Array.isArray(row.items)) {
          if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
          setLatestActivity({
            name: row.person_name,
            drinkLabel: describeOrderItems(row.items, langRef.current),
            at: Date.now(),
          });
          activityTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setLatestActivity(null);
          }, 6000);
        }
        silentRefresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        silentRefresh();
      })
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [silentRefresh]);

  // Listen-only presence on the ordering-presence channel — surface who's on
  // /order right now without registering ourselves as a picker.
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase.channel("ordering-presence");
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string }>();
        const all = (Object.values(state) as { name: string }[][])
          .flat()
          .map((p) => p.name);
        if (mountedRef.current) setPresentPickers([...new Set(all)]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const visibleGroups = groups.slice(0, 3);
  const tabIndex = Math.max(visibleGroups.findIndex((g) => g.dateKey === selectedDate), 0);
  const activeGroup = groups.find((g) => g.dateKey === selectedDate) ?? null;

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black pb-16">

      {/* Sticky header */}
      <div className="liquid-glass-top sticky top-0 z-30 bg-[#FAFAF8]/80 dark:bg-black/75">

        {/* Heading */}
        <div className="px-5 sm:px-8 pt-16 sm:pt-10 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <h1 className="font-serif text-[2.4rem] sm:text-[3rem] font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
                  Orders
                </h1>
                {isConfigured && (
                  <span className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400 dark:text-stone-500">Live</span>
                  </span>
                )}
              </div>
              {presentPickers.length > 0 && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="flex items-center -space-x-1">
                    {presentPickers.slice(0, 4).map((user) => (
                      <span
                        key={user}
                        title={`${user} is picking`}
                        className="relative w-[20px] h-[20px] rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[7px] font-sans font-semibold text-stone-500 dark:text-stone-400 shadow-sm"
                      >
                        {getInitials(user)}
                        <span className="absolute bottom-[-1px] right-[-1px] w-[5px] h-[5px] rounded-full bg-green-400 border border-white dark:border-black" />
                      </span>
                    ))}
                    {presentPickers.length > 4 && (
                      <span className="w-[20px] h-[20px] rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[7px] font-sans font-semibold text-stone-400 dark:text-stone-500">
                        +{presentPickers.length - 4}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400 dark:text-stone-500 hidden sm:inline">picking</span>
                </div>
              )}
            </div>
            {quip && (
              <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 dark:text-stone-500 mt-1.5">
                {quip}
              </p>
            )}
          </div>
        </div>

        {/* Day tabs */}
        <div className="px-5 sm:px-8 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto">
            {visibleGroups.length > 0 ? (
              <div className="relative flex border-y-2 border-stone-900 dark:border-stone-100">
                <div
                  className="absolute top-0 bottom-0 bg-stone-900 dark:bg-stone-100 pointer-events-none"
                  style={{
                    width: `calc(100% / ${visibleGroups.length})`,
                    transform: `translateX(${tabIndex * 100}%)`,
                    transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                {visibleGroups.map(({ dateKey }) => (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`
                      relative z-10 flex-1 py-2.5 text-center text-[11px] uppercase tracking-[0.2em]
                      font-sans font-medium transition-colors duration-200 touch-manipulation whitespace-nowrap
                      ${selectedDate === dateKey
                        ? "text-cream dark:text-stone-900"
                        : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"}
                    `}
                  >
                    {dateLabel(dateKey)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-[34px]" />
            )}
          </div>
        </div>
      </div>

      {/* Live ticker — appears for ~6s on each new INSERT from the realtime channel */}
      {latestActivity && (
        <div
          key={latestActivity.at}
          className="px-5 sm:px-8 pt-3"
          style={{ animation: "tabIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <p className="max-w-lg mx-auto text-[11px] font-sans text-stone-500 dark:text-stone-400 text-center">
            <span className="font-serif italic text-stone-400 dark:text-stone-500">Just now · </span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{latestActivity.name}</span>
            <span> ordered </span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{latestActivity.drinkLabel}</span>
          </p>
        </div>
      )}

      {/* Content */}
      <div className="px-5 sm:px-8 pt-6 pb-16">
        <div className="max-w-lg mx-auto">

          {loading && showSkeleton && (
            <div className="flex flex-col gap-5" role="status" aria-label="Loading orders">
              <SessionSkeleton />
              <SessionSkeleton />
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-20">
              <p className="text-sm font-sans text-stone-500 dark:text-stone-400 text-center">
                Couldn&apos;t load orders — check your connection.
              </p>
              <button
                onClick={load}
                className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-600 px-5 py-2.5 rounded-xl hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all duration-200 ease-spring touch-manipulation shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !isConfigured && (
            <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-20">
              Supabase not configured
            </p>
          )}
          {!loading && !error && isConfigured && groups.length === 0 && (
            // Friendlier empty state — small cup outline + time-aware
            // copy + a way back to /order so the page isn't a dead end.
            <div className="flex flex-col items-center gap-5 py-20">
              <svg viewBox="0 0 64 64" width="48" height="48" className="text-stone-300 dark:text-stone-700" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M16 26 L20 50 Q21 54 25 54 L39 54 Q43 54 44 50 L48 26 Z" strokeLinejoin="round" />
                <path d="M44 34 Q54 34 54 41 Q54 48 44 48" strokeLinecap="round" />
                <path d="M12 56 Q32 61 52 56" strokeLinecap="round" opacity="0.6" />
              </svg>
              <div className="flex flex-col items-center gap-1.5">
                <p className="font-serif text-lg font-light italic text-stone-500 dark:text-stone-400">
                  {emptyStateLine()}
                </p>
                <p className="text-[11px] uppercase tracking-[0.22em] font-sans text-stone-400 dark:text-stone-500">
                  Nothing brewing yet
                </p>
              </div>
              <Link
                href="/order"
                className="mt-1 text-[10px] uppercase tracking-[0.25em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-full hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all duration-200 ease-spring touch-manipulation active:scale-[0.95]"
              >
                Start a kopi run →
              </Link>
            </div>
          )}

          {/* Sessions for selected day */}
          {activeGroup && (
            <div className="flex flex-col gap-8">
              {activeGroup.sessions.map((session, si) => {
                const drinkGroups = groupByDrink(session);
                const cups = drinkGroups.reduce((sum, g) => sum + g.names.length, 0);
                // "Peng" is the kopitiam marker for iced — anything else counts as hot.
                const icedCups = drinkGroups.reduce((sum, g) => sum + (/\bpeng\b/i.test(g.drink) ? g.names.length : 0), 0);
                const hotCups = cups - icedCups;
                const sessionClosed = Date.now() > session.sessionStart.getTime() + SESSION_MS;
                const lastOrderTime = session.orders.length > 0
                  ? Math.max(...session.orders.map((o) => new Date(o.created_at).getTime()))
                  : session.sessionStart.getTime();
                const fillMs = Math.max(0, lastOrderTime - session.sessionStart.getTime());
                const fillMin = Math.floor(fillMs / 60000);
                const fillSec = Math.floor((fillMs % 60000) / 1000);
                const fillLabel = fillMin > 0 ? `${fillMin}m ${fillSec}s` : `${fillSec}s`;
                const peopleCount = new Set(session.orders.map((o) => o.person_name)).size;
                return (
                  <div key={si} className="border-t-2 border-stone-900 dark:border-stone-100 pt-4">
                    {/* Session header — newsprint masthead-row style: italic
                        serif time range, square stat tags, kept readable
                        with rounded-sm corners on the inline tags. */}
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-serif italic text-lg font-light text-stone-900 dark:text-stone-100 tracking-wide">
                          {formatTime(session.sessionStart)} – {formatTime(new Date(session.sessionStart.getTime() + SESSION_MS))}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-stone-900 dark:bg-stone-100 text-cream dark:text-stone-900 text-[11px] font-sans font-medium tracking-wide rounded-sm">
                          {cups} {cups === 1 ? "cup" : "cups"}
                        </span>
                        {hotCups > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 border-2 border-red-500 dark:border-red-400 text-red-500 dark:text-red-400 text-[11px] font-sans font-medium tabular-nums tracking-wide rounded-sm">
                            {hotCups} hot
                          </span>
                        )}
                        {icedCups > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 border-2 border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 text-[11px] font-sans font-medium tabular-nums tracking-wide rounded-sm">
                            {icedCups} iced
                          </span>
                        )}
                        <Countdown sessionStart={session.sessionStart} />
                      </div>
                      <WhatsAppShareButton session={session} />
                    </div>
                    {sessionClosed && !(fillMs === 0 && peopleCount === 1) && (
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium mb-3 -mt-1 tabular-nums">
                        Filled in {fillLabel} · {peopleCount} {peopleCount === 1 ? "person" : "people"}
                      </p>
                    )}
                    <div className="border-t border-stone-100 dark:border-stone-800">
                      {drinkGroups.map(({ drink, names }) => {
                        const tickKey = `${session.sessionStart.getTime()}:${drink}`;
                        const isTicked = ticked.has(tickKey);
                        return (
                          <button
                            type="button"
                            key={drink}
                            onClick={() => toggleTick(tickKey)}
                            aria-pressed={isTicked}
                            className={`w-full text-left py-3.5 px-2 -mx-2 border-b border-stone-300 dark:border-stone-700 transition-colors duration-200 touch-manipulation hover:bg-stone-100/60 dark:hover:bg-stone-900/60 ${isTicked ? "opacity-40" : ""}`}
                          >
                            <p className={`font-serif text-base font-light tracking-wide text-stone-900 dark:text-stone-100 leading-snug ${isTicked ? "line-through" : ""}`}>
                              <span
                                aria-hidden="true"
                                className="inline-block w-[8px] h-[8px] mr-2 align-middle flex-shrink-0"
                                style={{ backgroundColor: drinkColor(drink) }}
                              />
                              {displayDrinkName(drink, lang)}
                              <TempIcon name={drink} className="inline w-3 h-3 ml-1.5 align-middle" />
                              {names.length > 1 && (
                                <span className="ml-2 px-1.5 py-0.5 border border-stone-700 dark:border-stone-300 text-[10px] font-sans font-medium text-stone-700 dark:text-stone-300 tracking-wide align-middle tabular-nums">
                                  × {names.length}
                                </span>
                              )}
                            </p>
                            <p className="font-serif italic text-[12px] font-light text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                              {(() => {
                                const counts = new Map<string, number>();
                                for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
                                return [...counts.entries()].map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(" · ");
                              })()}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
