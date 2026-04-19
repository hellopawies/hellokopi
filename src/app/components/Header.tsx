"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const path = usePathname();
  const router = useRouter();
  const onOrders = path.endsWith("/orders");
  const onHome = path === "/" || path === "";

  return (
    <>
      <div className="fixed top-0 left-0 z-50 p-5 sm:p-6 flex items-center gap-3">
        <ThemeToggle />
        {!onHome && (
          <Link
            href="/"
            aria-label="Home"
            className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-200 touch-manipulation focus:outline-none"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </Link>
        )}
      </div>
      <div className="fixed top-0 right-0 z-50 p-5 sm:p-6">
        {onOrders ? (
          <button
            onClick={() => router.back()}
            className="text-[10px] uppercase tracking-[0.25em] text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors duration-200 font-sans font-medium touch-manipulation"
          >
            ← Place Order
          </button>
        ) : (
          <Link
            href="/orders"
            className="text-[10px] uppercase tracking-[0.25em] text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 transition-colors duration-200 font-sans font-medium touch-manipulation"
          >
            Check Orders →
          </Link>
        )}
      </div>
    </>
  );
}
