import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { tableSessionsRoutes } from "./tableSessions";
import { menuRoutes } from "./menus";
import { orderRoutes } from "./orders";
import { paymentRoutes } from "./payments";

export function registerRoutes(app: FastifyInstance, prisma: PrismaClient) {
  app.register(tableSessionsRoutes(prisma), { prefix: "/v1/table-sessions" });
  app.register(menuRoutes(prisma), { prefix: "/v1/menus" });
  app.register(orderRoutes(prisma), { prefix: "/v1/orders" });
  app.register(paymentRoutes(prisma), { prefix: "/v1/payments" });
}
