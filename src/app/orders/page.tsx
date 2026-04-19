"use client";

import { useEffect, useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { groupOrders } from "@/lib/groupOrders";
import type { Order, DateGroup, Session } from "@/types/order";

// Group a session's orders by drink, returning drink → [person names]
function groupByDrink(session: Session): { drink: string; names: string[] }[] {
  const map = new Map<string, string[]>();
  for (const order of session.orders) {
    const drink = order.items?.[0]?.name;
    if (!drink) continue;
    if (!map.has(drink)) map.set(drink, []);
    map.get(drink)!.push(order.person_name);
  }
  // Sort by qty desc so the most-ordered drink sits on top
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([drink, names]) => ({ drink, names }));
}

export default function OrdersPage() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    async function load() {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setGroups(groupOrders(data as Order[]));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black pb-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#FAFAF8] dark:bg-black px-5 sm:px-8 pt-12 sm:pt-6 pb-5 border-b border-stone-100 dark:border-stone-800">
        <div className="max-w-lg mx-auto">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100">
            Orders
          </h1>
        </div>
      </div>

      <div className="px-5 sm:px-8 pt-8">
      <div className="max-w-lg mx-auto">

        {/* States */}
        {loading && (
          <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-20">
            Loading…
          </p>
        )}
        {!loading && error && (
          <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-400 dark:text-stone-500 text-center py-20">
            Could not load orders.
          </p>
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

        {/* Date groups */}
        {groups.map(({ dateKey, dateLabel, sessions }) => (
          <div key={dateKey} className="mb-12 sm:mb-16">
            {/* Date header */}
            <div className="flex items-center gap-4 mb-7">
              <h2 className="font-serif text-lg sm:text-xl font-light tracking-wide text-stone-700 dark:text-stone-200 whitespace-nowrap">
                {dateLabel}
              </h2>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
            </div>

            <div className="flex flex-col gap-8">
              {sessions.map((session, si) => {
                const drinkGroups = groupByDrink(session);
                const cups = drinkGroups.reduce((sum, g) => sum + g.names.length, 0);

                return (
                  <div key={si}>
                    {/* Session header: time + cup count */}
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-[11px] uppercase tracking-[0.25em] text-stone-600 dark:text-stone-300 font-sans font-medium">
                        {session.sessionStart.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 font-sans">
                        {cups} {cups === 1 ? "cup" : "cups"}
                      </span>
                    </div>

                    {/* Drink-first rows */}
                    <div className="border-t border-stone-100 dark:border-stone-800">
                      {drinkGroups.map(({ drink, names }) => (
                        <div
                          key={drink}
                          className="flex items-start justify-between gap-4 py-3.5 border-b border-stone-100 dark:border-stone-800"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100 leading-snug">
                              {drink}
                            </p>
                            <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500 mt-1 leading-relaxed">
                              {names.join(" · ")}
                            </p>
                          </div>

                          {/* Qty badge — only shown when more than 1 */}
                          {names.length > 1 && (
                            <span className="flex-shrink-0 mt-0.5 px-2 py-0.5 border border-stone-200 dark:border-stone-600 text-[10px] font-sans font-medium text-stone-500 dark:text-stone-400 tracking-wide">
                              × {names.length}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </div>
    </main>
  );
}
