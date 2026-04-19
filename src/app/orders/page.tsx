"use client";

import { useEffect, useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { groupOrders } from "@/lib/groupOrders";
import type { Order, DateGroup } from "@/types/order";

export default function OrdersPage() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    async function fetch() {
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
    fetch();
  }, []);

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] px-5 sm:px-8 pt-16 pb-16">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      <div className="max-w-xl mx-auto">
        {/* Page header */}
        <div className="mb-10 sm:mb-14">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-sans font-medium">
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 mt-2 mb-4" />
          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800">
            Orders
          </h1>
        </div>

        {/* States */}
        {loading && (
          <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 text-center py-20">
            Loading…
          </p>
        )}

        {!loading && error && (
          <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-400 text-center py-20">
            Could not load orders.
          </p>
        )}

        {!loading && !isConfigured && (
          <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 text-center py-20">
            Supabase not configured
          </p>
        )}

        {!loading && !error && isConfigured && groups.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-px h-10 bg-stone-200" />
            <p className="font-serif text-lg font-light italic text-stone-400">
              No orders yet.
            </p>
          </div>
        )}

        {/* Order groups */}
        {groups.map(({ dateKey, dateLabel, sessions }) => (
          <div key={dateKey} className="mb-12 sm:mb-16">
            {/* Date header */}
            <div className="flex items-center gap-4 mb-7">
              <h2 className="font-serif text-lg sm:text-xl font-light tracking-wide text-stone-700 whitespace-nowrap">
                {dateLabel}
              </h2>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Sessions within this date */}
            <div className="flex flex-col gap-8">
              {sessions.map((session, si) => (
                <div key={si}>
                  {/* Session time + count */}
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-stone-600 font-sans font-medium">
                      {session.sessionStart.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-300 font-sans">
                      {session.orders.length}{" "}
                      {session.orders.length === 1 ? "order" : "orders"}
                    </span>
                  </div>

                  {/* Order rows */}
                  <div className="border-t border-stone-100">
                    {session.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center gap-4 py-3 border-b border-stone-100"
                      >
                        <span className="flex-1 font-sans font-light text-stone-800 text-sm truncate">
                          {order.person_name}
                        </span>
                        <span className="font-serif text-sm tracking-[0.15em] text-stone-500 flex-shrink-0">
                          {order.order_ref}
                        </span>
                        <span className="text-[11px] text-stone-400 font-sans flex-shrink-0 tabular-nums">
                          {new Date(order.created_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
