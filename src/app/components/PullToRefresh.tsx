"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 72;
const MAX_DRAG = 110;

function rubberBand(x: number): number {
  return MAX_DRAG * (1 - Math.exp(-2.2 * x / MAX_DRAG));
}

type Phase = "idle" | "pulling" | "ready" | "refreshing";

function KopiCup({ progress, ready, spinning }: { progress: number; ready: boolean; spinning: boolean }) {
  const opacity = 0.35 + progress * 0.65;
  const steamOpacity = Math.max(0, (progress - 0.2) / 0.8);
  const animated = ready || spinning;

  return (
    <svg
      viewBox="0 0 100 100"
      width="30"
      height="30"
      className={spinning ? "kopi-cup-spin" : ""}
      style={{
        overflow: "visible",
        transform: spinning ? undefined : `scale(${0.65 + progress * 0.35})`,
        transition: spinning ? undefined : "transform 0.06s ease",
      }}
    >
      {/* Steam */}
      <g opacity={steamOpacity}>
        <path d="M38 37 Q42 26 38 17" fill="none" stroke="#a8a29e" strokeWidth="3.5" strokeLinecap="round"
          className={animated ? "kopi-steam-1" : ""} />
        <path d="M50 33 Q54 20 50 9" fill="none" stroke="#a8a29e" strokeWidth="3.5" strokeLinecap="round"
          className={animated ? "kopi-steam-2" : ""} />
        <path d="M62 37 Q66 26 62 17" fill="none" stroke="#a8a29e" strokeWidth="3.5" strokeLinecap="round"
          className={animated ? "kopi-steam-3" : ""} />
      </g>

      {/* Cup body */}
      <path d="M28 43 L34 70 Q35.5 76 42 76 L58 76 Q64.5 76 66 70 L72 43 Z"
        className="kopi-cup-body" opacity={opacity} />

      {/* Handle */}
      <path d="M66 53 Q80 53 80 63 Q80 73 66 73"
        fill="none" className="kopi-cup-handle-stroke" strokeWidth="5" strokeLinecap="round"
        opacity={opacity} />

      {/* Saucer */}
      <ellipse cx="50" cy="78" rx="18" ry="3.5"
        fill="#78716c" opacity={0.4 + progress * 0.5} />
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
      setTimeout(() => window.location.reload(), 900);
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
  const indicatorY = phase === "refreshing" ? 20 : pullY - 56;

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
      <div
        className="ptr-indicator w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
        }}
      >
        <KopiCup progress={progress} ready={phase === "ready"} spinning={phase === "refreshing"} />
      </div>
    </div>
  );
}
