import Foundation

/// A colleague's profile row from the `members` table. `default_lang` flips the
/// app into EN or SIN when they pick their name on the greeting page.
struct Member: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let sortOrder: Int
    let defaultLang: Lang?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case sortOrder = "sort_order"
        case defaultLang = "default_lang"
    }
}
