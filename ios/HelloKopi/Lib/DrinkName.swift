import Foundation

/// Modifier translation map for EN mode. Mirrors `MODIFIER_TRANSLATIONS` in
/// `src/lib/drinkName.ts`. Used for builder pill labels and qualifier
/// extraction in `displayDrinkName`.
let MODIFIER_TRANSLATIONS: [String: String] = [
    "Peng": "Iced",
    "Pua Sio": "Lukewarm",
    "Siew Dai": "Less sweet",
    "Gah Dai": "Extra sweet",
    "Kosong": "No sugar",
    "Gao": "Extra thick",
    "Po": "Weak",
    "Di Lo": "Extra strong",
    "Tarik": "Pulled",
]

/// Tokens that become a trailing comma-qualifier in EN-mode names. Longest-
/// first so multi-word tokens don't get partially eaten.
private let QUALIFIER_TOKENS = ["Siew Dai", "Gah Dai", "Kosong", "Gao"]

/// EN-label lookup for a single modifier token. SIN mode is pass-through.
func translateModifier(_ token: String, lang: Lang = .en) -> String {
    if lang == .sin { return token }
    return MODIFIER_TRANSLATIONS[token] ?? token
}

/// Render a drink name for the UI.
///
/// SIN mode: pass-through (raw kopitiam terms preserved).
///
/// EN mode:
/// - Trailing " Peng" stripped, "Iced " prepended.
/// - "Siew Dai", "Gah Dai", "Kosong", "Gao" extracted and appended as
///   lowercase comma qualifiers.
///
/// Examples (EN):
///   "Kopi Peng"            -> "Iced Kopi"
///   "Kopi C Siew Dai Peng" -> "Iced Kopi C, less sweet"
///   "Kopi Gao Siew Dai"    -> "Kopi, less sweet, extra thick"
///   "Teh O Kosong Peng"    -> "Iced Teh O, no sugar"
func displayDrinkName(_ raw: String, lang: Lang = .en) -> String {
    if lang == .sin { return raw }

    var working = raw
    var iced = false

    // Strip trailing " peng"
    if let range = working.range(of: #"\s*\bpeng$"#, options: [.regularExpression, .caseInsensitive]) {
        working.removeSubrange(range)
        working = working.trimmingCharacters(in: .whitespaces)
        iced = true
    }

    var qualifiers: [String] = []
    for token in QUALIFIER_TOKENS {
        // Tolerate one-or-more whitespace between words: "Siew\s+Dai".
        let pattern = #"\s*\b"# + token.replacingOccurrences(of: " ", with: #"\s+"#) + #"\b"#
        if let range = working.range(of: pattern, options: [.regularExpression, .caseInsensitive]) {
            working.removeSubrange(range)
            // Collapse extra whitespace
            working = working
                .replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression)
                .trimmingCharacters(in: .whitespaces)
            let label = MODIFIER_TRANSLATIONS[token] ?? token
            qualifiers.append(label.lowercased())
        }
    }

    var parts: [String] = []
    if iced { parts.append("Iced") }
    if !working.isEmpty { parts.append(working) }
    var result = parts.joined(separator: " ")
    if !qualifiers.isEmpty {
        result += ", " + qualifiers.joined(separator: ", ")
    }
    return result.isEmpty ? raw : result
}

/// Hot / iced classifier. Runs on the raw kopitiam name so it stays in sync
/// with the web. Returns nil for drinks without a temperature axis.
enum DrinkTemp { case hot, iced }

func drinkTemp(_ raw: String) -> DrinkTemp? {
    let n = raw.lowercased()
    if n.range(of: #"\bpeng\b"#, options: .regularExpression) != nil { return .iced }
    if n.range(of: #"(sng bao|soya cincau|michael jackson|lime juice)"#, options: .regularExpression) != nil { return .iced }
    if n.range(of: #"^(kopi|teh|yuan yang|milo|horlicks|bandung|barley|tiao he)\b"#, options: .regularExpression) != nil { return .hot }
    return nil
}
