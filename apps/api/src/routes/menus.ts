import type { FastifyPluginCallback } from "fastify";
import type { PrismaClient } from "@prisma/client";

export const menuRoutes = (prisma: PrismaClient): FastifyPluginCallback => {
  return (app, _opts, done) => {
    app.get("/", async (req, reply) => {
      const { branch_id } = req.query as any;
      if (!branch_id) return reply.code(400).send({ error: "branch_id required" });

      const cats = await prisma.menuCategory.findMany({
        where: { branchId: String(branch_id) },
        include: { items: { where: { isActive: true } } },
        orderBy: { name: "asc" },
      });

      return reply.send({
        currency: "TRY",
        categories: cats.map(c => ({
          category_id: c.id,
          name: c.name,
          items: c.items.map(i => ({
            item_id: i.id,
            name: i.name,
            price: Number(i.price),
            image_url: i.imageUrl,
            allergens: (i.allergens as any[]) ?? ["none"],
          }))
        })),
        last_updated_at: new Date().toISOString(),
      });
    });

    done();
  };
};
