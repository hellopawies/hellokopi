export default function BrewingCup({ className = "py-20" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`} aria-label="Loading">
      <svg viewBox="0 0 64 64" width="36" height="36" style={{ overflow: "visible" }}>
        {/* Steam */}
        <g>
          <path d="M22 22 Q19 16 22 10" fill="none" strokeWidth="1.8" strokeLinecap="round"
            className="ptr-steam ptr-brewing ptr-steam-1" />
          <path d="M32 19 Q29 12 32 5"  fill="none" strokeWidth="1.8" strokeLinecap="round"
            className="ptr-steam ptr-brewing ptr-steam-2" />
          <path d="M42 22 Q39 16 42 10" fill="none" strokeWidth="1.8" strokeLinecap="round"
            className="ptr-steam ptr-brewing ptr-steam-3" />
        </g>
        {/* Cup body */}
        <path d="M16 26 L20 50 Q21 54 25 54 L39 54 Q43 54 44 50 L48 26 Z"
          fill="none" strokeWidth="1.8" strokeLinejoin="round" className="ptr-cup-stroke" />
        {/* Handle */}
        <path d="M44 34 Q54 34 54 41 Q54 48 44 48"
          fill="none" strokeWidth="1.8" strokeLinecap="round" className="ptr-cup-stroke" />
        {/* Saucer */}
        <path d="M12 56 Q32 61 52 56"
          fill="none" strokeWidth="1.8" strokeLinecap="round" className="ptr-cup-stroke" style={{ opacity: 0.7 }} />
      </svg>
    </div>
  );
}
