import type { FastifyPluginCallback } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { createOrderRequestSchema } from "@garson/shared";
import { id } from "../lib/utils";

export const orderRoutes = (prisma: PrismaClient): FastifyPluginCallback => {
  return (app, _opts, done) => {

    app.post("/", async (req, reply) => {
      const parsed = createOrderRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const { session_id, seat_id, items, idempotency_key } = parsed.data;

      // Idempotent create
      const existing = await prisma.order.findUnique({ where: { idempotencyKey: idempotency_key } });
      if (existing) {
        return reply.send({ order_id: existing.id, status: existing.status });
      }

      // Create order + items in tx
      const created = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            id: id("ord"),
            sessionId: session_id,
            seatId: seat_id,
            status: "new",
            idempotencyKey: idempotency_key,
            items: {
              create: items.map(it => ({
                id: id("oi"),
                itemId: it.item_id,
                qty: it.qty,
                notes: it.notes ?? null,
              })),
            },
          },
        });
        return order;
      });

      return reply.code(201).send({ order_id: created.id, status: created.status });
    });

    app.get("/kitchen/:sessionId", async (req, reply) => {
      const { sessionId } = req.params as any;
      const orders = await prisma.order.findMany({
        where: { sessionId: String(sessionId) },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return reply.send({
        orders: orders.map(o => ({
          order_id: o.id,
          status: o.status,
          seat_id: o.seatId,
          created_at: o.createdAt.toISOString(),
          items: o.items.map(i => ({ item_id: i.itemId, qty: i.qty, notes: i.notes })),
        }))
      });
    });

    app.post("/:orderId/status", async (req, reply) => {
      const { orderId } = req.params as any;
      const { status } = req.body as any;
      const allowed = new Set(["new", "accepted", "preparing", "served", "cancelled"]);
      if (!allowed.has(String(status))) return reply.code(400).send({ error: "invalid status" });

      const updated = await prisma.order.update({
        where: { id: String(orderId) },
        data: { status: String(status) },
      });

      return reply.send({ order_id: updated.id, status: updated.status });
    });

    done();
  };
};
