import Foundation

/// Release notes shown on the Changelog screen. Mirrors `src/data/changelog.ts`
/// (admin-only changes are intentionally omitted from both files).
struct ChangelogEntry: Identifiable, Hashable {
    var id: String { version }
    let version: String
    let date: String
    let title: String
    let changes: [String]
}

let CHANGELOG: [ChangelogEntry] = [
    ChangelogEntry(version: "v3.5.9", date: "28 Apr 2026", title: "Continue button breathes", changes: [
        "The Continue button on the home page now has the same soft ambient pulse as Place Order — a faint halo every couple of seconds, inviting the tap. Returning users pulse on arrival; first-time pickers pulse once a name is chosen.",
        "Pulse colour now flips for dark mode (dark halo on cream, light halo on black) so it stays visible on OLED too.",
    ]),
    ChangelogEntry(version: "v3.5.8", date: "28 Apr 2026", title: "Check Orders link on the home page", changes: [
        "The Check Orders link now sits top-right on the greeting page too — peek at today's run without having to pick your name first.",
    ]),
    ChangelogEntry(version: "v3.5.7", date: "28 Apr 2026", title: "Sticky header feels elevated in dark mode", changes: [
        "On OLED dark mode the sticky header was indistinguishable from the content below it — shadows-into-pure-black are invisible. A 1px bright hairline now sits just under the header (the lit edge of a raised surface) so it reads as a layer above the scroll, matching the soft drop shadow in light mode.",
    ]),
    ChangelogEntry(version: "v3.5.6", date: "28 Apr 2026", title: "Removed Old Tea Hut redirect", changes: [
        "The \"Looking for something else? · Order direct from Old Tea Hut →\" link at the foot of All Drinks is gone. The team uses the in-app order flow for everything now.",
    ]),
    ChangelogEntry(version: "v3.5.5", date: "28 Apr 2026", title: "AM/PM times + hide trivial fill stat", changes: [
        "Session times now show in 12-hour AM/PM format — \"2:21 PM – 2:31 PM\" instead of \"14:21 – 14:31\". Applied everywhere a session time appears: orders list, WhatsApp share, and the post-order confirmation toast.",
        "The \"Filled in 0s · 1 person\" line is hidden when a single person ordered without measurable fill time — the stat has no useful info to convey there. Multi-person sessions and longer fills still show as before.",
    ]),
    ChangelogEntry(version: "v3.5.4", date: "28 Apr 2026", title: "Surprise Me respects your language", changes: [
        "Both the spinning roulette names and the final landed drink in the Surprise Me roller now show up in your language — \"Iced Kopi C, less sweet\" in EN, \"Kopi C Siew Dai Peng\" in SIN. Was showing raw names regardless of mode.",
    ]),
    ChangelogEntry(version: "v3.5.3", date: "28 Apr 2026", title: "Long composed drink names wrap gracefully", changes: [
        "Builder preview no longer cuts off long names mid-word (\"Horlicks C Gao Siew Dai Pe…\"). Names wrap to a second line if needed, with a smaller serif size on mobile to give them room. Heart and Add stay perfectly aligned.",
    ]),
    ChangelogEntry(version: "v3.5.2", date: "28 Apr 2026", title: "Flame icon for hot drinks", changes: [
        "Removed the EN / SIN toggle from the header — your language is set per user and re-applied on every /order visit, so no manual flipping needed.",
        "Hot drinks now show a small flame outline instead of three steam wisps. Iced stays as the snowflake. Same red / blue colour pairing for accessibility.",
    ]),
    ChangelogEntry(version: "v3.5.1", date: "28 Apr 2026", title: "Per-user language defaults", changes: [
        "Each name has its own default language (EN or SIN). When you pick your name, the app jumps to whichever fits you — no manual toggle needed each visit.",
    ]),
    ChangelogEntry(version: "v3.5.0", date: "28 Apr 2026", title: "EN / SIN language toggle", changes: [
        "New EN / SIN toggle in the top-left next to the home icon. EN mode shows drink names in English (Iced Kopi, Kopi C, less sweet, Kopi, extra thick) and the modifier pills follow suit (Iced, Less sweet, Extra thick…). SIN mode keeps the kopitiam terms exactly as they are (Kopi Peng, Siew Dai, Gah Dai, Kosong, Gao).",
        "Your choice is remembered on the device — pick once, every screen, every visit. Defaults to EN.",
        "Translation covers names everywhere they appear: drink cards, cart, last order card, /orders rows, the live ticker, and the WhatsApp share text.",
    ]),
]
