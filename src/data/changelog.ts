export const VERSIONS = [
  {
    version: "v3.4.7",
    date: "28 Apr 2026",
    title: "Name selector is now a one-tap grid",
    changes: [
      "Picking your name on the home page no longer needs two taps through a dropdown — every name is a pill chip in a single compact grid, all visible at once. Others is the last chip and reveals the name input inline when tapped. Returning users (cached name) see the same Continue + Not you flow as before.",
    ],
  },
  {
    version: "v3.4.6",
    date: "28 Apr 2026",
    title: "All Drinks moves to the middle",
    changes: [
      "Order page tabs are now My Picks · All Drinks · Top Choice — the full menu sits in the middle for one-thumb reach. Sliding pill follows the new order automatically.",
    ],
  },
  {
    version: "v3.4.5",
    date: "28 Apr 2026",
    title: "Home-screen icon plays nice with iOS",
    changes: [
      "The home-screen icon now adapts to your iOS appearance: cream brand background by default (sits well in light + tinted modes), and a dark variant kicks in automatically when your iOS home screen is in dark mode. Existing installs need to delete-and-re-add to pick up the new icon.",
    ],
  },
  {
    version: "v3.4.4",
    date: "28 Apr 2026",
    title: "Faster first paint",
    changes: [
      "Cormorant Garamond and Inter are now self-hosted via next/font instead of loaded from fonts.googleapis.com — drops the render-blocking external request and shaves a noticeable chunk off first paint, especially on slower office networks. Look the same as before, just arrive faster.",
    ],
  },
  {
    version: "v3.4.3",
    date: "28 Apr 2026",
    title: "Drink-colour dots on the orders list",
    changes: [
      "Each drink on /orders now has a small coloured dot beside its name — brown for kopi, tan for teh, green for milo, honey for horlicks, rose for bandung, and a few more — so the runner can scan the list visually instead of reading every line. Decorative only; screen readers ignore it.",
    ],
  },
  {
    version: "v3.4.2",
    date: "28 Apr 2026",
    title: "Removed voice search",
    changes: [
      "Mic icon and Web Speech API integration on the All Drinks search are gone — voice was unreliable for kopitiam vocabulary (Hokkien terms like Siew Dai never got transcribed cleanly) and the manual search is plenty fast. Search input is back to its original simple form.",
    ],
  },
  {
    version: "v3.4.1",
    date: "28 Apr 2026",
    title: "Tighter session window",
    changes: [
      "Session window reduced from 15 minutes to 10 — orders placed more than 10 minutes apart now start a new session, the active-order edit window closes 10 minutes after your first order, and the live countdown on /orders ticks from 10:00 down. Single source of truth: SESSION_MS in src/lib/constants.ts.",
    ],
  },
  {
    version: "v3.4.0",
    date: "28 Apr 2026",
    title: "Stability pass",
    changes: [
      "If a Supabase request fails or times out, the screen no longer freezes on a permanent loading spinner — loaders clear and the page renders what it can",
      "If the page throws an unexpected error mid-render, you now get a calm \"Something cracked\" screen with a Try again button, instead of a white screen",
      "Async fetches no longer write to a screen that's been left — fixes a class of subtle bugs where switching pages mid-load could overwrite fresh data",
      "Heart button on drink cards is now properly accessible — screen readers announce save/unsave state correctly (was nested-button HTML before)",
      "Cleaned up stray Bandung variants that weren't actually orderable in the menu — Bandung Peng still lives in Others, the rest are gone",
    ],
  },
  {
    version: "v3.3.10",
    date: "28 Apr 2026",
    title: "Cart picks up where you left off",
    changes: [
      "Your in-progress cart now persists locally — close the tab, reload, or get yanked into a meeting, and the drinks you'd already added are still there when you come back. Auto-clears the moment you place the order, switch to a different name, or after 24 hours.",
    ],
  },
  {
    version: "v3.3.9",
    date: "28 Apr 2026",
    title: "Voice search on All Drinks",
    changes: [
      "Tap the mic icon next to the All Drinks search box and say what you want — \"Kopi C Siew Dai\" or \"Teh O Peng\" — and the search filters to it. Common phonetic mishears like \"see\" → C and \"oh\" → O are normalised so single-letter modifiers still match. Hidden on browsers without Web Speech support (e.g. Firefox).",
    ],
  },
  {
    version: "v3.3.8",
    date: "28 Apr 2026",
    title: "Brewing… pulling… steeping…",
    changes: [
      "The loading cup now cycles through a small set of brewing verbs — Brewing, Pulling, Steeping, Stirring, Frothing — instead of sitting silently. Picks a random starting verb on each load so it's not the same word every time",
    ],
  },
  {
    version: "v3.3.7",
    date: "28 Apr 2026",
    title: "Descriptions for builder-composed drinks",
    changes: [
      "Drinks composed in the builder (e.g. Teh C Po Kosong) now get a short description on My Picks and Top Choice cards, so they don't read as a bare name with empty space underneath",
    ],
  },
  {
    version: "v3.3.6",
    date: "28 Apr 2026",
    title: "Surprise Me stays on the menu",
    changes: [
      "Surprise Me and the All Drinks search now only draw from drinks you can actually order — variations of Kopi, Teh, Teh Halia, Yuan Yang, Milo, Horlicks, plus everything in Others. Stray legacy entries like Bandung Soda no longer turn up.",
    ],
  },
  {
    version: "v3.3.5",
    date: "28 Apr 2026",
    title: "Tick off as you tell the cashier",
    changes: [
      "Tap any drink line on the orders page to fade and strike it through — handy when you're at the counter calling drinks one by one and lose track of which you've said. Ticks are local to the session view and don't save anywhere; refresh resets them. Not a status field, just a memory aid.",
    ],
  },
  {
    version: "v3.3.4",
    date: "28 Apr 2026",
    title: "Quieter cart",
    changes: [
      "Removed the bouncy slam animation when adding to the cart — a single subtle add is enough; the bounce got noisy when adding several drinks in a row",
    ],
  },
  {
    version: "v3.3.3",
    date: "28 Apr 2026",
    title: "Hot or iced at a glance",
    changes: [
      "Each session row on the orders page now shows the hot/iced split next to the cup count — red for hot, blue for iced — so the runner can call the order at the counter without parsing every drink name",
      "WhatsApp share text carries the same split at the bottom — \"5 cups · 3 hot · 2 iced\"",
      "Removed the separate copy button — Share on WhatsApp already opens with the order text ready to paste anywhere",
    ],
  },
  {
    version: "v3.3.2",
    date: "27 Apr 2026",
    title: "WhatsApp order sharing",
    changes: [
      "Share any order session to WhatsApp with one tap — opens WhatsApp so you can pick which group to send to",
      "Copy button next to it lets you paste the order list anywhere else",
      "Shared text shows drink names and quantities only — no names attached",
    ],
  },
  {
    version: "v3.3.1",
    date: "24 Apr 2026",
    title: "Back to basics",
    changes: [
      "Cancel on an active order is instant again — no 5-second undo toast in the way",
      "All Drinks tab opens directly on the drink-builder again (Kopi / Teh / Milo… base pills first)",
      "Everything else from v3.3.0 stays — day-aware greeting, bigger taps, friendlier copy, focus rings, the lot",
    ],
  },
  {
    version: "v3.3.0",
    date: "24 Apr 2026",
    title: "Humanisation pass",
    changes: [
      "Home greeting now riffs on the time of day — Friday energy, Monday gentle start, late-night working vibes",
      "Orders-page quips weight toward the day you're in — more Friday banter on Fridays, payday jokes near month-end",
      "Cancel on an active order is now undoable for 5 seconds before it actually deletes — no more accidental wipes",
      "All Drinks tab opens as a flat scrollable list — faster to skim; the base-and-modifier builder lives behind a \"Build custom →\" link",
      "Presence avatars at the top of the order page now read \"Josh and 2 others deciding\" instead of a flat label",
      "Changelog is now titled \"What's brewing\" because honestly it fits the app better",
      "Touch targets on hearts, cart ± and X close buttons are bigger — still look the same, much easier to tap",
      "Error copy is kinder (\"Order didn't go through — check your connection\") instead of \"Something went wrong\"",
      "Place Order, Continue and other primary buttons use title case — less corporate, more us",
      "Cart bar gives a gentle pulse when an item is added, so the addition actually registers visually",
      "Keyboard users get a visible focus ring everywhere (without affecting mouse clicks)",
    ],
  },
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
