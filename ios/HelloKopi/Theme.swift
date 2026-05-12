import SwiftUI
import UIKit

/// Cream + stone palette matching the web app. Colours flip with system
/// appearance via `UIColor.dynamicProvider` so we don't need any asset
/// catalog entries — the project builds and runs straight out of Xcode.
enum Theme {
    // App shell
    static let background = dyn(light: 0xFAFAF8, dark: 0x000000)        // cream / pure black (OLED)
    static let surface    = dyn(light: 0xFFFFFF, dark: 0x111111)        // card surface
    static let surfaceMuted = dyn(light: 0xF5F5F4, dark: 0x1C1917)      // chip / input bg

    // Text — stone scale
    static let textPrimary   = dyn(light: 0x1C1917, dark: 0xF5F5F4)     // stone-900 / stone-100
    static let textSecondary = dyn(light: 0x78716C, dark: 0xA8A29E)     // stone-500 / stone-400
    static let textMuted     = dyn(light: 0xA8A29E, dark: 0x78716C)     // stone-400 / stone-500
    static let textFaint     = dyn(light: 0xD6D3D1, dark: 0x57534E)     // stone-300 / stone-600

    // Borders
    static let border      = dyn(light: 0xE7E5E4, dark: 0x44403C)       // stone-200 / stone-700
    static let borderFaint = dyn(light: 0xF5F5F4, dark: 0x292524)       // stone-100 / stone-800

    // Hot / iced accents (don't flip — they encode the temperature itself)
    static let hot  = Color(red: 0.937, green: 0.267, blue: 0.267) // red-500
    static let iced = Color(red: 0.388, green: 0.647, blue: 0.929) // blue-400

    // Drink-base swatches — mirrors src/lib/drinkColor.ts hex values exactly.
    enum Drink {
        static let kopi      = Color(red: 0.435, green: 0.306, blue: 0.216) // #6f4e37
        static let teh       = Color(red: 0.659, green: 0.420, blue: 0.227) // #a86b3a
        static let tehHalia  = Color(red: 0.690, green: 0.384, blue: 0.157) // #b06228
        static let yuanYang  = Color(red: 0.478, green: 0.306, blue: 0.165) // #7a4e2a
        static let milo      = Color(red: 0.176, green: 0.541, blue: 0.243) // #2d8a3e
        static let horlicks  = Color(red: 0.643, green: 0.490, blue: 0.247) // #a47d3f
        static let bandung   = Color(red: 0.796, green: 0.435, blue: 0.541) // #cb6f8a
        static let other     = Color(red: 0.659, green: 0.635, blue: 0.620) // stone-400
    }

    // MARK: - Helpers

    private static func dyn(light: UInt32, dark: UInt32) -> Color {
        Color(uiColor: UIColor { trait in
            trait.userInterfaceStyle == .dark ? uiColor(hex: dark) : uiColor(hex: light)
        })
    }

    private static func uiColor(hex: UInt32) -> UIColor {
        let r = CGFloat((hex >> 16) & 0xFF) / 255
        let g = CGFloat((hex >> 8) & 0xFF) / 255
        let b = CGFloat(hex & 0xFF) / 255
        return UIColor(red: r, green: g, blue: b, alpha: 1)
    }
}

// MARK: - Font helpers

extension Font {
    /// Serif headings — Cormorant Garamond on web, mapped to system serif here.
    static func appSerif(size: CGFloat, weight: Font.Weight = .light) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }

    /// Sans body — Inter on web, mapped to SF Pro here.
    static func appSans(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    /// Small tracked-uppercase label, the app's signature meta typography.
    static var appLabel: Font { .appSans(size: 10, weight: .medium) }
}
