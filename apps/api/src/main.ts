import Fastify from "fastify";
import cors from "@fastify/cors";
import rawBody from "fastify-raw-body";
import { PrismaClient } from "@prisma/client";
import { env } from "./lib/env";
import { registerRoutes } from "./routes";

const prisma = new PrismaClient();

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});
await app.register(rawBody, {
  field: "rawBody",
  global: false,
  encoding: "utf8",
  runFirst: true,
});

app.get("/health", async () => ({ ok: true }));

registerRoutes(app, prisma);

app.listen({ port: env.PORT, host: "0.0.0.0" })
  .then(() => app.log.info(`API listening on :${env.PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
