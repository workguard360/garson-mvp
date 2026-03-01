import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const branchId = "br_istanbul_01";
  const tableId = "tbl_12";
  const qrTokenHash = "hash_demo"; // demo token

  await prisma.branch.upsert({
    where: { id: branchId },
    update: {},
    create: { id: branchId, name: "Demo Şube", address: "İstanbul" },
  });

  await prisma.table.upsert({
    where: { id: tableId },
    update: { qrTokenHash },
    create: { id: tableId, branchId, label: "Masa 12", qrTokenHash },
  });

  // Seats 1..4
  for (let i = 1; i <= 4; i++) {
    await prisma.seat.upsert({
      where: { tableId_seatNo: { tableId, seatNo: i } },
      update: {},
      create: { id: `seat_${tableId}_${i}`, tableId, seatNo: i },
    });
  }

  const catId = "cat_main";
  await prisma.menuCategory.upsert({
    where: { id: catId },
    update: {},
    create: { id: catId, branchId, name: "Ana Yemekler" },
  });

  await prisma.menuItem.upsert({
    where: { id: "itm_001" },
    update: {},
    create: {
      id: "itm_001",
      categoryId: catId,
      name: "Tavuk Bowl",
      price: 340.0 as any,
      imageUrl: null,
      allergens: ["gluten", "sesame"],
    },
  });

  console.log("Seed done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
