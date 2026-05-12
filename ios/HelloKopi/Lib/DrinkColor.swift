import SwiftUI

/// Colour marker keyed off a drink-name prefix. Used for visual scanning on
/// the orders list and the last-order card. Mirrors `src/lib/drinkColor.ts`.
func drinkColor(_ name: String) -> Color {
    let n = name.lowercased()
    if n.hasPrefix("yuan yang") { return Theme.Drink.yuanYang }
    if n.hasPrefix("teh halia") { return Theme.Drink.tehHalia }
    if n.hasPrefix("kopi")      { return Theme.Drink.kopi }
    if n.hasPrefix("teh")       { return Theme.Drink.teh }
    if n.hasPrefix("milo")      { return Theme.Drink.milo }
    if n.hasPrefix("horlicks")  { return Theme.Drink.horlicks }
    if n.hasPrefix("bandung")   { return Theme.Drink.bandung }
    return Theme.Drink.other
}
