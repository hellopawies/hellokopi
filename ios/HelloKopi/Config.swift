import Foundation

/// Supabase project credentials. Same project as the web app so data is shared.
/// Both values are public (the anon key is meant to be exposed); the security
/// model lives in row-level-security policies on the database.
enum Config {
    static let supabaseURL = URL(string: "https://YOUR-PROJECT.supabase.co")!
    static let supabaseAnonKey = "YOUR-ANON-KEY"
}
