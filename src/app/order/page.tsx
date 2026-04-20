"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { generateOrderRef } from "@/lib/orderRef";
import { CATEGORIES } from "@/data/drinks";
import { DRINK_BASES, OTHERS_DRINKS, type DrinkSpecial } from "@/data/menu";

// Lookup map for My Picks + Top Orders descriptions (pre-defined drinks only)
const BASE_DRINKS_MAP = new Map(
  CATEGORIES.flatMap((c) => c.drinks).map((d) => [d.name, d])
);

interface CustomDrink { id: string; name: string; description: string; category_id: string; }

type Tab = "crowd" | "yours" | "all";
type CartItem = { name: string; qty: number };
type OrderState = "idle" | "loading" | { orderRef: string; items: CartItem[] } | "error";
type CrowdItem = { drink_name: string; order_count: number };

// ─── Heart icon ───────────────────────────────────────────────
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-[15px] h-[15px] transition-colors duration-150 flex-shrink-0 ${
        filled ? "text-rose-400" : "text-stone-250 group-hover/heart:text-stone-400"
      }`}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

// ─── Drink card (grid view) ───────────────────────────────────
function DrinkCard({
  name, description, selected, qty, onSelect, favourited, onToggleFavourite, count,
}: {
  name: string;
  description?: string;
  selected: boolean;
  qty: number;
  onSelect: () => void;
  favourited: boolean;
  onToggleFavourite: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative text-left p-3.5 border rounded-xl transition-all duration-200 touch-manipulation active:scale-[0.97] w-full
        ${selected
          ? "bg-stone-800 border-stone-800 dark:bg-stone-200 dark:border-stone-200 shadow-md"
          : "bg-white dark:bg-[#111] border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-md hover:-translate-y-0.5 shadow-sm"}
      `}
    >
      <span
        role="button"
        className="group/heart absolute top-2.5 right-2.5 p-1 touch-manipulation"
        onClick={(e) => { e.stopPropagation(); onToggleFavourite(); }}
      >
        <Heart filled={favourited} />
      </span>

      <p className={`text-sm font-sans font-medium leading-snug pr-5 ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
        {name}{selected && qty > 1 ? <span className="ml-1 text-[11px] font-normal opacity-60">×{qty}</span> : null}
      </p>
      {description && (
        <p className={`text-[11px] font-sans mt-0.5 leading-snug ${selected ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
          {description}
        </p>
      )}
      {count !== undefined && (
        <p className={`text-[10px] font-sans mt-1.5 font-medium tabular-nums ${selected ? "text-stone-400 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
          {count} {count === 1 ? "order" : "orders"}
        </p>
      )}
    </button>
  );
}

// ─── Drink row (Others flat list) ─────────────────────────────
function DrinkRow({
  name, description, selected, qty, onSelect, favourited, onToggleFavourite,
}: {
  name: string;
  description: string;
  selected: boolean;
  qty: number;
  onSelect: () => void;
  favourited: boolean;
  onToggleFavourite: () => void;
}) {
  return (
    <div className={`flex items-center mb-0.5 transition-colors duration-150 ${selected ? "bg-stone-800 dark:bg-stone-200" : "hover:bg-stone-50 dark:hover:bg-[#111] active:bg-stone-100 dark:active:bg-[#1a1a1a]"}`}>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex items-center justify-between px-3 py-3 text-left touch-manipulation min-w-0"
      >
        <div className="flex flex-col gap-0.5 min-w-0 mr-2">
          <span className={`text-sm font-sans font-medium truncate ${selected ? "text-white dark:text-stone-900" : "text-stone-800 dark:text-stone-100"}`}>
            {name}
          </span>
          <span className={`text-[11px] font-sans truncate ${selected ? "text-stone-300 dark:text-stone-600" : "text-stone-400 dark:text-stone-500"}`}>
            {description}
          </span>
        </div>
        {selected && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {qty > 1 && (
              <span className="text-[11px] font-sans font-medium text-stone-400 dark:text-stone-600 tabular-nums">×{qty}</span>
            )}
            <svg className="w-4 h-4 text-white dark:text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={onToggleFavourite}
        className="group/heart px-3 py-3 touch-manipulation flex-shrink-0"
      >
        <Heart filled={favourited} />
      </button>
    </div>
  );
}

// ─── Inline loading placeholder ───────────────────────────────
function TabLoading() {
  return (
    <p className="text-[11px] uppercase tracking-[0.25em] font-sans text-stone-300 dark:text-stone-600 text-center py-16">
      Loading…
    </p>
  );
}

// ─── Modifier row (pill buttons, one selected at a time) ─────
function ModifierRow({
  label, defaultLabel, options, selected, onChange, disabled,
}: {
  label: string;
  defaultLabel: string;
  options: { id: string; label: string }[];
  selected: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const pillCls = (active: boolean) =>
    `px-3 py-1.5 text-[11px] font-sans border transition-colors duration-100 touch-manipulation ${
      active
        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
        : "text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500"
    }`;
  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-30 pointer-events-none" : ""}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange("")} className={pillCls(!selected)}>
          {defaultLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(selected === opt.id ? "" : opt.id)}
            className={pillCls(selected === opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Drink builder (replaces "All Drinks" flat list) ──────────
function DrinkBuilder({
  cart, onToggleCart, userFavs, onToggleFavourite, customDrinks, hiddenDrinks,
}: {
  cart: Map<string, number>;
  onToggleCart: (name: string) => void;
  userFavs: Set<string>;
  onToggleFavourite: (name: string) => void;
  customDrinks: CustomDrink[];
  hiddenDrinks: Set<string>;
}) {
  const [baseId, setBaseId] = useState<string | null>(null);
  const [milk, setMilk] = useState("");
  const [strength, setStrength] = useState("");
  const [sweetness, setSweetness] = useState("");
  const [temp, setTemp] = useState("");
  const [special, setSpecial] = useState("");

  const base = DRINK_BASES.find((b) => b.id === baseId) ?? null;

  // Reset modifiers when base changes
  useEffect(() => {
    setMilk(""); setStrength(""); setSweetness(""); setTemp(""); setSpecial("");
  }, [baseId]);

  const allSpecials = useMemo(() => {
    if (!base) return [];
    const custom = customDrinks
      .filter((cd) => cd.category_id === base.id && !hiddenDrinks.has(cd.name))
      .map<DrinkSpecial>((cd) => ({ label: cd.name, fullName: cd.name }));
    return [...base.specials, ...custom];
  }, [base, customDrinks, hiddenDrinks]);

  const composedName = useMemo(() => {
    if (!base) return "";
    if (special) {
      const sp = allSpecials.find((s) => s.label === special);
      return sp?.fullName ?? `${base.label} ${special}`;
    }
    const parts = [base.label];
    if (milk) parts.push(milk);
    if (strength) parts.push(strength);
    if (sweetness) parts.push(sweetness);
    if (temp) parts.push(temp);
    return parts.join(" ");
  }, [base, milk, strength, sweetness, temp, special, allSpecials]);

  const othersAll = useMemo(() => {
    const custom = customDrinks
      .filter((cd) => cd.category_id === "others" && !hiddenDrinks.has(cd.name))
      .map((cd) => ({ name: cd.name, description: cd.description }));
    return [
      ...OTHERS_DRINKS.filter((d) => !hiddenDrinks.has(d.name)),
      ...custom,
    ];
  }, [customDrinks, hiddenDrinks]);

  const [search, setSearch] = useState("");

  const allDrinksFlat = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; description: string }[] = [];
    for (const cat of CATEGORIES) {
      for (const d of cat.drinks) {
        if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push(d); }
      }
    }
    for (const d of OTHERS_DRINKS) {
      if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push(d); }
    }
    for (const d of customDrinks) {
      if (!seen.has(d.name) && !hiddenDrinks.has(d.name)) { seen.add(d.name); out.push({ name: d.name, description: d.description }); }
    }
    return out;
  }, [customDrinks, hiddenDrinks]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return allDrinksFlat.filter((d) => d.name.toLowerCase().includes(q));
  }, [search, allDrinksFlat]);

  const baseChipCls = (active: boolean) =>
    `px-3.5 py-1.5 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border transition-colors duration-100 touch-manipulation ${
      active
        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
        : "text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-500"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => { setSearch(e.target.value); if (e.target.value) setBaseId(null); }}
        placeholder="Search drinks…"
        className="w-full bg-transparent border-0 border-b border-stone-200 dark:border-stone-700 focus:border-stone-500 dark:focus:border-stone-400 focus:outline-none text-stone-800 dark:text-stone-100 text-sm font-sans font-light placeholder:text-stone-300 dark:placeholder:text-stone-600 py-2.5 tracking-wide transition-colors duration-200"
      />

      {/* Search results */}
      {searchResults ? (
        <div className="border-t border-stone-100 dark:border-stone-800 -mt-2">
          {searchResults.length === 0 ? (
            <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 py-8 text-center">No results.</p>
          ) : searchResults.map((drink) => (
            <DrinkRow
              key={drink.name}
              name={drink.name}
              description={drink.description}
              selected={cart.has(drink.name)}
              qty={cart.get(drink.name) ?? 0}
              onSelect={() => onToggleCart(drink.name)}
              favourited={userFavs.has(drink.name)}
              onToggleFavourite={() => onToggleFavourite(drink.name)}
            />
          ))}
        </div>
      ) : (
      <>

      {/* Base selector */}
      <div className="flex flex-wrap gap-2">
        {DRINK_BASES.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => { setSearch(""); setBaseId(baseId === b.id ? null : b.id); }}
            className={baseChipCls(baseId === b.id)}
          >
            {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setSearch(""); setBaseId(baseId === "others" ? null : "others"); }}
          className={baseChipCls(baseId === "others")}
        >
          Others
        </button>
      </div>

      {/* Others flat list */}
      {baseId === "others" && (
        <div className="border-t border-stone-100 dark:border-stone-800">
          {othersAll.length === 0 ? (
            <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 py-8 text-center">Nothing here.</p>
          ) : othersAll.map((drink) => (
            <DrinkRow
              key={drink.name}
              name={drink.name}
              description={drink.description}
              selected={cart.has(drink.name)}
              qty={cart.get(drink.name) ?? 0}
              onSelect={() => onToggleCart(drink.name)}
              favourited={userFavs.has(drink.name)}
              onToggleFavourite={() => onToggleFavourite(drink.name)}
            />
          ))}
        </div>
      )}

      {/* Builder modifiers */}
      {base && (
        <div className="flex flex-col gap-5">
          {base.milk.length > 0 && (
            <ModifierRow
              label="Milk"
              defaultLabel="Condensed"
              options={base.milk.map((m) => ({ id: m, label: m === "O" ? "O · Black" : "C · Evap" }))}
              selected={milk}
              onChange={setMilk}
              disabled={!!special}
            />
          )}
          <ModifierRow
            label="Sweetness"
            defaultLabel="Normal"
            options={base.sweetness.map((s) => ({ id: s, label: s }))}
            selected={sweetness}
            onChange={setSweetness}
            disabled={!!special}
          />
          {base.strength.length > 0 && (
            <ModifierRow
              label="Strength"
              defaultLabel="Normal"
              options={base.strength.map((s) => ({ id: s, label: s }))}
              selected={strength}
              onChange={setStrength}
              disabled={!!special}
            />
          )}
          {base.temp.length > 0 && (
            <ModifierRow
              label="Temp"
              defaultLabel="Hot"
              options={base.temp.map((t) => ({ id: t, label: t }))}
              selected={temp}
              onChange={setTemp}
              disabled={!!special}
            />
          )}

          {allSpecials.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium">Specials</p>
              <div className="flex flex-wrap gap-1.5">
                {allSpecials.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => setSpecial(special === sp.label ? "" : sp.label)}
                    className={`px-3 py-1.5 text-[11px] font-sans border transition-colors duration-100 touch-manipulation ${
                      special === sp.label
                        ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                        : "text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-500"
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview + actions */}
          <div className="border-t border-stone-100 dark:border-stone-800 pt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <p className="font-serif text-lg font-light tracking-wide text-stone-800 dark:text-stone-100 leading-snug truncate">
                {composedName}
              </p>
              <button
                type="button"
                onClick={() => onToggleFavourite(composedName)}
                className="group/heart flex-shrink-0 p-1 touch-manipulation"
                aria-label="Favourite"
              >
                <Heart filled={userFavs.has(composedName)} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onToggleCart(composedName)}
              className={`flex-shrink-0 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-sans font-medium border rounded-full transition-all duration-150 touch-manipulation ${
                cart.has(composedName)
                  ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 border-stone-800 dark:border-stone-200"
                  : "text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-stone-600 dark:hover:border-stone-400"
              }`}
            >
              {cart.has(composedName) ? `In cart · ${cart.get(composedName)}` : "+ Add"}
            </button>
          </div>
        </div>
      )}

      </>
      )}
    </div>
  );
}

// ─── Main order content ───────────────────────────────────────
function OrderContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";

  const [orderState, setOrderState] = useState<OrderState>("idle");
  const [tab, setTab] = useState<Tab>("yours");
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [crowdData, setCrowdData] = useState<CrowdItem[]>([]);
  const [userFavs, setUserFavs] = useState<Set<string>>(new Set());
  const [customDrinks, setCustomDrinks] = useState<CustomDrink[]>([]);
  const [hiddenDrinks, setHiddenDrinks] = useState<Set<string>>(new Set());
  const [loadingCrowd, setLoadingCrowd] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [lastOrder, setLastOrder] = useState<{ name: string; qty: number }[] | null>(null);

  // Description lookup for display in My Picks/Top Orders (pre-defined + custom)
  const DRINKS_MAP = useMemo(() => {
    const map = new Map(BASE_DRINKS_MAP);
    for (const d of customDrinks) map.set(d.name, { name: d.name, description: d.description });
    return map;
  }, [customDrinks]);

  useEffect(() => {
    if (!isConfigured) {
      setLoadingCrowd(false);
      setLoadingFavs(false);
      return;
    }
    supabase.rpc("get_crowd_favourites").then(({ data }) => {
      if (data) setCrowdData(data as CrowdItem[]);
      setLoadingCrowd(false);
    });
    supabase
      .from("user_favourites")
      .select("drink_name")
      .eq("person_name", name)
      .then(({ data }) => {
        if (data) setUserFavs(new Set(data.map((d: { drink_name: string }) => d.drink_name)));
        setLoadingFavs(false);
      });
    Promise.all([
      supabase.from("custom_drinks").select("*"),
      supabase.from("hidden_drinks").select("drink_name"),
    ]).then(([custom, hidden]) => {
      if (custom.data) setCustomDrinks(custom.data as CustomDrink[]);
      if (hidden.data) setHiddenDrinks(new Set(hidden.data.map((h: { drink_name: string }) => h.drink_name)));
    });
    supabase
      .from("orders")
      .select("items")
      .eq("person_name", name)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const items = data[0].items as { name: string }[];
          const counts = new Map<string, number>();
          for (const item of items) counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
          setLastOrder([...counts.entries()].map(([n, qty]) => ({ name: n, qty })));
        }
      });
  }, [name]);

  function toggleCart(drinkName: string) {
    setCart((prev) => {
      const next = new Map(prev);
      if (next.has(drinkName)) {
        next.delete(drinkName);
      } else {
        next.set(drinkName, 1);
      }
      return next;
    });
  }

  function incrementCart(drinkName: string) {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(drinkName, (next.get(drinkName) ?? 0) + 1);
      return next;
    });
  }

  function decrementCart(drinkName: string) {
    setCart((prev) => {
      const next = new Map(prev);
      const qty = (next.get(drinkName) ?? 1) - 1;
      if (qty <= 0) {
        next.delete(drinkName);
      } else {
        next.set(drinkName, qty);
      }
      return next;
    });
  }

  async function toggleFavourite(drinkName: string) {
    if (!isConfigured) return;
    const isFav = userFavs.has(drinkName);
    setUserFavs((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(drinkName) : next.add(drinkName);
      return next;
    });
    if (isFav) {
      await supabase.from("user_favourites").delete().eq("person_name", name).eq("drink_name", drinkName);
    } else {
      await supabase.from("user_favourites").insert({ person_name: name, drink_name: drinkName });
    }
  }

  async function placeOrder() {
    if (cart.size === 0) return;
    setOrderState("loading");
    const orderRef = generateOrderRef();
    // Expand cart: qty > 1 = repeated item entries (backward-compatible with orders display)
    const items = [...cart.entries()].flatMap(([drinkName, qty]) => {
      const drink = DRINKS_MAP.get(drinkName) ?? { name: drinkName, description: "" };
      return Array(qty).fill({ name: drink.name, description: drink.description });
    });
    try {
      const { error } = await supabase.from("orders").insert({
        order_ref: orderRef,
        person_name: name,
        items,
      });
      if (error) throw error;
      const cartItems: CartItem[] = [...cart.entries()].map(([drinkName, qty]) => ({ name: drinkName, qty }));
      setOrderState({ orderRef, items: cartItems });
    } catch {
      setOrderState("error");
    }
  }

  if (typeof orderState === "object") {
    return <ConfirmedState name={name} orderRef={orderState.orderRef} items={orderState.items} />;
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "yours", label: "My Picks" },
    { id: "crowd", label: "Top Orders" },
    { id: "all", label: "All Drinks" },
  ];
  const tabIndex = TABS.findIndex((t) => t.id === tab);

  const cartEntries = [...cart.entries()];
  const totalDrinks = cartEntries.reduce((s, [, q]) => s + q, 0);

  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />

      {/* Sticky header + tabs block */}
      <div className="sticky top-0 z-30 bg-[#FAFAF8] dark:bg-black">
        {/* Brand + greeting */}
        <div className="px-5 sm:px-8 pt-12 sm:pt-6 pb-4">
          <div className="max-w-lg mx-auto">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
              hello kopi
            </span>
            <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
              Hello, {name}
            </h1>
            <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 dark:text-stone-500 mt-1.5">
              What would you like today?
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-8 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto">
            <div className="relative flex bg-stone-100 dark:bg-stone-900 rounded-full p-1">
              {/* Sliding pill */}
              <div
                className="absolute top-1 bottom-1 w-1/3 bg-white dark:bg-stone-700 shadow-sm rounded-full pointer-events-none"
                style={{
                  transform: `translateX(${tabIndex * 100}%)`,
                  transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`
                    relative z-10 flex-1 py-1.5 text-center text-[10px] uppercase tracking-[0.15em]
                    font-sans font-medium rounded-full transition-colors duration-200 touch-manipulation whitespace-nowrap
                    ${tab === t.id
                      ? "text-stone-800 dark:text-stone-100"
                      : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400"}
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 sm:px-8 pt-5 ${cart.size > 0 ? "pb-64" : "pb-12"}`}>
        <div className="max-w-lg mx-auto">

          {/* MY PICKS */}
          {tab === "yours" && (
            <>
              {loadingFavs && <TabLoading />}
              {!loadingFavs && lastOrder && lastOrder.length > 0 && (
                <div className="mb-5 pb-5 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-sans font-medium mb-2.5">Last order</p>
                  <div className="flex flex-col gap-1 mb-3">
                    {lastOrder.map(({ name: n, qty }) => (
                      <p key={n} className="text-sm font-sans text-stone-600 dark:text-stone-400">
                        {n}{qty > 1 ? ` ×${qty}` : ""}
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCart(new Map(lastOrder.map(({ name: n, qty }) => [n, qty])))}
                    className="text-[11px] uppercase tracking-[0.2em] font-sans font-medium text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-xl hover:border-stone-500 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150 touch-manipulation"
                  >
                    Re-order
                  </button>
                </div>
              )}
              {!loadingFavs && userFavs.size === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 text-center px-8">
                    Tap ♡ on any drink to save it here
                  </p>
                </div>
              )}
              {!loadingFavs && userFavs.size > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {[...userFavs].map((drinkName) => {
                    const drink = DRINKS_MAP.get(drinkName);
                    return (
                      <DrinkCard
                        key={drinkName}
                        name={drinkName}
                        description={drink?.description}
                        selected={cart.has(drinkName)}
                        qty={cart.get(drinkName) ?? 0}
                        onSelect={() => toggleCart(drinkName)}
                        favourited={true}
                        onToggleFavourite={() => toggleFavourite(drinkName)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TOP ORDERS */}
          {tab === "crowd" && (
            <>
              {loadingCrowd && <TabLoading />}
              {!loadingCrowd && crowdData.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-px h-8 bg-stone-200 dark:bg-stone-700" />
                  <p className="font-serif text-base font-light italic text-stone-400 dark:text-stone-500 text-center">
                    No orders yet — be the first!
                  </p>
                </div>
              )}
              {!loadingCrowd && crowdData.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5">
                  {crowdData.map(({ drink_name, order_count }) => {
                    const drink = DRINKS_MAP.get(drink_name);
                    return (
                      <DrinkCard
                        key={drink_name}
                        name={drink_name}
                        description={drink?.description}
                        selected={cart.has(drink_name)}
                        qty={cart.get(drink_name) ?? 0}
                        onSelect={() => toggleCart(drink_name)}
                        favourited={userFavs.has(drink_name)}
                        onToggleFavourite={() => toggleFavourite(drink_name)}
                        count={order_count}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ALL DRINKS — builder */}
          {tab === "all" && (
            <DrinkBuilder
              cart={cart}
              onToggleCart={toggleCart}
              userFavs={userFavs}
              onToggleFavourite={toggleFavourite}
              customDrinks={customDrinks}
              hiddenDrinks={hiddenDrinks}
            />
          )}

        </div>
      </div>

      {/* Sticky cart + place-order bar */}
      {cart.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAF8] dark:bg-black border-t border-stone-200 dark:border-stone-700 px-5 sm:px-8 pt-3.5 pb-5">
          <div className="max-w-lg mx-auto flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400 dark:text-stone-500">Your order</p>
              <button
                type="button"
                onClick={() => setCart(new Map())}
                className="text-[10px] font-sans text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors touch-manipulation"
              >
                Clear
              </button>
            </div>
            {cartEntries.map(([drinkName, qty]) => (
              <div key={drinkName} className="flex items-center gap-3">
                <p className="flex-1 min-w-0 text-sm font-sans font-medium text-stone-800 dark:text-stone-100 truncate">
                  {drinkName}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => decrementCart(drinkName)}
                    className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation rounded-full"
                    aria-label="Decrease quantity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-sm font-sans font-medium text-stone-800 dark:text-stone-100 w-5 text-center tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => incrementCart(drinkName)}
                    className="w-7 h-7 flex items-center justify-center border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-500 dark:hover:border-stone-400 transition-colors touch-manipulation rounded-full"
                    aria-label="Increase quantity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={placeOrder}
              disabled={orderState === "loading" || !isConfigured}
              className="
                mt-1 w-full py-3 rounded-xl
                bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900
                text-[11px] uppercase tracking-[0.25em] font-sans font-medium
                transition-all duration-200 touch-manipulation
                hover:bg-stone-700 dark:hover:bg-stone-300 active:bg-stone-900 dark:active:bg-stone-100
                disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none
              "
            >
              {orderState === "loading"
                ? "Placing…"
                : `Place Order — ${totalDrinks} ${totalDrinks === 1 ? "drink" : "drinks"}`}
            </button>
            {orderState === "error" && (
              <p className="text-center text-xs text-red-400 font-sans">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Confirmation screen ──────────────────────────────────────
function ConfirmedState({ name, orderRef, items }: { name: string; orderRef: string; items: CartItem[] }) {
  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black flex flex-col items-center justify-center px-5 sm:px-8 py-16">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />
      <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center gap-8">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">hello kopi</span>
          <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 dark:text-stone-500 font-sans">Order placed</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-stone-800 dark:text-stone-100">{name}</h1>
          <div className="flex flex-col items-center gap-1 mt-1">
            {items.map(({ name: drinkName, qty }) => (
              <p key={drinkName} className="font-serif text-xl font-light italic text-stone-500 dark:text-stone-400">
                {drinkName}{qty > 1 ? ` ×${qty}` : ""}
              </p>
            ))}
          </div>
          <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans">Order reference</p>
            <p className="font-serif text-3xl sm:text-4xl font-light tracking-[0.2em] text-stone-700 dark:text-stone-200">{orderRef}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <Link href="/orders" className="w-full sm:w-auto sm:px-8 py-3.5 rounded-xl text-center bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 touch-manipulation hover:bg-stone-700 dark:hover:bg-stone-300 focus:outline-none">
            View Orders
          </Link>
          <Link href="/" className="w-full sm:w-auto sm:px-8 py-3.5 rounded-xl text-center border border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 text-[11px] uppercase tracking-[0.25em] font-sans font-medium transition-all duration-300 touch-manipulation hover:border-stone-600 dark:hover:border-stone-400 hover:text-stone-700 dark:hover:text-stone-200 focus:outline-none">
            Back
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderContent />
    </Suspense>
  );
}
