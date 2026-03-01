import Fastify from "fastify";
import rawBody from "fastify-raw-body";

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(rawBody, {
    field: "rawBody",
    global: true,
    encoding: "utf8",
    runFirst: true
  });

  app.get("/health", async () => ({ ok: true }));

  const port = Number(process.env.PORT || 10000);
  const host = "0.0.0.0";

  await app.listen({ port, host });
  app.log.info(`Server running on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});