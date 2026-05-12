// Shared app-wide constants. Single source of truth — don't redefine these inline.

/** A coffee-run session window. Orders within this window stack into one session. */
export const SESSION_MS = 10 * 60 * 1000;

/** App's home timezone — all user-facing times render in SGT regardless of device. */
export const TIMEZONE_SG = "Asia/Singapore";

/**
 * Render a Date in SGT as "2:21 PM" — 12-hour with AM/PM. Used everywhere a
 * session start/end time is displayed (orders list, admin, WhatsApp share,
 * confirmation toast).
 */
export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE_SG,
  });
}
