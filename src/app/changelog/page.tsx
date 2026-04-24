export const VERSIONS = [
  {
    version: "v3.2.2",
    date: "24 Apr 2026",
    title: "Cleaner session expiry",
    changes: [
      "Active order card now disappears on its own when the 15-min session window closes — no more \"Session ended\" state with a Cancel button that deleted the order from history",
      "Your order stays intact in history either way; it just stops being actionable once the collector's window has closed",
    ],
  },
  {
    version: "v3.2.1",
    date: "24 Apr 2026",
    title: "Hot or Iced on Tea Hut",
    changes: [
      "Tea Hut drinks now have a Hot / Iced toggle at the top of the customisation panel",
      "Iced-only drinks (Iced Sparkling, Iced Milo Dino, etc.) keep the existing \"Iced only\" badge and skip the toggle",
      "Hot and iced variants of the same drink track as separate cart lines",
    ],
  },
  {
    version: "v3.2.0",
    date: "24 Apr 2026",
    title: "Inline Tea Hut customisation",
    changes: [
      "Tapping a Tea Hut drink now expands options right under the tapped row instead of sliding up a bottom sheet — no modal, no backdrop",
      "Tap the same card again to collapse it; selected cards get a darker border for feedback",
      "Same Intensity / Eva Milk / Add-on pills and same Add to Order button — just without the context switch",
    ],
  },
  {
    version: "v3.1.1",
    date: "24 Apr 2026",
    title: "Order direct link restored",
    changes: [
      "The subtle \"Order direct from Old Tea Hut\" link under the search box is back — opens the shop's autopos.cloud order page in a new tab",
    ],
  },
  {
    version: "v3.1.0",
    date: "23 Apr 2026",
    title: "Tea Hut polish",
    changes: [
      "Tea Hut categories now live behind All-Drinks-style pills — tap to expand, tap again to collapse",
      "Drinks render as 2-column cards, each with a brown heart to save favourites",
      "Replaced the tab header with a Search drinks… input that filters across every category",
      "Customisation bubble matches the All Drinks floating bar (same width, opacity, shadow)",
      "Removed the JS/HJS short codes from drink names",
    ],
  },
  {
    version: "v3.0.0",
    date: "23 Apr 2026",
    title: "Old Tea Hut menu",
    changes: [
      "New Tea Hut tab — full Old Tea Hut menu with 57 drinks across 6 categories",
      "Tap any drink to open a customisation sheet: Intensity (Regular / Light / Extra Light / Strong / Extra Strong), Eva Milk level, and Add Ons",
      "Live order preview updates as you pick options — shows exactly what goes into the cart",
      "Cart count badge on each drink row so you can see what you've already added",
      "Iced-only drinks are clearly labelled",
    ],
  },
  {
    version: "v2.9.0",
    date: "23 Apr 2026",
    title: "Brewing loader",
    changes: [
      "All loading states now show the same coffee cup brewing animation as the pull-to-refresh — no more plain \"Loading…\" text",
    ],
  },
  {
    version: "v2.8.0",
    date: "23 Apr 2026",
    title: "Breathing animations",
    changes: [
      "Active order card breathes — a soft border pulses in and out while the session window is open",
      "Place Order button has a gentle ambient glow when idle",
      "Tab content fades up each time you switch between My Picks, Top Orders, and All Drinks",
    ],
  },
  {
    version: "v2.7.0",
    date: "23 Apr 2026",
    title: "Motion & microinteractions",
    changes: [
      "Surprise Me button flashes through drinks with a slot-machine deceleration before landing on one",
      "Cart count badge springs with a bounce when a drink is added",
      "Header compresses as you scroll down — title shrinks, tagline hides to reclaim space",
      "My Picks cards stagger in with a small delay between each on first load",
      "Cart panel border briefly brightens when your total increases",
      "Hawker glossary — underlined terms in drink descriptions open a bottom sheet with plain-English explanations",
    ],
  },
  {
    version: "v2.6.0",
    date: "22 Apr 2026, 2:00 am",
    title: "Order session fixes",
    changes: [
      "Qty badge now appears inline next to the drink name in the orders list",
      "Fixed: editing or re-ordering no longer creates duplicate rows — only one order row per person per session",
      "Fixed: placing a new order while an active one exists now adds to it instead of replacing it",
      "Fixed: active order banner now shows the correct aggregated total across all items in the session",
      "Active order banner shows a live countdown timer — turns amber under 5 minutes, red under 2 minutes",
    ],
  },
  {
    version: "v2.5.0",
    date: "22 Apr 2026, 1:00 am",
    title: "Active order controls",
    changes: [
      "Cancel your own active order — tap Cancel next to Edit to remove just your order from the current session",
      "Cancel and Edit buttons have a filled background in dark mode so they look like proper buttons",
      "Drink row highlight is now rounded in both light and dark mode",
    ],
  },
  {
    version: "v2.4.0",
    date: "22 Apr 2026, 12:00 am",
    title: "Floating cart & liquid glass",
    changes: [
      "Cart bar lifts off the screen edge — rounded corners, backdrop blur, and a soft drop shadow",
      "Sticky headers on all pages now blur content scrolling behind them — iOS-style frosted glass effect",
    ],
  },
  {
    version: "v2.3.0",
    date: "20 Apr 2026, 3:00 am",
    title: "Design consistency pass",
    changes: [
      "Smooth page-in animation on every page — content fades up on arrival",
      "Order tabs use a sliding pill with a spring bounce instead of a static underline",
      "All buttons and chips consistently rounded — pill shape for filters and modifiers, rounded-xl for CTAs",
      "All Drinks base selectors and specials chips are now pills",
      "Orders page quantity badge is now a rounded pill",
      "Greeting page name dropdown panel now has rounded corners",
      "Drink card quantity no longer overlaps the description — shown inline with the drink name",
    ],
  },
  {
    version: "v2.2.0",
    date: "20 Apr 2026, 2:00 am",
    title: "Card depth & transitions",
    changes: [
      "Drink cards now lift and cast a shadow on hover",
      "Smoother transitions and subtle active press feel on all interactive elements",
    ],
  },
  {
    version: "v2.1.0",
    date: "20 Apr 2026, 1:00 am",
    title: "Order countdown",
    changes: [
      "Live countdown timer on each active session — shows how long before the window closes",
      "Turns amber under 5 minutes, red under 2 minutes",
    ],
  },
  {
    version: "v2.0.0",
    date: "20 Apr 2026, 12:30 am",
    title: "Quality of life",
    changes: [
      "Search drinks — type to find any drink instantly across all categories",
      "Re-order with one tap — your last order shows up in My Picks",
      "Clear cart button to start over without removing drinks one by one",
    ],
  },
  {
    version: "v1.9.0",
    date: "20 Apr 2026, 12:00 am",
    title: "Drink builder",
    changes: [
      "Pick your base (Kopi, Teh, Milo…) then dial in your modifiers",
      "Milk: condensed / O (black) / C (evap) — only one at a time",
      "Sweetness, strength, and temperature each pick one option",
      "Specials (Tarik, Dinosaur, Godzilla…) as quick-pick chips",
      "Tap ♡ on any customised drink to save it to My Picks",
      "Bandung has its own set of options",
    ],
  },
  {
    version: "v1.8.0",
    date: "19 Apr 2026, 9:15 pm",
    title: "Kopi icon & home screen app",
    changes: [
      "Kopi cup favicon now shows in browser tab and bookmarks",
      "Add to Home Screen on iPhone — opens as a full-screen app with the kopi icon",
      "Fixed navigation flash — no more black screen when tapping the home button",
    ],
  },
  {
    version: "v1.7.0",
    date: "19 Apr 2026, 8:13 pm",
    title: "System dark mode",
    changes: [
      "App now follows your phone's dark/light mode setting automatically",
      "Removed the manual moon/sun toggle",
      "Dark mode handled entirely via CSS — no flash on refresh or navigation",
    ],
  },
  {
    version: "v1.6.0",
    date: "19 Apr 2026, 7:59 pm",
    title: "Time fixes & polish",
    changes: [
      "All times now use Singapore time (UTC+8) regardless of device timezone",
      "Session window reduced to 15 minutes — orders placed more than 15 min apart start a new session",
      "Orders page shows session time range e.g. \"3:01 – 3:16\"",
      "Fixed name selector dropdown background — fully opaque in light mode",
      "Changelog page cleanup — removed redundant back button and Check Orders link",
    ],
  },
  {
    version: "v1.5.0",
    date: "19 Apr 2026, 7:45 pm",
    title: "Multi-drink cart",
    changes: [
      "Add drinks to a cart — order multiple different drinks in one go",
      "Adjust quantity per drink with − and + controls in the order bar",
      "Reordered tabs: My Picks → Top Orders → All Drinks",
      "Orders display now correctly counts multi-drink orders",
    ],
  },
  {
    version: "v1.4.0",
    date: "19 Apr 2026, 7:28 pm",
    title: "Returning user & resilience",
    changes: [
      "Home page remembers your name — returning users skip the selector",
      "\"Not you?\" link to switch to a different person",
      "Fixed black screen flash when navigating back to home",
      "Orders page now times out after 8 seconds instead of hanging",
      "Added Try Again button when orders fail to load",
    ],
  },
  {
    version: "v1.3.0",
    date: "19 Apr 2026, 7:06 pm",
    title: "Sticky headers & orders UX",
    changes: [
      "Full header block (brand + heading + tabs) sticks to top while scrolling",
      "Orders page matches the same sticky header behaviour",
      "Day tabs on orders page — Today, Yesterday, or date",
      "Rotating funny quips on the orders page",
      "Removed decorative gradient lines for cleaner look",
    ],
  },
  {
    version: "v1.2.0",
    date: "19 Apr 2026, 6:34 pm",
    title: "Dark mode & layout polish",
    changes: [
      "Dark mode toggle (moon/sun) in the top-left corner",
      "OLED pure black dark mode — saves battery on AMOLED screens",
      "Hot drinks first, iced (Peng) drinks sorted to the end",
      "Fixed mobile header overlap on small screens",
      "Fixed dropdown readability in dark mode",
      "Standardised content width across all pages",
    ],
  },
  {
    version: "v1.1.0",
    date: "19 Apr 2026, 5:55 pm",
    title: "Full drink menu & orders view",
    changes: [
      "Full kopitiam drink menu with categories and descriptions",
      "Top Orders tab — see what the team is ordering most",
      "My Picks tab — save favourite drinks with the heart button",
      "All Drinks tab — browse the full menu by category",
      "Orders page shows drinks grouped by session with cup counts",
    ],
  },
  {
    version: "v1.0.0",
    date: "19 Apr 2026, 4:55 pm",
    title: "Initial launch",
    changes: [
      "Greeting page with colleague name selector",
      "Drink order page with confirmation and order reference",
      "Check Orders page to see who ordered what",
      "Deployed to GitHub Pages",
    ],
  },
];

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
              Changelog
            </h1>
            <p className="font-serif text-base sm:text-lg font-light italic text-stone-400 dark:text-stone-500 mt-1.5">
              What&apos;s new in hello kopi.
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
