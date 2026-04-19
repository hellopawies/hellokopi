"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const path = usePathname();
  const onOrders = path.endsWith("/orders");

  return (
    <div className="fixed top-0 right-0 z-50 p-5 sm:p-6">
      <Link
        href={onOrders ? "/" : "/orders"}
        className="text-[10px] uppercase tracking-[0.25em] text-stone-400 hover:text-stone-700 transition-colors duration-200 font-sans font-medium touch-manipulation"
      >
        {onOrders ? "← Place Order" : "Check Orders →"}
      </Link>
    </div>
  );
}
