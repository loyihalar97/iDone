import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const branch = await prisma.branch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Chilonzor filiali",
      address: "Toshkent, Chilonzor tumani",
    },
  });

  // DIQQAT: superadminni faollashtirish uchun quyidagi telegramId ni
  // o'zingizning haqiqiy Telegram ID'ingizga almashtiring (masalan @userinfobot orqali bilib oling).
  const superadmin = await prisma.user.upsert({
    where: { telegramId: "000000000" },
    update: {},
    create: {
      telegramId: "000000000",
      fullName: "Bosh administrator",
      role: Role.superadmin,
      isActive: true,
    },
  });

  console.log("Seed muvaffaqiyatli bajarildi:");
  console.log({ branch: branch.name, superadmin: superadmin.fullName });
  console.log(
    "\n⚠️  Superadminning telegramId maydonini haqiqiy Telegram ID bilan yangilang (prisma/seed.ts)."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
