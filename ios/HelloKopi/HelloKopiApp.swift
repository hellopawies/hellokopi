import SwiftUI

@main
struct HelloKopiApp: App {
    @StateObject private var lang = LanguageStore()
    @StateObject private var supabase = SupabaseService()
    @StateObject private var cart = CartStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(lang)
                .environmentObject(supabase)
                .environmentObject(cart)
                .preferredColorScheme(nil) // follow system
        }
    }
}
