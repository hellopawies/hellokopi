// Shimmer skeleton placeholders. Used instead of <BrewingCup /> at tab-level
// loads where we already know the final layout — the page snaps to its final
// shape and just fills in the data, instead of unfurling from a centred cup.
//
// The actual sweep animation lives in globals.css (.skeleton class) so it
// honours prefers-reduced-motion in one place.

interface BoxProps {
  className?: string;
  /** Inline style — handy for staggered animation delay. */
  style?: React.CSSProperties;
}

/** Generic rounded rectangle. */
export function SkeletonBox({ className = "", style }: BoxProps) {
  return <div className={`skeleton rounded-md ${className}`} style={style} />;
}

/** A single DrinkCard placeholder — matches the real card's footprint so the
    page doesn't jump when content arrives. */
export function DrinkCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-3 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <SkeletonBox className="h-4 w-28" />
        <SkeletonBox className="h-5 w-5 rounded-full" />
      </div>
      <SkeletonBox className="h-3 w-3/4" />
      <SkeletonBox className="h-3 w-1/2" />
      <div className="mt-auto flex justify-end pt-1">
        <SkeletonBox className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

/** A row of name chips on the home page. */
export function MembersChipSkeleton() {
  // Widths chosen to mimic real name pills — Sarah, Aaron, Joshua, Bei Lin…
  const widths = ["w-20", "w-16", "w-24", "w-20", "w-16", "w-28", "w-20", "w-16", "w-24"];
  return (
    <div className="flex flex-wrap gap-2 justify-center" aria-label="Loading names">
      {widths.map((w, i) => (
        <SkeletonBox
          key={i}
          className={`h-9 rounded-full ${w}`}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

/** Orders list session card placeholder — the runner sees this on /orders
    while the network round-trip lands. Decorative; the parent wrapper
    carries the aria-label so multiple stacked skeletons announce once. */
export function SessionSkeleton() {
  return (
    <div
      className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 flex flex-col gap-4"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <SkeletonBox className="h-5 w-32" />
        <SkeletonBox className="h-4 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-2.5">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
        <SkeletonBox className="h-4 w-4/6" />
      </div>
    </div>
  );
}

/** Bento-shaped grid of DrinkCardSkeletons matching the new My Picks layout —
    one hero plus several smaller tiles. */
export function MyPicksBentoSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-4 gap-2.5"
      aria-label="Loading your saved picks"
    >
      {Array.from({ length: count }).map((_, i) => {
        const span = i === 0 ? "col-span-4 sm:col-span-2 sm:row-span-2" : "col-span-2";
        return <DrinkCardSkeleton key={i} className={span} />;
      })}
    </div>
  );
}
