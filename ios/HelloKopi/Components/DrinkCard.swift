import SwiftUI

/// Drink tile shown in the All Drinks grid and My Picks. Heart toggles the
/// favourite state; the body adds one cup to the cart. Long composed names
/// wrap to two lines instead of truncating.
struct DrinkCard: View {
    let drink: Drink
    let isFavourite: Bool
    var quantityInCart: Int = 0
    var onAdd: () -> Void
    var onToggleFavourite: () -> Void

    @EnvironmentObject var lang: LanguageStore

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                TempIcon(temp: drinkTemp(drink.name), size: 11)
                    .frame(maxHeight: .infinity, alignment: .center)
                Text(displayDrinkName(drink.name, lang: lang.lang))
                    .font(.appSerif(size: 17, weight: .regular))
                    .foregroundStyle(Theme.textPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 4)
                Button(action: onToggleFavourite) {
                    Image(systemName: isFavourite ? "heart.fill" : "heart")
                        .font(.system(size: 16))
                        .foregroundStyle(isFavourite ? Theme.Drink.kopi : Theme.textMuted)
                        .padding(6)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(isFavourite ? "Remove from My Picks" : "Save to My Picks")
            }
            Text(drink.description)
                .font(.appSans(size: 12))
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
            HStack {
                if quantityInCart > 0 {
                    Text("× \(quantityInCart)")
                        .font(.appLabel)
                        .tracking(1.5)
                        .foregroundStyle(Theme.textSecondary)
                }
                Spacer()
                Button(action: onAdd) {
                    Text("Add")
                        .font(.appLabel)
                        .tracking(2)
                        .textCase(.uppercase)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .foregroundStyle(Theme.surface)
                        .background(Capsule().fill(Theme.textPrimary))
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Add \(displayDrinkName(drink.name, lang: lang.lang)) to cart")
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 140, alignment: .topLeading)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
    }
}
