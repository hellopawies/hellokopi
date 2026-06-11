import SwiftUI

/// Small coloured dot next to a drink name on /orders and the last-order
/// card. Decorative — the colour is a visual scan aid, not a data carrier,
/// so it's hidden from accessibility.
struct DrinkColorDot: View {
    let drinkName: String
    var size: CGFloat = 8

    var body: some View {
        Circle()
            .fill(drinkColor(drinkName))
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}
