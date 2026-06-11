import SwiftUI

/// Read-only "check the orders" screen. Day-grouped, session-grouped,
/// newest first. Each session shows the time range + hot/iced count.
struct OrdersView: View {
    @EnvironmentObject var supabase: SupabaseService
    @EnvironmentObject var lang: LanguageStore

    @State private var struckOff: Set<String> = []

    var body: some View {
        NavigationStack {
            ScrollView {
                if supabase.isLoadingOrders && supabase.orders.isEmpty {
                    BrewingCup().padding(.top, 80)
                } else if supabase.orders.isEmpty {
                    Text("No orders yet today.")
                        .font(.appSans(size: 14))
                        .foregroundStyle(Theme.textSecondary)
                        .padding(.top, 60)
                } else {
                    LazyVStack(alignment: .leading, spacing: 22) {
                        ForEach(groupOrders(supabase.orders)) { group in
                            DayBlock(group: group, struckOff: $struckOff)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 18)
                }
            }
            .background(Theme.background.ignoresSafeArea())
            .navigationTitle("Orders")
            .refreshable { await supabase.loadOrders() }
            .task { await supabase.loadOrders() }
        }
    }
}

private struct DayBlock: View {
    let group: OrderDateGroup
    @Binding var struckOff: Set<String>

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(group.dateLabel)
                .font(.appLabel)
                .tracking(2)
                .textCase(.uppercase)
                .foregroundStyle(Theme.textSecondary)
            ForEach(group.sessions) { session in
                SessionBlock(session: session, struckOff: $struckOff)
            }
        }
    }
}

private struct SessionBlock: View {
    @EnvironmentObject var lang: LanguageStore
    let session: OrderSession
    @Binding var struckOff: Set<String>

    var body: some View {
        let lines = session.orders.flatMap { o in o.items.map { ($0, o.personName, "\(o.id)-\($0.name)") } }
        let hotCount = lines.filter { drinkTemp($0.0.name) == .hot }.count
        let icedCount = lines.filter { drinkTemp($0.0.name) == .iced }.count

        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text("\(formatTime(session.sessionStart)) – \(formatTime(session.orders.last?.createdAt ?? session.sessionStart))")
                    .font(.appSerif(size: 17))
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                Text("\(lines.count) cups")
                    .font(.appLabel)
                    .tracking(1)
                    .foregroundStyle(Theme.textSecondary)
                if hotCount > 0 {
                    HStack(spacing: 2) {
                        Image(systemName: "flame").foregroundStyle(Theme.hot)
                        Text("\(hotCount)").foregroundStyle(Theme.hot)
                    }.font(.appLabel)
                }
                if icedCount > 0 {
                    HStack(spacing: 2) {
                        Image(systemName: "snowflake").foregroundStyle(Theme.iced)
                        Text("\(icedCount)").foregroundStyle(Theme.iced)
                    }.font(.appLabel)
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                ForEach(lines, id: \.2) { line in
                    let (item, person, key) = line
                    let off = struckOff.contains(key)
                    Button {
                        if off { struckOff.remove(key) } else { struckOff.insert(key) }
                    } label: {
                        HStack(spacing: 8) {
                            DrinkColorDot(drinkName: item.name)
                            TempIcon(temp: drinkTemp(item.name), size: 10)
                            Text(displayDrinkName(item.name, lang: lang.lang))
                                .font(.appSans(size: 14))
                                .strikethrough(off, color: Theme.textMuted)
                                .foregroundStyle(off ? Theme.textMuted : Theme.textPrimary)
                            Spacer()
                            Text(person)
                                .font(.appLabel)
                                .tracking(1)
                                .foregroundStyle(Theme.textSecondary)
                        }
                        .padding(.vertical, 4)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
    }
}
