import SwiftUI

/// The drink-picking screen. Two tabs: My Picks (saved favourites + last
/// order shortcut) and All Drinks (full menu by category). Cart bar sticks
/// to the bottom and turns into Place Order when there's something in it.
struct OrderView: View {
    @Binding var userName: String

    @EnvironmentObject var supabase: SupabaseService
    @EnvironmentObject var cart: CartStore
    @EnvironmentObject var lang: LanguageStore

    @AppStorage("hellokopi_favourites") private var favouritesJSON: String = "[]"
    @State private var selectedTab: Tab = .myPicks
    @State private var selectedCategoryId: String = DRINK_CATEGORIES.first?.id ?? "kopi"
    @State private var searchText: String = ""
    @State private var placedToast: String? = nil

    enum Tab: String, CaseIterable, Identifiable {
        case myPicks = "My Picks"
        case allDrinks = "All Drinks"
        var id: String { rawValue }
    }

    private var favourites: Set<String> {
        guard let data = favouritesJSON.data(using: .utf8),
              let arr = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return Set(arr)
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            tabPicker

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    switch selectedTab {
                    case .myPicks: myPicksSection
                    case .allDrinks: allDrinksSection
                    }
                }
                .padding(.horizontal, 14)
                .padding(.top, 12)
                .padding(.bottom, 240) // room for cart bar
            }

            CartBar(onPlaceOrder: placeOrder)
        }
        .background(Theme.background.ignoresSafeArea())
        .overlay(alignment: .top) {
            if let toast = placedToast {
                ToastView(message: toast)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .padding(.top, 8)
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Hi, \(userName)")
                    .font(.appSerif(size: 24, weight: .light))
                    .foregroundStyle(Theme.textPrimary)
                Text("What's your kopi today?")
                    .font(.appSans(size: 13))
                    .foregroundStyle(Theme.textSecondary)
            }
            Spacer()
            Button("Not you?") {
                userName = ""
                cart.clear()
            }
            .font(.appLabel)
            .foregroundStyle(Theme.textSecondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Theme.surface)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Theme.border).frame(height: 0.5)
        }
    }

    private var tabPicker: some View {
        HStack(spacing: 8) {
            ForEach(Tab.allCases) { tab in
                DrinkChip(label: tab.rawValue, isSelected: selectedTab == tab) {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                        selectedTab = tab
                    }
                }
            }
            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    // MARK: - My Picks

    @ViewBuilder
    private var myPicksSection: some View {
        let saved = drinksMatchingFavourites()
        if let last = lastOrder() {
            LastOrderCard(order: last) {
                for item in last.items {
                    if let d = DRINK_INDEX[item.name] {
                        cart.add(d)
                    } else {
                        cart.add(Drink(name: item.name, description: item.description))
                    }
                }
            }
        }
        if saved.isEmpty {
            Text("Tap the heart on any drink to save it here.")
                .font(.appSans(size: 14))
                .foregroundStyle(Theme.textSecondary)
                .padding(.vertical, 12)
        } else {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(saved) { drink in
                    DrinkCard(
                        drink: drink,
                        isFavourite: true,
                        quantityInCart: cart.items.first(where: { $0.drink.name == drink.name })?.quantity ?? 0,
                        onAdd: { cart.add(drink) },
                        onToggleFavourite: { toggleFavourite(drink.name) }
                    )
                }
            }
        }
    }

    // MARK: - All Drinks

    private var allDrinksSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Category picker
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(DRINK_CATEGORIES) { cat in
                        DrinkChip(label: cat.label, isSelected: selectedCategoryId == cat.id) {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                                selectedCategoryId = cat.id
                            }
                        }
                    }
                }
            }

            // Search
            HStack {
                Image(systemName: "magnifyingglass").foregroundStyle(Theme.textMuted)
                TextField("Search drinks…", text: $searchText)
                    .font(.appSans(size: 14))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 12).fill(Theme.surfaceMuted)
            )

            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(filteredDrinks()) { drink in
                    DrinkCard(
                        drink: drink,
                        isFavourite: favourites.contains(drink.name),
                        quantityInCart: cart.items.first(where: { $0.drink.name == drink.name })?.quantity ?? 0,
                        onAdd: { cart.add(drink) },
                        onToggleFavourite: { toggleFavourite(drink.name) }
                    )
                }
            }
        }
    }

    private func filteredDrinks() -> [Drink] {
        let pool = DRINK_CATEGORIES.first(where: { $0.id == selectedCategoryId })?.drinks ?? []
        let trimmed = searchText.trimmingCharacters(in: .whitespaces).lowercased()
        guard !trimmed.isEmpty else { return pool }
        return pool.filter { $0.name.lowercased().contains(trimmed) }
    }

    private func drinksMatchingFavourites() -> [Drink] {
        favourites.compactMap { DRINK_INDEX[$0] }
            .sorted { $0.name < $1.name }
    }

    private func lastOrder() -> Order? {
        supabase.orders.first(where: { $0.personName == userName })
    }

    // MARK: - Favourites + Order

    private func toggleFavourite(_ name: String) {
        var set = favourites
        if set.contains(name) { set.remove(name) } else { set.insert(name) }
        let arr = Array(set)
        if let data = try? JSONEncoder().encode(arr),
           let str = String(data: data, encoding: .utf8) {
            favouritesJSON = str
        }
    }

    private func placeOrder() {
        guard !cart.items.isEmpty else { return }
        let items: [OrderItem] = cart.items.flatMap { item in
            Array(repeating: OrderItem(name: item.drink.name, description: item.drink.description), count: item.quantity)
        }
        Task {
            do {
                let order = try await supabase.placeOrder(personName: userName, items: items)
                let nDrinks = items.count
                placedToast = "Order placed · \(order.orderRef) · \(nDrinks) \(nDrinks == 1 ? "drink" : "drinks")"
                cart.clear()
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                withAnimation { placedToast = nil }
            } catch {
                placedToast = "Order didn't go through — check your connection"
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                withAnimation { placedToast = nil }
            }
        }
    }
}

