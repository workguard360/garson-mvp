import type { FastifyPluginCallback } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { env } from "../lib/env";

/**
 * Bu modül şimdilik STUB.
 * Prod'da:
 * - payment intent oluştur
 * - PSP hosted/redirect url döndür
 * - webhook imzası doğrula + idempotency
 */
export const paymentRoutes = (_prisma: PrismaClient): FastifyPluginCallback => {
  return (app, _opts, done) => {

    app.post("/intents", async (_req, reply) => {
      return reply.send({
        payment_intent_id: "pi_demo",
        amount_total: 340.0,
        currency: "TRY",
        psp_redirect_url: "https://example-psp/checkout?token=demo"
      });
    });

    app.post("/webhooks/psp", { config: { rawBody: true } }, async (req, reply) => {
      // Demo "signature" check
      const sig = (req.headers["x-webhook-secret"] ?? "").toString();
      if (sig !== env.PSP_WEBHOOK_SECRET) return reply.code(401).send({ error: "bad signature" });

      // Idempotency: demo event id
      // Prod: provider_txn_id + type hash + payment_event store
      return reply.send({ ok: true });
    });

    done();
  };
};
