// Current shipped version — surfaced as a small label in the home page
// footer. The public changelog page has been removed; this single value is
// all that's user-visible. Bump the string on each release.
//
// Versions that have shipped but were intentionally not exposed to users:
//   v3.5.11 — internal polish pass (bento width, hero affordance, skeleton
//             dwell, page-in tightening, /orders empty state, reduced motion).
//             Version number burned so the next user-visible release is
//             v3.5.12.

export const VERSIONS = [
  { version: "v3.7.0" },
] as const;
