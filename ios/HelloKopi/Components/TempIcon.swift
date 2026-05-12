import SwiftUI

/// Tiny hot/iced indicator next to drink names. Snowflake for iced (blue),
/// flame for hot (red). Mirrors the web `TempIcon` — same accessibility role
/// of doubling up the colour signal as a glyph.
struct TempIcon: View {
    let temp: DrinkTemp?
    var size: CGFloat = 12

    var body: some View {
        Group {
            switch temp {
            case .iced:
                Image(systemName: "snowflake")
                    .foregroundStyle(Theme.iced)
                    .accessibilityLabel("Iced")
            case .hot:
                Image(systemName: "flame")
                    .foregroundStyle(Theme.hot)
                    .accessibilityLabel("Hot")
            case .none:
                EmptyView()
            }
        }
        .font(.system(size: size, weight: .regular))
    }
}

#Preview {
    HStack(spacing: 12) {
        TempIcon(temp: .hot)
        TempIcon(temp: .iced)
        TempIcon(temp: nil)
    }
    .padding()
}
