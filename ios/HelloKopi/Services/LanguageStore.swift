import Foundation
import SwiftUI

/// Persists the user's chosen language across launches. Mirrors the web's
/// `LanguageProvider` (which uses `localStorage`). Use `@EnvironmentObject` in
/// any view that renders drink names.
@MainActor
final class LanguageStore: ObservableObject {
    private static let storageKey = "hellokopi_lang"

    @Published var lang: Lang {
        didSet {
            UserDefaults.standard.set(lang.rawValue, forKey: Self.storageKey)
        }
    }

    init() {
        let stored = UserDefaults.standard.string(forKey: Self.storageKey)
        self.lang = (stored == Lang.sin.rawValue) ? .sin : .en
    }

    func toggle() {
        lang = (lang == .en) ? .sin : .en
    }
}
