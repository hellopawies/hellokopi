# Hello Kopi — iOS

SwiftUI port of the web app for the user-facing flow: name selector → drink builder → orders list → changelog. Admin stays on the web (it's the simpler tooling surface for that).

## Stack

- **SwiftUI** (iOS 16+) — declarative UI, mirrors the React component model.
- **supabase-swift** — official Swift SDK for Postgres.
- **@AppStorage** / `UserDefaults` — drop-in replacement for the web's `localStorage` (name, lang, favourites, cart draft).
- **SF Pro / system serif** — system equivalents of Inter / Cormorant Garamond. No web-font loading.
- **Dynamic UIColor providers** — palette flips with system dark mode without any Asset Catalog entries.

## Setup

1. Open Xcode → **File → New → Project → iOS → App**. Name it `HelloKopi`, organisation identifier `com.yourorg.hellokopi`, language **Swift**, interface **SwiftUI**, leave tests unchecked. Minimum deployment iOS 16.0.
2. Delete the default `ContentView.swift` Xcode generates (we ship our own).
3. Drag the entire `HelloKopi/` folder from this repo into the Xcode project navigator. When prompted, choose **Copy items if needed** and **Create groups**.
4. Add the Supabase SDK via SPM:
   - **File → Add Package Dependencies…** → paste `https://github.com/supabase/supabase-swift` → pick the latest release → add the **Supabase** product to the `HelloKopi` target.
5. Open `Config.swift` and paste in your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values (same project as the web app — order/member data is shared).
6. Build & run on a simulator or device (iOS 16+).

## What's here

| File | Purpose |
|---|---|
| `HelloKopiApp.swift` | App entry, environment objects (`LanguageStore`, `SupabaseService`, `CartStore`) |
| `Config.swift` | Supabase URL + anon key constants |
| `Theme.swift` | Cream / stone palette via dynamic `UIColor` providers; serif/sans font helpers |
| `Models/` | `Lang`, `Drink`, `CartItem`, `Member`, `Order` + `OrderSession` + `OrderDateGroup` |
| `Lib/Constants.swift` | `SESSION_MS`, SGT timezone, `formatTime()`, `dateKey()` helpers |
| `Lib/DrinkName.swift` | `displayDrinkName`, `translateModifier`, `drinkTemp` — Swift port of the TS helpers |
| `Lib/DrinkColor.swift` | `drinkColor(name)` — visual-scan colour swatch |
| `Lib/GroupOrders.swift` | Date + session bucketing for /orders |
| `Lib/OrderRef.swift` | "KP-XXXX" reference generator |
| `Data/DrinkData.swift` | Full menu by category (Kopi / Teh / Milo…) |
| `Data/MenuData.swift` | `DRINK_BASES` for the builder + `OTHERS_DRINKS` |
| `Data/ChangelogData.swift` | Release notes (mirrors `src/data/changelog.ts`) |
| `Services/SupabaseService.swift` | Members + orders fetches, place order, cancel order |
| `Services/LanguageStore.swift` | Persisted EN/SIN preference |
| `Services/CartStore.swift` | In-progress cart with 24-hour TTL persistence |
| `Components/TempIcon.swift` | Snowflake / flame glyph for iced / hot |
| `Components/BrewingCup.swift` | Loading indicator with cycling verb |
| `Components/DrinkChip.swift` | Tracked-uppercase pill (base picker, name chips, modifiers) |
| `Components/DrinkCard.swift` | Drink tile with heart, description, and Add button |
| `Components/DrinkColorDot.swift` | Decorative coloured dot beside a drink name |
| `Components/CartBar.swift` | Sticky bottom cart with ± controls + Place Order |
| `Views/ContentView.swift` | Root scene + tab bar |
| `Views/GreetingView.swift` | Name-picker chip grid + "Other" inline input |
| `Views/OrderView.swift` | My Picks + All Drinks builder + last-order card + cart bar |
| `Views/OrdersView.swift` | Sessions grouped by day, hot/iced counts, tick-off-as-you-tell-the-cashier |
| `Views/ChangelogView.swift` | What's Brewing release notes |

## What's not ported

- **Admin** (`/admin`) — internal-only tool, stays on the web.
- **Custom kopi-cup pull-to-refresh** — replaced with SwiftUI's built-in `.refreshable {}`.
- **Service worker / PWA install prompt** — N/A on a native app.
- **Realtime presence avatars + live ticker** — left out of the starter; the orders screen still refreshes on pull.
- **WhatsApp share sheet** — easy follow-up via `UIActivityViewController`.

## Notes on parity

- **Hot/iced detection** stays a string match on raw drink names so it stays in sync with the web logic.
- **`displayDrinkName`** in `Lib/DrinkName.swift` is a faithful Swift translation of the TS helper — same regex behaviour for *Peng* stripping and qualifier extraction.
- **Cart auto-save** uses `UserDefaults` with the same 24-hour TTL.
- **Per-user default language** is read off the `members.default_lang` column and applied when the user picks their name on the greeting page.

## Future work (in priority order)

1. Realtime presence avatars + live "just-ordered" ticker on the Orders view (use `RealtimeV2` from supabase-swift).
2. WhatsApp share text via `UIActivityViewController`.
3. Drink-builder UI (modifier pills for Milk / Strength / Sweetness / Temp + specials), so the All Drinks tab matches the web's Build Custom pane.
4. Admin tab — only if needed; otherwise keep on the web.
5. Widgets — a small home-screen widget showing today's run.
6. App Clip — *"scan this QR at the kopitiam, place your order instantly"*.
