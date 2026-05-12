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

  // Hot — flame outline. Lucide-style single-path flame for a recognisable
  // silhouette at small sizes.
  return (
    <svg
      role="img"
      aria-label="Hot"
      className={`${className} text-red-500 dark:text-red-400 flex-shrink-0`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </svg>
  );
}
