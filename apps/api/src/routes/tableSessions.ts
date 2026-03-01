import type { FastifyPluginCallback } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { claimSeatRequestSchema } from "@garson/shared";
import { addMinutes, id, shaLikeDemo, nowUtc } from "../lib/utils";
import { env } from "../lib/env";

export const tableSessionsRoutes = (prisma: PrismaClient): FastifyPluginCallback => {
  return (app, _opts, done) => {

    // Resolve: ?qr_token=demo
    app.get("/resolve", async (req, reply) => {
      const { qr_token } = req.query as any;
      if (!qr_token || typeof qr_token !== "string") return reply.code(400).send({ error: "qr_token required" });

      const tokenHash = shaLikeDemo(qr_token);
      const table = await prisma.table.findFirst({
        where: { qrTokenHash: tokenHash },
        include: { seats: true },
      });
      if (!table) return reply.code(404).send({ error: "table not found" });

      // create or reuse active session
      const now = nowUtc();
      let session = await prisma.tableSession.findFirst({
        where: { tableId: table.id, status: "active", expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
      });
      if (!session) {
        session = await prisma.tableSession.create({
          data: {
            id: id("sess"),
            tableId: table.id,
            status: "active",
            expiresAt: addMinutes(now, 120),
          },
        });
      }

      // seat statuses
      const activeClaims = await prisma.seatClaim.findMany({
        where: {
          sessionId: session.id,
          status: "active",
          claimedUntil: { gt: now },
        },
      });
      const claimedSeatIds = new Set(activeClaims.map(c => c.seatId));

      const seats = table.seats
        .sort((a,b) => a.seatNo - b.seatNo)
        .map(s => ({ seat_no: s.seatNo, status: claimedSeatIds.has(s.id) ? "claimed" : "available" as const }));

      return reply.send({
        session_id: session.id,
        table_id: table.id,
        table_label: table.label,
        branch_id: table.branchId,
        seats,
        expires_at: session.expiresAt.toISOString(),
      });
    });

    // Claim seat
    app.post("/:sessionId/seats/claim", async (req, reply) => {
      const { sessionId } = req.params as any;
      const parsed = claimSeatRequestSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const { seat_no, client_fingerprint } = parsed.data;

      const session = await prisma.tableSession.findUnique({ where: { id: sessionId } });
      if (!session || session.status !== "active") return reply.code(404).send({ error: "session not found" });
      if (session.expiresAt <= nowUtc()) return reply.code(410).send({ error: "session expired" });

      const seat = await prisma.seat.findFirst({
        where: { tableId: session.tableId, seatNo: seat_no },
      });
      if (!seat) return reply.code(404).send({ error: "seat not found" });

      const now = nowUtc();
      const claimedUntil = addMinutes(now, env.SEAT_CLAIM_TTL_MIN);

      // Transaction w/ conflict check
      try {
        const result = await prisma.$transaction(async (tx) => {
          const active = await tx.seatClaim.findFirst({
            where: { seatId: seat.id, status: "active", claimedUntil: { gt: now } },
          });
          if (active) return { conflict: true as const };

          const claim = await tx.seatClaim.create({
            data: {
              id: id("claim"),
              sessionId: session.id,
              seatId: seat.id,
              clientFingerprint: client_fingerprint,
              claimedUntil,
              status: "active",
            },
          });
          return { conflict: false as const, claim };
        });

        if (result.conflict) return reply.code(409).send({ error: "seat already claimed" });

        // Demo claim token (prod: imzalı JWT/HMAC)
        const claim_token = `claimtoken_${result.claim!.id}`;

        return reply.send({
          seat_id: seat.id,
          claim_token,
          claimed_until: claimedUntil.toISOString(),
        });
      } catch (e) {
        req.log.error(e);
        return reply.code(500).send({ error: "internal error" });
      }
    });

    done();
  };
};
