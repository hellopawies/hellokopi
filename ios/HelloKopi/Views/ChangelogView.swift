import SwiftUI

/// Release notes — "What's Brewing". Mirrors the web Changelog page; admin-
/// only changes are intentionally not listed (see ChangelogData.swift).
struct ChangelogView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 22) {
                    ForEach(CHANGELOG) { entry in
                        EntryView(entry: entry)
                    }
                }
                .padding(16)
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("What's Brewing")
        }
    }
}

private struct EntryView: View {
    let entry: ChangelogEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(entry.version)
                    .font(.appLabel)
                    .tracking(2)
                    .textCase(.uppercase)
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                Text(entry.date)
                    .font(.appLabel)
                    .tracking(1)
                    .foregroundStyle(Theme.textMuted)
            }
            Text(entry.title)
                .font(.appSerif(size: 20, weight: .light))
                .foregroundStyle(Theme.textPrimary)
            VStack(alignment: .leading, spacing: 6) {
                ForEach(entry.changes, id: \.self) { change in
                    HStack(alignment: .top, spacing: 8) {
                        Text("·")
                            .font(.appSans(size: 14))
                            .foregroundStyle(Theme.textMuted)
                        Text(change)
                            .font(.appSans(size: 14))
                            .foregroundStyle(Theme.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.border, lineWidth: 1))
    }
}
