import { Telegraf } from "telegraf";
import { config } from "./config";
import { registerHandlers } from "./handlers/commands";
import { botMessages } from "./i18n";

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
        text: botMessages.uz.commands.app,
        web_app: { url: config.miniAppUrl },
      },
    })
    .catch(() => {
      // Bot hali to'liq sozlanmagan bo'lsa (masalan noto'g'ri token), xatoni yutamiz
    });

  // Buyruqlar ikki tilda — Telegram foydalanuvchi tiliga qarab ko'rsatadi.
  const commandsFor = (lang: "uz" | "ru") => {
    const c = botMessages[lang].commands;
    return [
      { command: "start", description: c.start },
      { command: "app", description: c.app },
      { command: "help", description: c.help },
    ];
  };
  bot.telegram.setMyCommands(commandsFor("uz")).catch(() => {});
  bot.telegram
    .setMyCommands(commandsFor("ru"), { language_code: "ru" } as any)
    .catch(() => {});

  return bot;
}
