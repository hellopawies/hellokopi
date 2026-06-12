"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once `ms` milliseconds have elapsed since the hook mounted.
 * Used to gate skeleton placeholders so they only appear if a load actually
 * takes time — keeps fast (<200ms) responses from flashing a skeleton.
 */
export function useDelayed(ms: number): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}
