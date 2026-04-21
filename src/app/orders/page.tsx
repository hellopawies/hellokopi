"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { groupOrders } from "@/lib/groupOrders";
import type { Order, DateGroup, Session } from "@/types/order";

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

const SGT = "Asia/Singapore";

function shortLabel(dateKey: string): string {
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: SGT });
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toLocaleDateString("en-CA", { timeZone: SGT });
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  const d = new Date(dateKey + "T00:00:00+08:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: SGT });
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

const SESSION_MS = 15 * 60 * 1000;

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
  const colour = remaining < 2 * 60000
    ? "text-red-400 dark:text-red-500"
    : remaining < 5 * 60000
    ? "text-amber-400 dark:text-amber-500"
    : "text-stone-300 dark:text-stone-600";

  return (
    <span className={`text-[10px] uppercase tracking-[0.2em] font-sans tabular-nums ${colour}`}>
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
    setQuip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
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
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [silentRefresh]);

  const activeGroup = groups.find((g) => g.dateKey === selectedDate) ?? null;

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black pb-16">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#FAFAF8] dark:bg-black">

        {/* Brand + heading */}
        <div className="px-5 sm:px-8 pt-12 sm:pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
              hello kopi
            </span>
            <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
                Orders
              </h1>
              {isConfigured && (
                <span className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 dark:text-stone-600">Live</span>
                </span>
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
        <div className="px-5 sm:px-8 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto flex gap-5 sm:gap-7 overflow-x-auto scrollbar-hide">
            {groups.length > 0 ? groups.map(({ dateKey }) => (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`
                  flex-shrink-0 pb-3 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em]
                  font-sans font-medium border-b-2 transition-colors duration-150 touch-manipulation whitespace-nowrap
                  ${selectedDate === dateKey
                    ? "text-stone-800 dark:text-stone-100 border-stone-800 dark:border-stone-100"
                    : "text-stone-400 dark:text-stone-500 border-transparent hover:text-stone-600 dark:hover:text-stone-300"}
                `}
              >
                {shortLabel(dateKey)}
              </button>
            )) : (
              <div className="pb-3 h-[34px]" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 sm:px-8 pt-6 pb-16">
        <div className="max-w-lg mx-auto">

          {loading && (
            <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-20">
              Loading…
            </p>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-4 py-20">
              <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-400 dark:text-stone-500 text-center">
                Could not load orders.
              </p>
              <button
                onClick={load}
                className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-600 px-5 py-2.5 rounded-xl hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-200 touch-manipulation"
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
                return (
                  <div key={si}>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-[11px] uppercase tracking-[0.25em] text-stone-600 dark:text-stone-300 font-sans font-medium">
                        {session.sessionStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SGT })}
                        {" – "}
                        {new Date(session.sessionStart.getTime() + SESSION_MS).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SGT })}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 font-sans">
                        {cups} {cups === 1 ? "cup" : "cups"}
                      </span>
                      <Countdown sessionStart={session.sessionStart} />
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
                            {names.join(" · ")}
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
