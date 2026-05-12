"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 72;
const MAX_DRAG = 110;

function rubberBand(x: number): number {
  return MAX_DRAG * (1 - Math.exp(-2.2 * x / MAX_DRAG));
}

type Phase = "idle" | "pulling" | "ready" | "refreshing";

function KopiCupOutline({ progress, brewing }: { progress: number; brewing: boolean }) {
  const opacity = Math.max(0, (progress - 0.1) / 0.9);
  const steamOpacity = Math.max(0, (progress - 0.3) / 0.7);

  return (
    <svg viewBox="0 0 64 64" width="36" height="36" style={{ overflow: "visible" }}>
      {/* Steam / smoke */}
      <g opacity={steamOpacity}>
        <path
          d="M22 22 Q19 16 22 10"
          fill="none" strokeWidth="1.8" strokeLinecap="round"
          className={`ptr-steam ptr-steam-1 ${brewing ? "ptr-brewing" : ""}`}
        />
        <path
          d="M32 19 Q29 12 32 5"
          fill="none" strokeWidth="1.8" strokeLinecap="round"
          className={`ptr-steam ptr-steam-2 ${brewing ? "ptr-brewing" : ""}`}
        />
        <path
          d="M42 22 Q39 16 42 10"
          fill="none" strokeWidth="1.8" strokeLinecap="round"
          className={`ptr-steam ptr-steam-3 ${brewing ? "ptr-brewing" : ""}`}
        />
      </g>

      {/* Cup body */}
      <path
        d="M16 26 L20 50 Q21 54 25 54 L39 54 Q43 54 44 50 L48 26 Z"
        fill="none" strokeWidth="1.8" strokeLinejoin="round"
        className="ptr-cup-stroke"
        opacity={opacity}
      />

      {/* Handle */}
      <path
        d="M44 34 Q54 34 54 41 Q54 48 44 48"
        fill="none" strokeWidth="1.8" strokeLinecap="round"
        className="ptr-cup-stroke"
        opacity={opacity}
      />

      {/* Saucer */}
      <path
        d="M12 56 Q32 61 52 56"
        fill="none" strokeWidth="1.8" strokeLinecap="round"
        className="ptr-cup-stroke"
        opacity={opacity * 0.7}
      />
    </svg>
  );
}

export function PullToRefresh() {
  const [pullY, setPullY] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const startY = useRef(0);
  const active = useRef(false);
  const latestPull = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY > 2) return;
    // Skip when the touch originates from an interactive drag handle (e.g.
    // the admin Members reorder grip). Otherwise pulling that handle down
    // would race with PTR and trigger a reload.
    const target = e.target as Element | null;
    if (target?.closest?.("[data-drag-handle]")) return;
    startY.current = e.touches[0].clientY;
    active.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!active.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      active.current = false;
      setPullY(0);
      setPhase("idle");
      return;
    }
    e.preventDefault();
    const y = rubberBand(dy);
    latestPull.current = y;
    setPullY(y);
    setPhase(y >= THRESHOLD ? "ready" : "pulling");
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    if (latestPull.current >= THRESHOLD) {
      setPhase("refreshing");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setPhase("idle");
      setPullY(0);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const show = phase !== "idle";
  const indicatorY = phase === "refreshing" ? 24 : pullY - 60;

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[200] flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${indicatorY}px)`,
        transition:
          phase === "idle"
            ? "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease"
            : phase === "refreshing"
            ? "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)"
            : "none",
        opacity: show ? 1 : 0,
      }}
    >
      <KopiCupOutline progress={progress} brewing={phase === "ready" || phase === "refreshing"} />
    </div>
  );
}
