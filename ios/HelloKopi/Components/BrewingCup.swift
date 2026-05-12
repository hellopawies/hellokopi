import SwiftUI

/// Loading indicator with a cycling verb — Brewing, Pulling, Steeping, …
/// Same set as the web `BrewingCup` so the vibe matches.
struct BrewingCup: View {
    @State private var verbIndex: Int = Int.random(in: 0..<5)
    @State private var bob: Bool = false

    private let verbs = ["Brewing", "Pulling", "Steeping", "Stirring", "Frothing"]

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "cup.and.saucer.fill")
                .font(.system(size: 36))
                .foregroundStyle(Theme.textSecondary)
                .offset(y: bob ? -2 : 2)
                .animation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true), value: bob)
            Text("\(verbs[verbIndex])…")
                .font(.appLabel)
                .tracking(2)
                .textCase(.uppercase)
                .foregroundStyle(Theme.textSecondary)
        }
        .padding(24)
        .onAppear {
            bob = true
            Task { @MainActor in
                while !Task.isCancelled {
                    try? await Task.sleep(nanoseconds: 1_800_000_000)
                    withAnimation(.easeInOut(duration: 0.35)) {
                        verbIndex = (verbIndex + 1) % verbs.count
                    }
                }
            }
        }
    }
}
