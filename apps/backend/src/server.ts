import { createApp, finalizeApp } from "./app";
import { config } from "./core/config";
import { logger } from "./core/logger";
import { prisma } from "./core/database/prisma";
import { attachBot, stopBot } from "./modules/bot/bot";
import { categoriesService } from "./modules/categories/categories.service";
import { startMediaCleanupJob } from "./modules/media/media.cleanup";
import { startReportScheduler } from "./modules/reports/reports.scheduler";

let mediaCleanupTimer: NodeJS.Timeout | null = null;
let reportTimer: NodeJS.Timeout | null = null;

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception - process is dying");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled rejection - process is dying");
  process.exit(1);
});

async function main() {
  await prisma.$connect();
  logger.info("Database connected");

  // Boshlang'ich kategoriyalar (jadval bo'sh bo'lsa) — deploy'dan keyin
  // ilova qo'lda seed qilmasdan ishlashi uchun.
  try {
    await categoriesService.ensureDefaults();
  } catch (err) {
    logger.warn({ err }, "Standart kategoriyalarni yaratib bo'lmadi");
  }

  const app = createApp();

  // Telegram botni backend ichida ishga tushiramiz (webhook yoki long-polling).
  await attachBot(app);

  // Frontend statik + SPA fallback + xatolik handlerlari (webhook'dan keyin).
  finalizeApp(app);

  // Yopilgan zayavkalar rasmlarini saqlash muddati tugagach tozalaydigan
  // fon vazifasi (disk hajmi cheksiz o'smasligi uchun).
  mediaCleanupTimer = startMediaCleanupJob();

  // Avtomatik haftalik (dushanba 07:00) va oylik (oy oxirgi kuni 16:00)
  // hisobotlarni yuboruvchi rejalashtiruvchi.
  reportTimer = startReportScheduler();

  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(`Backend server running on 0.0.0.0:${config.port} (${config.env})`);
  });

  server.on("error", (err) => {
    logger.error({ err }, "HTTP server failed to start");
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});

process.on("SIGTERM", async () => {
  stopBot();
  if (mediaCleanupTimer) clearInterval(mediaCleanupTimer);
  if (reportTimer) clearInterval(reportTimer);
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  stopBot();
  if (mediaCleanupTimer) clearInterval(mediaCleanupTimer);
  if (reportTimer) clearInterval(reportTimer);
  await prisma.$disconnect();
  process.exit(0);
});
