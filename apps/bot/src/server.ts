import express from "express";
import pino from "pino";
import { config } from "./config";
import { createBot } from "./bot";
import { createNotificationsRouter } from "./notifications/internal.routes";

const logger = pino({
  transport: config.isProd ? undefined : { target: "pino-pretty" },
});

async function main() {
  const bot = createBot();
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/internal", createNotificationsRouter(bot));

  if (config.useWebhook) {
    app.use(bot.webhookCallback(config.webhookPath));
    await bot.telegram.setWebhook(`${config.webhookDomain}${config.webhookPath}`);
    logger.info(`Webhook o'rnatildi: ${config.webhookDomain}${config.webhookPath}`);
  } else {
    bot.launch();
    logger.info("Bot long-polling rejimida ishga tushdi");
  }

  app.listen(config.port, () => {
    logger.info(`Bot internal server ${config.port} portda ishlamoqda`);
  });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Botni ishga tushirib bo'lmadi");
  process.exit(1);
});
