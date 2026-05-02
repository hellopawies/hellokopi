// Shared app-wide constants. Single source of truth — don't redefine these inline.

/** A coffee-run session window. Orders within this window stack into one session. */
export const SESSION_MS = 10 * 60 * 1000;

/** App's home timezone — all user-facing times render in SGT regardless of device. */
export const TIMEZONE_SG = "Asia/Singapore";
