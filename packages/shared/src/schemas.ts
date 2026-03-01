import { z } from "zod";

export const claimSeatRequestSchema = z.object({
  seat_no: z.number().int().min(1).max(24),
  client_fingerprint: z.string().min(3).max(200),
});

export const createOrderRequestSchema = z.object({
  session_id: z.string().min(3),
  seat_id: z.string().min(3),
  items: z.array(z.object({
    item_id: z.string().min(3),
    qty: z.number().int().min(1).max(20),
    notes: z.string().max(200).optional(),
  })).min(1),
  idempotency_key: z.string().uuid(),
});
