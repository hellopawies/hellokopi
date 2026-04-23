export default function BrewingCup({ className = "py-20" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <svg width="36" height="36" viewBox="0 0 40 44" fill="none" aria-label="Loading">
        {/* steam lines */}
        <line x1="14" y1="12" x2="14" y2="2"  className="ptr-steam ptr-brewing ptr-steam-1" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="12" x2="20" y2="2"  className="ptr-steam ptr-brewing ptr-steam-2" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="12" x2="26" y2="2"  className="ptr-steam ptr-brewing ptr-steam-3" strokeWidth="2" strokeLinecap="round" />
        {/* cup body */}
        <path d="M8 14 h24 l-3 16 H11 Z"       className="ptr-cup-stroke" strokeWidth="2" strokeLinejoin="round" />
        {/* handle */}
        <path d="M32 18 q8 0 8 8 q0 8 -8 8"    className="ptr-cup-stroke" strokeWidth="2" fill="none" />
        {/* saucer */}
        <line x1="4"  y1="32" x2="36" y2="32"  className="ptr-cup-stroke" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
