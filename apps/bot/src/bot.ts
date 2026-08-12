import { Telegraf } from "telegraf";
import { config } from "./config";
import { registerHandlers } from "./handlers/commands";

export function createBot() {
  if (!config.botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
  }

  const bot = new Telegraf(config.botToken);

  registerHandlers(bot);

  // Bot menyusidagi doimiy tugma — bosilganda to'g'ridan-to'g'ri Mini App ochiladi
  bot.telegram
    .setChatMenuButton({
      menuButton: {
        type: "web_app",
        text: "Ilovani ochish",
        web_app: { url: config.miniAppUrl },
      },
    })
    .catch(() => {
      // Bot hali to'liq sozlanmagan bo'lsa (masalan noto'g'ri token), xatoni yutamiz
    });

  bot.telegram
    .setMyCommands([
      { command: "start", description: "Botni ishga tushirish" },
      { command: "app", description: "Ilovani ochish" },
      { command: "help", description: "Yordam" },
    ])
    .catch(() => {});

  return bot;
}
