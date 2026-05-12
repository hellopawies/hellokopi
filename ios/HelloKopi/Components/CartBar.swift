import SwiftUI

/// Sticky bar at the bottom of the order screen — list of drinks in the
/// cart with ± controls, and the Place Order button.
struct CartBar: View {
    @EnvironmentObject var cart: CartStore
    @EnvironmentObject var lang: LanguageStore
    var onPlaceOrder: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            if !cart.items.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(cart.items) { item in
                            HStack(spacing: 6) {
                                Text(displayDrinkName(item.drink.name, lang: lang.lang))
                                    .font(.appSans(size: 13, weight: .medium))
                                    .foregroundStyle(Theme.textPrimary)
                                Text("×\(item.quantity)")
                                    .font(.appLabel)
                                    .tracking(1)
                                    .foregroundStyle(Theme.textSecondary)
                                Button {
                                    cart.decrement(item.drink)
                                } label: {
                                    Image(systemName: "minus.circle.fill")
                                        .foregroundStyle(Theme.textMuted)
                                }
                                .buttonStyle(.plain)
                                Button {
                                    cart.add(item.drink)
                                } label: {
                                    Image(systemName: "plus.circle.fill")
                                        .foregroundStyle(Theme.textPrimary)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Capsule().fill(Theme.surfaceMuted))
                        }
                    }
                    .padding(.horizontal, 14)
                }
            }
            Button(action: onPlaceOrder) {
                HStack(spacing: 8) {
                    Text("Place Order")
                        .font(.appLabel)
                        .tracking(2.5)
                        .textCase(.uppercase)
                    Text("· \(cart.totalCups) \(cart.totalCups == 1 ? "drink" : "drinks")")
                        .font(.appLabel)
                        .tracking(1.5)
                        .opacity(0.75)
                }
                .foregroundStyle(Theme.surface)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(cart.items.isEmpty ? Theme.textMuted : Theme.textPrimary)
                )
            }
            .buttonStyle(.plain)
            .disabled(cart.items.isEmpty)
            .padding(.horizontal, 14)
            .padding(.bottom, 6)
        }
        .padding(.top, 10)
        .background(
            Rectangle()
                .fill(.thinMaterial)
                .overlay(Rectangle().fill(Theme.surface.opacity(0.6)))
                .ignoresSafeArea(edges: .bottom)
        )
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Theme.border)
                .frame(height: 0.5)
        }
    }
}