/// Tiny brief card at the top of My Picks showing the user's most recent
/// order with a one-tap re-order action.
private struct LastOrderCard: View {
    @EnvironmentObject var lang: LanguageStore
    let order: Order
    var onReorder: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Last order")
                    .font(.appLabel)
                    .tracking(2)
                    .textCase(.uppercase)
                    .foregroundStyle(Theme.textSecondary)
                Spacer()
                Button(action: onReorder) {
                    Text("Re-order")
                        .font(.appLabel)
                        .tracking(1.5)
                        .textCase(.uppercase)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Capsule().stroke(Theme.border, lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
            ForEach(Array(order.items.enumerated()), id: \.offset) { _, item in
                HStack(spacing: 8) {
                    DrinkColorDot(drinkName: item.name)
                    TempIcon(temp: drinkTemp(item.name), size: 10)
                    Text(displayDrinkName(item.name, lang: lang.lang))
                        .font(.appSans(size: 14))
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                }
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 12).fill(Theme.surface))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
    }
}

private struct ToastView: View {
    let message: String
    var body: some View {
        Text(message)
            .font(.appSans(size: 13, weight: .medium))
            .foregroundStyle(Theme.surface)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Capsule().fill(Theme.textPrimary))
            .shadow(color: .black.opacity(0.18), radius: 12, y: 4)
    }
}

/// Quick name -> Drink lookup for re-order matching against menu drinks.
private let DRINK_INDEX: [String: Drink] = {
    var dict: [String: Drink] = [:]
    for cat in DRINK_CATEGORIES {
        for d in cat.drinks { dict[d.name] = d }
    }
    for d in OTHERS_DRINKS { dict[d.name] = d }
    return dict
}()
