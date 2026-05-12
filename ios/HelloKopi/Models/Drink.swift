import Foundation

/// A single menu drink — name shown to the user + short description below it.
struct Drink: Identifiable, Hashable, Codable {
    var id: String { name }
    let name: String
    let description: String
}

/// Drink grouping shown as tabs on the All Drinks list (Kopi / Teh / Milo…).
struct DrinkCategory: Identifiable, Hashable {
    let id: String
    let label: String
    let drinks: [Drink]
}
