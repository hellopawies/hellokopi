import SwiftUI

/// Tracked-uppercase pill used for: base picker (Kopi / Teh / Milo…), name
/// chips on the greeting page, and modifier pills in the builder. Single
/// component keeps every chip on every screen visually consistent.
struct DrinkChip: View {
    let label: String
    let isSelected: Bool
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.appLabel)
                .tracking(2)
                .textCase(.uppercase)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .foregroundStyle(isSelected ? Theme.surface : Theme.textPrimary)
                .background(
                    Capsule()
                        .fill(isSelected ? Theme.textPrimary : Theme.surface)
                )
                .overlay(
                    Capsule()
                        .stroke(isSelected ? Theme.textPrimary : Theme.border, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
