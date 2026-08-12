import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT ?? "4100", 10),
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  miniAppUrl: process.env.MINI_APP_URL ?? "https://your-frontend.vercel.app",
  internalSecret: process.env.INTERNAL_SECRET ?? "",
  useWebhook: process.env.USE_WEBHOOK === "true",
  webhookDomain: process.env.WEBHOOK_DOMAIN ?? "",
  webhookPath: process.env.WEBHOOK_PATH ?? "/telegram/webhook",
  isProd: process.env.NODE_ENV === "production",
};
