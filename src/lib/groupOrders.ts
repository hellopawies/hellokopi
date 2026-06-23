import type { Order, Session, DateGroup } from "@/lib/order";
import { SESSION_MS, TIMEZONE_SG } from "@/lib/constants";

export function groupOrders(orders: Order[]): DateGroup[] {
  if (!orders.length) return [];

  // Sort ascending so sessions build chronologically
  const sorted = [...orders].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Group by local date (YYYY-MM-DD)
  const dateMap = new Map<string, Order[]>();
  for (const order of sorted) {
    const dateKey = new Date(order.created_at).toLocaleDateString("en-CA", { timeZone: TIMEZONE_SG });
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
    dateMap.get(dateKey)!.push(order);
  }

  const groups: DateGroup[] = [];

  for (const [dateKey, dayOrders] of dateMap) {
    const sessions: Session[] = [];

    for (const order of dayOrders) {
      const t = new Date(order.created_at).getTime();
      const last = sessions[sessions.length - 1];
      // New session if first order, or gap from session start exceeds 1 hour
      if (!last || t - last.sessionStart.getTime() >= SESSION_MS) {
        sessions.push({ sessionStart: new Date(order.created_at), orders: [order] });
      } else {
        last.orders.push(order);
      }
    }

    // Flip to newest-first for display
    sessions.reverse();
    sessions.forEach((s) => s.orders.reverse());

    const dateLabel = new Date(dateKey + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    groups.push({ dateKey, dateLabel, sessions });
  }

  // Newest date first
  return groups.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
