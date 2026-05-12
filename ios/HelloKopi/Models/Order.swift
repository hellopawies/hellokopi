import Foundation

/// Single drink line as stored inside an order row's JSON `items` array.
struct OrderItem: Codable, Hashable, Identifiable {
    var id: String { name }
    let name: String
    let description: String
}

/// One Supabase `orders` row. Mirrors `src/types/order.ts`. Use `createdAt`
/// (a real Date) for any sorting or session-bucketing — `createdAtRaw` stays
/// for round-tripping back to Supabase.
struct Order: Identifiable, Codable, Hashable {
    let id: String
    let orderRef: String
    let personName: String
    let items: [OrderItem]
    let notes: String?
    let createdAtRaw: String

    enum CodingKeys: String, CodingKey {
        case id
        case orderRef = "order_ref"
        case personName = "person_name"
        case items
        case notes
        case createdAtRaw = "created_at"
    }

    /// Parsed timestamp. Supabase emits ISO-8601 with fractional seconds.
    var createdAt: Date {
        Order.iso.date(from: createdAtRaw)
            ?? Order.isoNoFraction.date(from: createdAtRaw)
            ?? .distantPast
    }

    private static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoNoFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()
}

/// A run of orders within the session window (10 min from the first order).
struct OrderSession: Identifiable, Hashable {
    var id: Date { sessionStart }
    let sessionStart: Date
    let orders: [Order]
}

/// Sessions grouped by day for the /orders list.
struct OrderDateGroup: Identifiable, Hashable {
    var id: String { dateKey }
    let dateKey: String
    let dateLabel: String
    let sessions: [OrderSession]
}
