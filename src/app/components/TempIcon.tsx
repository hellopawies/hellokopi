import { drinkTemp } from "@/lib/drinkName";

/**
 * Tiny snowflake / steam-wisp glyph beside drink names. Visual + a11y label
 * pairing for hot vs iced, complementing the colour-dot base marker.
 * Returns null for drinks we can't reliably classify.
 */
export function TempIcon({ name, className = "w-3 h-3" }: { name: string; className?: string }) {
  const temp = drinkTemp(name);
  if (!temp) return null;

  if (temp === "iced") {
    return (
      <svg
        role="img"
        aria-label="Iced"
        className={`${className} text-blue-400 dark:text-blue-300 flex-shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      >
        {/* Six-arm snowflake */}
        <path d="M12 3v18" />
        <path d="M4.21 7.5L19.79 16.5" />
        <path d="M4.21 16.5L19.79 7.5" />
      </svg>
    );
  }

  // Hot — three rising steam wisps, mirrors the BrewingCup motif.
  return (
    <svg
      role="img"
      aria-label="Hot"
      className={`${className} text-red-400 dark:text-red-400 flex-shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <path d="M8 16 Q6 12 8 8" />
      <path d="M12 16 Q10 12 12 8" />
      <path d="M16 16 Q14 12 16 8" />
    </svg>
  );
}
