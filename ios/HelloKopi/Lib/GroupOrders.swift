import Foundation

/// Group orders by date, then by session (any gap >= SESSION_MS opens a new
/// session). Returns newest date first, newest session first, newest order
/// first — ready to render straight into the /orders list.
///
/// Mirrors `src/lib/groupOrders.ts` so iOS and web render identically.
func groupOrders(_ orders: [Order]) -> [OrderDateGroup] {
    guard !orders.isEmpty else { return [] }

    // Sort ascending so sessions build chronologically
    let sorted = orders.sorted { $0.createdAt < $1.createdAt }

    // Bucket by SGT date key
    var byDate: [String: [Order]] = [:]
    var dateOrder: [String] = []
    for order in sorted {
        let key = dateKey(order.createdAt)
        if byDate[key] == nil {
            byDate[key] = []
            dateOrder.append(key)
        }
        byDate[key]?.append(order)
    }

    var groups: [OrderDateGroup] = []

    for key in dateOrder {
        guard let dayOrders = byDate[key] else { continue }

        var sessions: [(start: Date, orders: [Order])] = []
        for order in dayOrders {
            let t = order.createdAt
            if let last = sessions.last,
               t.timeIntervalSince(last.start) < AppConstants.sessionInterval {
                sessions[sessions.count - 1].orders.append(order)
            } else {
                sessions.append((start: order.createdAt, orders: [order]))
            }
        }

        // Flip to newest-first for display
        sessions.reverse()
        let flipped = sessions.map { OrderSession(sessionStart: $0.start, orders: $0.orders.reversed()) }

        // Reconstruct a Date for the label from "YYYY-MM-DD"
        let label: String
        if let d = parseDateKey(key) {
            label = formatDateLabel(d)
        } else {
            label = key
        }

        groups.append(OrderDateGroup(dateKey: key, dateLabel: label, sessions: flipped))
    }

    // Newest date first
    return groups.sorted { $0.dateKey > $1.dateKey }
}

/// "YYYY-MM-DD" -> midday SGT Date so weekday formatting is unambiguous.
private func parseDateKey(_ key: String) -> Date? {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = AppConstants.timezoneSG
    f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
    return f.date(from: key + "T12:00:00")
}
