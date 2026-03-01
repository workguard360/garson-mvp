export type SeatStatus = "available" | "claimed";

export type ResolveSessionResponse = {
  session_id: string;
  table_id: string;
  table_label: string;
  branch_id: string;
  seats: { seat_no: number; status: SeatStatus }[];
  expires_at: string;
};

export type ClaimSeatRequest = {
  seat_no: number;
  client_fingerprint: string;
};

export type ClaimSeatResponse = {
  seat_id: string;
  claim_token: string;
  claimed_until: string;
};

export type MenuResponse = {
  currency: "TRY";
  categories: {
    category_id: string;
    name: string;
    items: {
      item_id: string;
      name: string;
      price: number;
      image_url?: string | null;
      allergens: string[]; // 14 alerjen + "none"
    }[];
  }[];
  last_updated_at: string;
};

export type CreateOrderRequest = {
  session_id: string;
  seat_id: string;
  items: { item_id: string; qty: number; notes?: string }[];
  idempotency_key: string;
};

export type CreateOrderResponse = {
  order_id: string;
  status: "new" | "accepted" | "preparing" | "served" | "cancelled";
};
