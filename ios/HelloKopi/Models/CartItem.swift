import Foundation

/// A drink line in the in-progress cart. Quantity is tracked at the line so
/// the cart bar can show "Kopi Peng × 2" and `-` / `+` controls.
struct CartItem: Identifiable, Hashable, Codable {
    var id: String { drink.name }
    let drink: Drink
    var quantity: Int
}
