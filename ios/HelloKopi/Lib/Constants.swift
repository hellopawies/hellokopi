import Foundation

/// App-wide constants. Single source of truth — matches `src/lib/constants.ts`.
enum AppConstants {
    /// A coffee-run session window. Orders within this window stack into one session.
    static let sessionInterval: TimeInterval = 10 * 60 // 10 minutes

    /// App's home timezone — all user-facing times render in SGT regardless of device.
    static let timezoneSG = TimeZone(identifier: "Asia/Singapore")!
}

/// Render a Date in SGT as "2:21 PM" — 12-hour with AM/PM. Matches the web
/// `formatTime` helper exactly so iOS / web reads identically.
func formatTime(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US")
    f.timeZone = AppConstants.timezoneSG
    f.dateFormat = "h:mm a"
    return f.string(from: date)
}

/// "Monday, 28 Apr 2026"-style date label for the orders list header.
func formatDateLabel(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_GB")
    f.timeZone = AppConstants.timezoneSG
    f.dateFormat = "EEEE, d MMM yyyy"
    return f.string(from: date)
}

/// "YYYY-MM-DD" in SGT — used as the date bucket key for grouping orders.
func dateKey(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_CA")
    f.timeZone = AppConstants.timezoneSG
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
}
