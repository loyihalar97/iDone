/**
 * Deploy oldidan bir marta ishlaydigan xavfsiz migratsiya yordamchisi.
 *
 * Ilgari `requests.category` ustuni Postgres enum (`Category`) edi. Endi u
 * dinamik (DB-backed) kategoriyalarga o'tgani uchun `text` bo'lishi kerak.
 * Bu skript ustunni ma'lumotni yo'qotmasdan `text` ga o'tkazadi (agar hali
 * enum bo'lsa). Yangi (bo'sh) bazada `requests` jadvali hali bo'lmaydi —
 * bu holatda hech narsa qilmaydi va `prisma db push` hammasini yaratadi.
 *
 * Idempotent: ustun allaqachon `text` bo'lsa, hech narsa qilmaydi (jadval
 * qayta yozilmaydi).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT data_type FROM information_schema.columns
       WHERE table_name = 'requests' AND column_name = 'category'`
    )) as { data_type: string }[];

    if (rows.length === 0) {
      console.log("[premigrate] requests jadvali topilmadi — yangi baza, o'tkazish shart emas.");
      return;
    }

    // Postgres enum ustunlari 'USER-DEFINED' deb ko'rsatiladi.
    if (rows[0].data_type === "USER-DEFINED") {
      console.log("[premigrate] category enum -> text ga o'tkazilmoqda (ma'lumot saqlanadi)...");
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "requests" ALTER COLUMN "category" TYPE text USING "category"::text`
      );
      console.log("[premigrate] Bajarildi.");
    } else {
      console.log(`[premigrate] category allaqachon '${rows[0].data_type}' — o'tkazish shart emas.`);
    }
  } catch (err) {
    // Bu qadam best-effort. Xato bo'lsa ham deploy to'xtamasligi kerak —
    // prisma db push keyin sxemani baribir moslashtiradi.
    console.warn("[premigrate] Ogohlantirish:", (err as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
