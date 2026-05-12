import Foundation
import SwiftUI
import Supabase

/// Talks to the same Supabase project as the web app, so orders and members
/// are shared in real time. Fetches members, fetches orders, places orders.
///
/// The supabase-swift SDK is added via SPM (`https://github.com/supabase/supabase-swift`).
@MainActor
final class SupabaseService: ObservableObject {
    let client: SupabaseClient

    @Published var members: [Member] = []
    @Published var orders: [Order] = []
    @Published var isLoadingOrders: Bool = false
    @Published var lastError: String? = nil

    init() {
        self.client = SupabaseClient(
            supabaseURL: Config.supabaseURL,
            supabaseKey: Config.supabaseAnonKey
        )
    }

    // MARK: - Members

    /// Pulls the active members list, ordered by `sort_order`. Used by the
    /// name picker on the greeting page.
    func loadMembers() async {
        do {
            let rows: [Member] = try await client
                .from("members")
                .select("id,name,sort_order,default_lang")
                .order("sort_order", ascending: true)
                .execute()
                .value
            self.members = rows
        } catch {
            self.lastError = "Couldn't load members. \(error.localizedDescription)"
        }
    }

    // MARK: - Orders

    /// Pulls every order, newest first. Driven by the /orders screen and the
    /// "last order" card on My Picks.
    func loadOrders() async {
        isLoadingOrders = true
        defer { isLoadingOrders = false }
        do {
            let rows: [Order] = try await client
                .from("orders")
                .select("id,order_ref,person_name,items,notes,created_at")
                .order("created_at", ascending: false)
                .execute()
                .value
            self.orders = rows
        } catch {
            self.lastError = "Couldn't load orders. \(error.localizedDescription)"
        }
    }

    /// Inserts a fresh order. The DB fills `id` / `created_at`; we just send
    /// `order_ref` + `person_name` + `items` JSON.
    func placeOrder(personName: String, items: [OrderItem], notes: String? = nil) async throws -> Order {
        struct Insert: Encodable {
            let order_ref: String
            let person_name: String
            let items: [OrderItem]
            let notes: String?
        }
        let payload = Insert(
            order_ref: generateOrderRef(),
            person_name: personName,
            items: items,
            notes: notes
        )
        let inserted: Order = try await client
            .from("orders")
            .insert(payload)
            .select()
            .single()
            .execute()
            .value
        // Prepend locally so the UI updates without a refetch
        self.orders.insert(inserted, at: 0)
        return inserted
    }

    /// Removes a single order — used by the Cancel control on the active
    /// order banner.
    func cancelOrder(_ orderId: String) async {
        do {
            try await client
                .from("orders")
                .delete()
                .eq("id", value: orderId)
                .execute()
            self.orders.removeAll { $0.id == orderId }
        } catch {
            self.lastError = "Couldn't cancel that order. \(error.localizedDescription)"
        }
    }
}
