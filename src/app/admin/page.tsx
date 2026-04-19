"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { groupOrders } from "@/lib/groupOrders";
import { CATEGORIES } from "@/data/drinks";
import type { Order } from "@/types/order";

const ADMIN_HASH = "86623b9b3871ac27c810a27912ad683c67a1525fb15b0100366ad98fa93ac93d";
const SGT = "Asia/Singapore";

interface CustomDrink {
  id: string;
  name: string;
  description: string;
  category_id: string;
}

interface Member {
  id: string;
  name: string;
  sort_order: number;
}

type AdminTab = "orders" | "menu" | "members";

// ─── Password gate ───────────────────────────────────────────────
function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("hellokopi_name"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);
    try {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (hex === ADMIN_HASH) {
        sessionStorage.setItem("hk_admin", "1");
        onSuccess();
      } else {
        setError(true);
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#FAFAF8] dark:bg-black flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">hello kopi</span>
          <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide text-stone-800 dark:text-stone-100">Admin</h1>
          <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 mt-2">
            {name ? `Welcome back, ${name}.` : "Enter password to continue."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-transparent border-0 border-b border-stone-300 dark:border-stone-600 focus:border-stone-600 dark:focus:border-stone-400 focus:outline-none text-center text-stone-800 dark:text-stone-100 text-base font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-3.5 tracking-wide transition-colors duration-300"
          />
          {error && (
            <p className="text-[11px] font-sans text-red-400 text-center">Incorrect password.</p>
          )}
          <button
            type="submit"
            disabled={!password || checking}
            className="mt-1 w-full py-3.5 border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 hover:bg-stone-800 dark:hover:bg-stone-300 hover:text-white dark:hover:text-stone-900 disabled:opacity-25 disabled:cursor-not-allowed focus:outline-none"
          >
            {checking ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Orders tab ──────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true); setError(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const { data, error } = await supabase
        .from("orders").select("*")
        .order("created_at", { ascending: false })
        .abortSignal(controller.signal);
      if (error) throw error;
      setOrders(data as Order[]);
    } catch {
      setError(true);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteOrder(id: string) {
    setOrders(prev => prev.filter(o => o.id !== id));
    await supabase.from("orders").delete().eq("id", id);
  }

  async function removeItem(order: Order, itemName: string) {
    const newItems = [...order.items];
    const idx = newItems.findIndex(i => i.name === itemName);
    if (idx === -1) return;
    newItems.splice(idx, 1);
    if (newItems.length === 0) {
      setOrders(prev => prev.filter(o => o.id !== order.id));
      await supabase.from("orders").delete().eq("id", order.id);
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: newItems } : o));
      await supabase.from("orders").update({ items: newItems }).eq("id", order.id);
    }
  }

  if (loading) return <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-20">Loading…</p>;
  if (error) return (
    <div className="flex flex-col items-center gap-4 py-20">
      <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-400 dark:text-stone-500 text-center">Could not load orders.</p>
      <button onClick={load} className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-600 px-5 py-2.5 hover:border-stone-500 dark:hover:border-stone-400 transition-colors duration-200 touch-manipulation">Try again</button>
    </div>
  );
  if (orders.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-24">
      <div className="w-px h-10 bg-stone-200 dark:bg-stone-700" />
      <p className="font-serif text-lg font-light italic text-stone-400 dark:text-stone-500">No orders yet.</p>
    </div>
  );

  const groups = groupOrders(orders);

  return (
    <div className="flex flex-col gap-10">
      {groups.map(group => (
        <div key={group.dateKey}>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 font-sans mb-4">{group.dateLabel}</p>
          <div className="flex flex-col gap-6">
            {group.sessions.map((session, si) => {
              const endTime = new Date(session.sessionStart.getTime() + 15 * 60 * 1000);
              return (
                <div key={si}>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-stone-600 dark:text-stone-300 font-sans font-medium mb-2">
                    {session.sessionStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SGT })}
                    {" – "}
                    {endTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: SGT })}
                  </p>
                  <div className="border-t border-stone-100 dark:border-stone-800">
                    {session.orders.map(order => {
                      const itemMap = new Map<string, number>();
                      for (const item of order.items) {
                        itemMap.set(item.name, (itemMap.get(item.name) ?? 0) + 1);
                      }
                      return (
                        <div key={order.id} className="py-3 border-b border-stone-100 dark:border-stone-800">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100">{order.person_name}</p>
                              <div className="mt-1.5 flex flex-col gap-1.5">
                                {[...itemMap.entries()].map(([name, qty]) => (
                                  <div key={name} className="flex items-center gap-2.5">
                                    <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
                                      {name}{qty > 1 ? ` ×${qty}` : ""}
                                    </span>
                                    <button
                                      onClick={() => removeItem(order, name)}
                                      title="Remove one"
                                      className="w-5 h-5 flex items-center justify-center border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 hover:border-red-300 dark:hover:border-red-800 hover:text-red-400 dark:hover:text-red-500 transition-colors touch-manipulation text-sm leading-none"
                                    >
                                      −
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              title="Delete entire order"
                              className="flex-shrink-0 mt-0.5 text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 transition-colors touch-manipulation"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Menu tab ────────────────────────────────────────────────────
function MenuTab() {
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [hiddenDrinks, setHiddenDrinks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState(CATEGORIES[0].id);
  const [adding, setAdding] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("custom_drinks").select("*").order("created_at"),
      supabase.from("hidden_drinks").select("drink_name"),
    ]).then(([custom, hidden]) => {
      if (custom.data) setCustomDrinks(custom.data as CustomDrink[]);
      if (hidden.data) setHiddenDrinks(new Set(hidden.data.map((h: { drink_name: string }) => h.drink_name)));
      setLoading(false);
    });
  }, []);

  async function addDrink(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const { data, error } = await supabase.from("custom_drinks")
      .insert({ name: newName.trim(), description: newDesc.trim(), category_id: newCat })
      .select().single();
    if (!error && data) {
      setCustomDrinks(prev => [...prev, data as CustomDrink]);
      setNewName(""); setNewDesc("");
    }
    setAdding(false);
  }

  async function removeCustomDrink(id: string) {
    setCustomDrinks(prev => prev.filter(d => d.id !== id));
    await supabase.from("custom_drinks").delete().eq("id", id);
  }

  async function toggleHide(drinkName: string) {
    if (hiddenDrinks.has(drinkName)) {
      setHiddenDrinks(prev => { const n = new Set(prev); n.delete(drinkName); return n; });
      await supabase.from("hidden_drinks").delete().eq("drink_name", drinkName);
    } else {
      setHiddenDrinks(prev => new Set([...prev, drinkName]));
      await supabase.from("hidden_drinks").insert({ drink_name: drinkName });
    }
  }

  function toggleCategory(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  if (loading) return <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-20">Loading…</p>;

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Add drink */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400 mb-4">Add drink</p>
        <form onSubmit={addDrink} className="flex flex-col gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Drink name"
            className="w-full bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-500 dark:focus:border-stone-400 focus:outline-none text-stone-800 dark:text-stone-100 text-sm font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-2.5 transition-colors duration-200"
          />
          <input
            type="text"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-500 dark:focus:border-stone-400 focus:outline-none text-stone-800 dark:text-stone-100 text-sm font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-2.5 transition-colors duration-200"
          />
          <div className="w-full relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen(o => !o)}
              className="w-full bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:outline-none flex items-center justify-between gap-2 py-2.5 transition-colors duration-200 touch-manipulation"
            >
              <span className="text-sm font-sans font-light text-stone-800 dark:text-stone-100">
                {CATEGORIES.find(c => c.id === newCat)?.label ?? newCat}
              </span>
              <svg className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 transition-transform duration-150 ${catOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {catOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#FAFAF8] dark:bg-[#2c2c2c] border border-stone-200 dark:border-stone-600 shadow-md dark:shadow-black divide-y divide-stone-100 dark:divide-[#3a3a3a] max-h-[40vh] overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setNewCat(cat.id); setCatOpen(false); }}
                    className={`w-full px-4 py-3 text-left text-sm font-sans font-light tracking-wide transition-colors duration-100 ${
                      newCat === cat.id
                        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900"
                        : "text-stone-600 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#3a3a3a]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!newName.trim() || adding}
            className="mt-1 w-full py-3 border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-200 hover:bg-stone-800 dark:hover:bg-stone-300 hover:text-white dark:hover:text-stone-900 disabled:opacity-25 disabled:cursor-not-allowed focus:outline-none"
          >
            {adding ? "Adding…" : "Add Drink"}
          </button>
        </form>
      </div>

      {/* Custom drinks */}
      {customDrinks.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400 mb-3">Custom drinks</p>
          <div className="border-t border-stone-100 dark:border-stone-800">
            {customDrinks.map(drink => (
              <div key={drink.id} className="flex items-center justify-between gap-3 py-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100 truncate">{drink.name}</p>
                  {drink.description && <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500 truncate">{drink.description}</p>}
                  <p className="text-[10px] font-sans text-stone-300 dark:text-stone-600 mt-0.5">
                    {CATEGORIES.find(c => c.id === drink.category_id)?.label ?? drink.category_id}
                  </p>
                </div>
                <button
                  onClick={() => removeCustomDrink(drink.id)}
                  className="flex-shrink-0 text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 transition-colors touch-manipulation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default menu toggles */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400 mb-3">
          Default menu
          {hiddenDrinks.size > 0 && (
            <span className="ml-2 text-stone-300 dark:text-stone-600 normal-case tracking-normal font-normal">
              ({hiddenDrinks.size} hidden)
            </span>
          )}
        </p>
        <div>
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between py-4 touch-manipulation"
              >
                <span className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-300 dark:text-stone-600 font-sans tabular-nums">
                    {cat.drinks.filter(d => hiddenDrinks.has(d.name)).length > 0
                      ? `${cat.drinks.filter(d => hiddenDrinks.has(d.name)).length} hidden`
                      : cat.drinks.length}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 transition-transform duration-200 ${expanded.has(cat.id) ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {expanded.has(cat.id) && (
                <div className="pb-2">
                  {cat.drinks.map(drink => {
                    const hidden = hiddenDrinks.has(drink.name);
                    return (
                      <div key={drink.name} className={`flex items-center justify-between gap-3 px-1 py-2.5 border-b border-stone-50 dark:border-[#1a1a1a] last:border-0 transition-opacity ${hidden ? "opacity-40" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-sans text-stone-800 dark:text-stone-100 truncate">{drink.name}</p>
                          <p className="text-[11px] font-sans text-stone-400 dark:text-stone-500 truncate">{drink.description}</p>
                        </div>
                        <button
                          onClick={() => toggleHide(drink.name)}
                          className={`flex-shrink-0 text-[10px] font-sans font-medium uppercase tracking-[0.15em] px-2.5 py-1 border transition-colors duration-150 touch-manipulation ${
                            hidden
                              ? "border-stone-400 dark:border-stone-500 text-stone-500 dark:text-stone-400 hover:border-stone-600"
                              : "border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 hover:border-red-300 dark:hover:border-red-800 hover:text-red-400 dark:hover:text-red-500"
                          }`}
                        >
                          {hidden ? "Show" : "Hide"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Members tab ─────────────────────────────────────────────────
function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    supabase.from("members").select("*").order("sort_order").then(({ data }) => {
      if (data) setMembers(data as Member[]);
      setLoading(false);
    });
  }, []);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const sortOrder = members.length > 0 ? members[members.length - 1].sort_order + 1 : 0;
    const { data, error } = await supabase.from("members")
      .insert({ name: newName.trim(), sort_order: sortOrder })
      .select().single();
    if (!error && data) {
      setMembers(prev => [...prev, data as Member]);
      setNewName("");
    }
    setAdding(false);
  }

  async function removeMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id));
    await supabase.from("members").delete().eq("id", id);
  }

  async function move(index: number, direction: "up" | "down") {
    const other = direction === "up" ? index - 1 : index + 1;
    if (other < 0 || other >= members.length) return;
    const a = members[index];
    const b = members[other];
    const updated = members.map(m => {
      if (m.id === a.id) return { ...m, sort_order: b.sort_order };
      if (m.id === b.id) return { ...m, sort_order: a.sort_order };
      return m;
    }).sort((x, y) => x.sort_order - y.sort_order);
    setMembers(updated);
    await Promise.all([
      supabase.from("members").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("members").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
  }

  if (loading) return <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-20">Loading…</p>;

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400 mb-4">Add name</p>
        <form onSubmit={addMember} className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1 bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-500 dark:focus:border-stone-400 focus:outline-none text-stone-800 dark:text-stone-100 text-sm font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-2.5 transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={!newName.trim() || adding}
            className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium px-4 py-2 border border-stone-800 dark:border-stone-300 text-stone-800 dark:text-stone-300 hover:bg-stone-800 dark:hover:bg-stone-300 hover:text-white dark:hover:text-stone-900 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none touch-manipulation"
          >
            {adding ? "…" : "Add"}
          </button>
        </form>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-stone-600 dark:text-stone-400 mb-3">
          Name list
          <span className="ml-2 text-stone-300 dark:text-stone-600 normal-case tracking-normal font-normal">({members.length})</span>
        </p>
        {members.length === 0 ? (
          <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500">No names yet.</p>
        ) : (
          <div className="border-t border-stone-100 dark:border-stone-800">
            {members.map((member, i) => (
              <div key={member.id} className="flex items-center gap-1 py-2.5 border-b border-stone-100 dark:border-stone-800">
                <p className="flex-1 text-sm font-sans text-stone-800 dark:text-stone-100">{member.name}</p>
                <button
                  onClick={() => move(i, "up")}
                  disabled={i === 0}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => move(i, "down")}
                  disabled={i === members.length - 1}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => removeMember(member.id)}
                  className="w-8 h-8 flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 transition-colors touch-manipulation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] font-sans italic text-stone-300 dark:text-stone-600 mt-3">"Others" always appears last.</p>
      </div>
    </div>
  );
}

// ─── Admin content ───────────────────────────────────────────────
function AdminContent({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<AdminTab>("orders");

  const TABS: { id: AdminTab; label: string }[] = [
    { id: "orders", label: "Orders" },
    { id: "menu", label: "Menu" },
    { id: "members", label: "Members" },
  ];

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black pb-16">
      <div className="sticky top-0 z-30 bg-[#FAFAF8] dark:bg-black">
        <div className="px-5 sm:px-8 pt-12 sm:pt-6 pb-4">
          <div className="max-w-lg mx-auto flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">hello kopi</span>
              <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
              <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">Admin</h1>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem("hk_admin"); onLock(); }}
              className="mt-1 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors touch-manipulation"
            >
              Lock
            </button>
          </div>
        </div>
        <div className="px-5 sm:px-8 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto flex gap-5 sm:gap-7">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-3 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-sans font-medium border-b-2 transition-colors duration-150 touch-manipulation whitespace-nowrap ${
                  tab === t.id
                    ? "text-stone-800 dark:text-stone-100 border-stone-800 dark:border-stone-100"
                    : "text-stone-400 dark:text-stone-500 border-transparent hover:text-stone-600 dark:hover:text-stone-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-8 pt-6">
        <div className="max-w-lg mx-auto">
          {tab === "orders" && <OrdersTab />}
          {tab === "menu" && <MenuTab />}
          {tab === "members" && <MembersTab />}
        </div>
      </div>
    </main>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function AdminPage() {
  const [auth, setAuth] = useState<"locked" | "unlocked">(() => {
    if (typeof window === "undefined") return "locked";
    return sessionStorage.getItem("hk_admin") === "1" ? "unlocked" : "locked";
  });

  if (auth === "locked") return <PasswordGate onSuccess={() => setAuth("unlocked")} />;
  return <AdminContent onLock={() => setAuth("locked")} />;
}
