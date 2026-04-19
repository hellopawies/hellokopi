"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good evening";
}

export default function GreetingPage() {
  const [name, setName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setGreeting(getGreeting());
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    router.push(`/order?name=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-6">
      {/* Subtle top rule */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      <div
        className="w-full max-w-md flex flex-col items-center text-center gap-10"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 0.6s ease-out" }}
      >
        {/* Logo / brand */}
        <div
          className="flex flex-col items-center gap-1"
          style={{
            animation: ready ? "fadeUp 0.7s ease-out forwards" : "none",
          }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.3em] text-stone-400 font-sans font-medium"
          >
            hello kopi
          </span>
          <div className="w-6 h-px bg-stone-300 mt-1" />
        </div>

        {/* Greeting */}
        <div
          className="flex flex-col items-center gap-4"
          style={{
            animation: ready ? "fadeUp 0.7s 0.15s ease-out both" : "none",
          }}
        >
          <h1 className="font-serif text-5xl font-light tracking-wide text-stone-800 leading-tight">
            {greeting}
          </h1>
          <p className="font-serif text-xl font-light italic text-stone-400 leading-relaxed">
            Who shall we say is ordering?
          </p>
        </div>

        {/* Name form */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col items-center gap-6"
          style={{
            animation: ready ? "fadeUp 0.7s 0.3s ease-out both" : "none",
          }}
        >
          <div className="w-full relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="
                w-full bg-transparent border-0 border-b border-stone-300
                focus:border-stone-600 focus:outline-none
                text-center text-stone-800 text-lg font-sans font-light
                placeholder:text-stone-300 placeholder:font-light
                py-3 transition-colors duration-300
                tracking-wide
              "
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="
              mt-2 px-10 py-3
              border border-stone-800 text-stone-800
              text-[11px] uppercase tracking-[0.25em] font-sans font-medium
              transition-all duration-300
              hover:bg-stone-800 hover:text-white
              disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-800
              focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-2
            "
          >
            Continue
          </button>
        </form>
      </div>

      {/* Bottom subtle decoration */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <div className="w-px h-6 bg-stone-200" />
        <span className="text-[10px] uppercase tracking-[0.25em] text-stone-300 font-sans">
          Lunch Orders
        </span>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
