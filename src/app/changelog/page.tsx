import { VERSIONS } from "@/data/changelog";

export default function ChangelogPage() {
  return (
    <main className="relative min-h-[100dvh] bg-[#FAFAF8] dark:bg-black pb-16">

      {/* Sticky header */}
      <div className="liquid-glass-top sticky top-0 z-30 bg-[#FAFAF8]/80 dark:bg-black/75">
        <div className="px-5 sm:px-8 pt-12 sm:pt-6 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="max-w-lg mx-auto">
            <span className="text-[11px] uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 font-sans font-medium">
              hello kopi
            </span>
            <div className="w-6 h-px bg-stone-300 dark:bg-stone-700 mt-1.5 mb-4" />
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-stone-800 dark:text-stone-100 leading-tight">
              What&apos;s brewing
            </h1>
            <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 dark:text-stone-500 mt-1.5">
              Every tweak, fix, and small joy added to hello kopi.
            </p>
          </div>
        </div>
      </div>

      {/* Version list */}
      <div className="px-5 sm:px-8 pt-8 pb-16">
        <div className="max-w-lg mx-auto flex flex-col gap-10">
          {VERSIONS.map(({ version, date, title, changes }) => (
            <div key={version} className="flex gap-5 sm:gap-7">
              {/* Version pill + timeline line */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-sans font-medium text-stone-400 dark:text-stone-500 tabular-nums whitespace-nowrap leading-[1.6]">
                  {version}
                </span>
                <div className="w-px flex-1 bg-stone-100 dark:bg-stone-800 min-h-[2rem]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 font-sans mb-1.5 leading-[1.6]">
                  {date}
                </p>
                <h2 className="font-serif text-xl font-light tracking-wide text-stone-800 dark:text-stone-100 mb-3">
                  {title}
                </h2>
                <ul className="flex flex-col gap-2">
                  {changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-[5px] w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600 flex-shrink-0" />
                      <span className="text-sm font-sans text-stone-500 dark:text-stone-400 leading-relaxed">
                        {c}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Bottom cap */}
          <div className="flex gap-5 sm:gap-7">
            <div className="flex flex-col items-center pt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700" />
            </div>
            <p className="font-serif text-sm font-light italic text-stone-300 dark:text-stone-600 pb-2">
              The beginning.
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}
