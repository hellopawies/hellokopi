import Foundation
import SwiftUI

/// In-progress cart. Persists between launches (24-hour TTL) so a yanked-into-
/// a-meeting user can come back and finish their order. Mirrors the web's
/// `localStorage`-backed cart draft.
@MainActor
final class CartStore: ObservableObject {
    private static let storageKey = "hellokopi_cart_draft"
    private static let ttl: TimeInterval = 24 * 60 * 60

    @Published var items: [CartItem] = [] {
        didSet { persist() }
    }

    init() {
        loadPersisted()
    }

    var totalCups: Int { items.reduce(0) { $0 + $1.quantity } }

    func add(_ drink: Drink) {
        if let idx = items.firstIndex(where: { $0.drink.name == drink.name }) {
            items[idx].quantity += 1
        } else {
            items.append(CartItem(drink: drink, quantity: 1))
        }
    }

    func decrement(_ drink: Drink) {
        guard let idx = items.firstIndex(where: { $0.drink.name == drink.name }) else { return }
        items[idx].quantity -= 1
        if items[idx].quantity <= 0 {
            items.remove(at: idx)
        }
    }

    func remove(_ drink: Drink) {
        items.removeAll { $0.drink.name == drink.name }
    }

    func clear() {
        items = []
    }

    // MARK: - Persistence

    private struct Persisted: Codable {
        let savedAt: Date
        let items: [CartItem]
    }

    private func persist() {
        let payload = Persisted(savedAt: Date(), items: items)
        if let data = try? JSONEncoder().encode(payload) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }

    private func loadPersisted() {
        guard
            let data = UserDefaults.standard.data(forKey: Self.storageKey),
            let payload = try? JSONDecoder().decode(Persisted.self, from: data)
        else { return }
        if Date().timeIntervalSince(payload.savedAt) > Self.ttl {
            UserDefaults.standard.removeObject(forKey: Self.storageKey)
            return
        }
        self.items = payload.items
    }
}
