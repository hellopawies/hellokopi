import SwiftUI

/// Greeting page — pick your name from the member chip grid (or type one as
/// "Other"). Once picked, store in @AppStorage and we transition into the
/// main tabs.
struct GreetingView: View {
    var onPick: (String) -> Void

    @EnvironmentObject var supabase: SupabaseService
    @EnvironmentObject var lang: LanguageStore

    @State private var customName: String = ""
    @State private var showingOtherField: Bool = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Hello Kopi")
                        .font(.appSerif(size: 36, weight: .light))
                        .foregroundStyle(Theme.textPrimary)
                    Text(greeting())
                        .font(.appSans(size: 15))
                        .foregroundStyle(Theme.textSecondary)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Who's ordering?")
                        .font(.appLabel)
                        .tracking(2)
                        .textCase(.uppercase)
                        .foregroundStyle(Theme.textSecondary)

                    if supabase.members.isEmpty {
                        BrewingCup()
                    } else {
                        FlowLayout(spacing: 8) {
                            ForEach(supabase.members) { member in
                                DrinkChip(label: member.name, isSelected: false) {
                                    if let preferred = member.defaultLang {
                                        lang.lang = preferred
                                    }
                                    onPick(member.name)
                                }
                            }
                            DrinkChip(label: "Other", isSelected: showingOtherField) {
                                showingOtherField.toggle()
                            }
                        }

                        if showingOtherField {
                            HStack {
                                TextField("Your name", text: $customName)
                                    .textFieldStyle(.roundedBorder)
                                Button("Continue") {
                                    let trimmed = customName.trimmingCharacters(in: .whitespaces)
                                    guard !trimmed.isEmpty else { return }
                                    onPick(trimmed)
                                }
                                .buttonStyle(.borderedProminent)
                                .disabled(customName.trimmingCharacters(in: .whitespaces).isEmpty)
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
        .background(Theme.background.ignoresSafeArea())
    }

    private func greeting() -> String {
        let h = Calendar(identifier: .gregorian)
            .component(.hour, from: Date())
        switch h {
        case 5..<11: return "Morning kopi run?"
        case 11..<14: return "Lunch-time pick-me-up?"
        case 14..<17: return "Afternoon kopi run?"
        case 17..<21: return "Evening kopi run?"
        default: return "Late-night brew?"
        }
    }
}

/// Lightweight flow layout — wraps chips onto subsequent rows when the row
/// runs out of width. SwiftUI doesn't ship one until iOS 16's `Layout` proto,
/// which we're already targeting.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
