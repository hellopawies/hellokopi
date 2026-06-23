export interface OrderItem {
  name: string;
  description: string;
}

export interface Order {
  id: string;
  order_ref: string;
  person_name: string;
  items: OrderItem[];
  notes: string | null;
  created_at: string;
}

export interface Session {
  sessionStart: Date;
  orders: Order[];
}

export interface DateGroup {
  dateKey: string;
  dateLabel: string;
  sessions: Session[];
}
