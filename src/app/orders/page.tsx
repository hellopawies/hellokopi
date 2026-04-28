"use client";

import { useEffect, useState, useCallback } from "react";
import BrewingCup from "@/app/components/BrewingCup";
import { supabase, isConfigured } from "@/lib/supabase";
import { groupOrders } from "@/lib/groupOrders";
import type { Order, DateGroup, Session } from "@/types/order";
import { SESSION_MS, TIMEZONE_SG } from "@/lib/constants";

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

function buildShareText(session: Session): string {
  const drinkGroups = groupByDrink(session);
  const cups = drinkGroups.reduce((sum, g) => sum + g.names.length, 0);
  const icedCups = drinkGroups.reduce((sum, g) => sum + (/\bpeng\b/i.test(g.drink) ? g.names.length : 0), 0);
  const hotCups = cups - icedCups;
  const timeStart = session.sessionStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE_SG });
  const timeEnd = new Date(session.sessionStart.getTime() + SESSION_MS).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE_SG });
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
      return `${drink}${qty}`;
    }),
    "",
    totalParts.join(" · "),
  ];
  return lines.join("\n");
}

function WhatsAppShareButton({ session }: { session: Session }) {
  function handleShare() {
    const url = `https://wa.me/?text=${encodeURIComponent(buildShareText(session))}`;
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

export default function OrdersPage() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [quip, setQuip] = useState("");

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
      if (error) throw error;
      const g = groupOrders(data as Order[]);
      setGroups(g);
      if (g.length > 0) setSelectedDate(g[0].dateKey);
    } catch {
      setError(true);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isConfigured) return;
    const interval = setInterval(silentRefresh, 10000);
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        silentRefresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        silentRefresh();
      })
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [silentRefresh]);

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
                <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
                  Orders
                </h1>
                {isConfigured && (
                  <span className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400 dark:text-stone-500">Live</span>
                  </span>
                )}
              </div>
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
              <div className="relative flex bg-stone-100 dark:bg-stone-900 rounded-full p-1">
                <div
                  className="absolute top-1 bottom-1 bg-white dark:bg-stone-700 shadow-sm rounded-full pointer-events-none"
                  style={{
                    left: 4,
                    width: `calc((100% - 8px) / ${visibleGroups.length})`,
                    transform: `translateX(${tabIndex * 100}%)`,
                    transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                {visibleGroups.map(({ dateKey }) => (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`
                      relative z-10 flex-1 py-1.5 text-center text-[10px] uppercase tracking-[0.15em]
                      font-sans font-medium rounded-full transition-colors duration-200 touch-manipulation whitespace-nowrap
                      ${selectedDate === dateKey
                        ? "text-stone-800 dark:text-stone-100"
                        : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"}
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

      {/* Content */}
      <div className="px-5 sm:px-8 pt-6 pb-16">
        <div className="max-w-lg mx-auto">

          {loading && <BrewingCup />}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-20">
              <p className="text-sm font-sans text-stone-500 dark:text-stone-400 text-center">
                Couldn&apos;t load orders — check your connection.
              </p>
              <button
                onClick={load}
                className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-600 px-5 py-2.5 rounded-xl hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all duration-200 touch-manipulation shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
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
            <div className="flex flex-col items-center gap-3 py-24">
              <div className="w-px h-10 bg-stone-200 dark:bg-stone-700" />
              <p className="font-serif text-lg font-light italic text-stone-400 dark:text-stone-500">
                No orders yet.
              </p>
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
                return (
                  <div key={si}>
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] uppercase tracking-[0.2em] text-stone-700 dark:text-stone-200 font-sans font-medium">
                          {session.sessionStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE_SG })}
                          {" – "}
                          {new Date(session.sessionStart.getTime() + SESSION_MS).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE_SG })}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-800 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-[11px] font-sans font-medium tracking-wide">
                          {cups} {cups === 1 ? "cup" : "cups"}
                        </span>
                        {hotCups > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-[11px] font-sans font-medium tabular-nums tracking-wide">
                            {hotCups} hot
                          </span>
                        )}
                        {icedCups > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full border bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-500 dark:text-blue-400 text-[11px] font-sans font-medium tabular-nums tracking-wide">
                            {icedCups} iced
                          </span>
                        )}
                        <Countdown sessionStart={session.sessionStart} />
                      </div>
                      <WhatsAppShareButton session={session} />
                    </div>
                    <div className="border-t border-stone-100 dark:border-stone-800">
                      {drinkGroups.map(({ drink, names }) => (
                        <div
                          key={drink}
                          className="py-3.5 border-b border-stone-100 dark:border-stone-800"
                        >
                          <p className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100 leading-snug">
                            {drink}
                            {names.length > 1 && (
                              <span className="ml-1.5 px-1.5 py-0.5 border border-stone-200 dark:border-stone-600 rounded-full text-[10px] font-sans font-medium text-stone-500 dark:text-stone-400 tracking-wide align-middle">
                                × {names.length}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500 mt-1 leading-relaxed">
                            {(() => {
                              const counts = new Map<string, number>();
                              for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
                              return [...counts.entries()].map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join(" · ");
                            })()}
                          </p>
                        </div>
                      ))}
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
