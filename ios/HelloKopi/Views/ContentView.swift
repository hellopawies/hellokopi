import SwiftUI

/// Root scene. Greeting until the user picks a name (cached in @AppStorage),
/// then a tab bar for Order / Orders / Changelog.
struct ContentView: View {
    @AppStorage("hellokopi_user_name") private var userName: String = ""
    @EnvironmentObject var supabase: SupabaseService
    @EnvironmentObject var lang: LanguageStore

    var body: some View {
        Group {
            if userName.isEmpty {
                GreetingView(onPick: { name in
                    userName = name
                })
            } else {
                MainTabs(userName: $userName)
            }
        }
        .task {
            await supabase.loadMembers()
            // Auto-apply this user's default language if their member row says so.
            if let m = supabase.members.first(where: { $0.name == userName }),
               let preferred = m.defaultLang {
                lang.lang = preferred
            }
        }
        .background(Theme.background.ignoresSafeArea())
    }
}

private struct MainTabs: View {
    @Binding var userName: String

    var body: some View {
        TabView {
            OrderView(userName: $userName)
                .tabItem {
                    Label("Order", systemImage: "cup.and.saucer")
                }
            OrdersView()
                .tabItem {
                    Label("Orders", systemImage: "list.bullet.rectangle")
                }
            ChangelogView()
                .tabItem {
                    Label("What's Brewing", systemImage: "sparkles")
                }
        }
    }
}
