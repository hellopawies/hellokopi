import Foundation

/// A special-case drink (Tarik, Dinosaur, Godzilla…) that doesn't follow the
/// regular milk/strength/sweetness/temp modifier pattern.
struct DrinkSpecial: Hashable, Identifiable {
    var id: String { label }
    let label: String
    /// If set, replaces the composed name entirely (used by Neslo).
    let fullName: String?

    init(label: String, fullName: String? = nil) {
        self.label = label
        self.fullName = fullName
    }
}

/// A base drink configuration for the builder — Kopi, Teh, Milo, etc. Each
/// base declares which modifier axes apply to it.
struct DrinkBase: Identifiable, Hashable {
    let id: String
    let label: String
    let milk: [String]
    let strength: [String]
    let sweetness: [String]
    let temp: [String]
    let specials: [DrinkSpecial]
}

/// Bases shown in the Build Custom panel of All Drinks. Translated from
/// `src/data/menu.ts` — edit alongside the web file.
let DRINK_BASES: [DrinkBase] = [
    DrinkBase(
        id: "kopi", label: "Kopi",
        milk: ["O", "C"],
        strength: ["Gao", "Po", "Di Lo"],
        sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
        temp: ["Peng", "Pua Sio"],
        specials: [DrinkSpecial(label: "Tarik")]
    ),
    DrinkBase(
        id: "teh", label: "Teh",
        milk: ["O", "C"],
        strength: ["Gao", "Po"],
        sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
        temp: ["Peng", "Pua Sio"],
        specials: [DrinkSpecial(label: "Tarik")]
    ),
    DrinkBase(
        id: "teh-halia", label: "Teh Halia",
        milk: ["O", "C"],
        strength: ["Gao"],
        sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
        temp: ["Peng"],
        specials: [DrinkSpecial(label: "Tarik")]
    ),
    DrinkBase(
        id: "yuan-yang", label: "Yuan Yang",
        milk: ["O", "C"],
        strength: ["Gao"],
        sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
        temp: ["Peng"],
        specials: []
    ),
    DrinkBase(
        id: "milo", label: "Milo",
        milk: ["C"],
        strength: ["Gao"],
        sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
        temp: ["Peng"],
        specials: [
            DrinkSpecial(label: "Dinosaur"),
            DrinkSpecial(label: "Godzilla"),
            DrinkSpecial(label: "Cino"),
            DrinkSpecial(label: "Neslo", fullName: "Neslo"),
            DrinkSpecial(label: "Neslo Peng", fullName: "Neslo Peng"),
        ]
    ),
    DrinkBase(
        id: "horlicks", label: "Horlicks",
        milk: ["C"],
        strength: ["Gao"],
        sweetness: ["Siew Dai", "Kosong"],
        temp: ["Peng"],
        specials: []
    ),
]

/// Standalone Others drinks shown alongside the base builder.
let OTHERS_DRINKS: [Drink] = [
    Drink(name: "Bandung Peng", description: "Iced rose syrup milk"),
    Drink(name: "Michael Jackson", description: "Soya milk + black grass jelly"),
    Drink(name: "Tiao He", description: "Chinese tea, teabag-style"),
    Drink(name: "Barley", description: "Homemade barley drink (hot)"),
    Drink(name: "Barley Peng", description: "Iced barley"),
    Drink(name: "Soya Cincau", description: "Soya milk + grass jelly"),
    Drink(name: "Lime Juice", description: "Fresh lime juice"),
    Drink(name: "Sng Bao", description: "Frozen drink in plastic bag"),
]
