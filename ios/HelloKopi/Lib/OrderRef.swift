import Foundation

/// "KP-XXXX" reference printed on the order confirmation toast. Excludes
/// visually ambiguous chars (0/O, 1/I) so a hand-written ref reads cleanly.
func generateOrderRef() -> String {
    let chars = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
    var ref = "KP-"
    for _ in 0..<4 {
        ref.append(chars.randomElement()!)
    }
    return ref
}
