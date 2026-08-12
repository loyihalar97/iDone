import { Telegraf, Markup } from "telegraf";
import type { Express } from "express";
import { config } from "../../core/config";
import { logger } from "../../core/logger";

/**
 * Telegram bot — endi backend jarayonining ichida ishlaydi (alohida
 * mikroservis kerak emas). Bu Railway'da bitta ishlab turuvchi servis bilan
 * cheklanib, oylik xarajatni sezilarli kamaytiradi.
 *
 * Production'da webhook rejimi ishlatiladi (backend'ning o'z domeni orqali) —
 * long-polling doimiy so'rov tsiklini ushlab turmasligi uchun. Bu ham
 * resurs sarfini kamaytiradi.
 */

let botInstance: Telegraf | null = null;

function registerHandlers(bot: Telegraf) {
  const miniAppUrl = config.miniAppUrl;
  const openButton = () =>
    Markup.inlineKeyboard([Markup.button.webApp("🛠 Ilovani ochish", miniAppUrl)]);

  bot.start(async (ctx) => {
    await ctx.reply(
      `Assalomu alaykum, ${ctx.from.first_name}! 👋\n\n` +
        `Bu bot orqali restoran/filiallar tarmog'idagi texnik muammolar bo'yicha zayavkalarni yuritasiz.\n\n` +
        `Ilovani ochish uchun quyidagi tugmani bosing.`,
      Markup.keyboard([[Markup.button.webApp("🛠 Ilovani ochish", miniAppUrl)]]).resize()
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      "ℹ️ Yordam:\n\n" +
        "• /start — botni ishga tushirish va Mini App'ni ochish\n" +
        "• Ilova ichida rolingizga qarab (Direktor / Bosh texnik / Texnik / Superadmin) zayavkalar bilan ishlaysiz\n" +
        "• Zayavka holati o'zgarganda sizga shu yerda avtomatik xabar keladi\n\n" +
        "Savollar bo'lsa, tizim administratoriga murojaat qiling."
    );
  });

  bot.command("app", async (ctx) => {
    await ctx.reply("Ilovani ochish:", openButton());
  });

  bot.on("text", async (ctx) => {
    await ctx.reply("Zayavka yaratish yoki ko'rish uchun ilovani oching 👇", openButton());
  });
}

/**
 * Botni Express ilovasiga ulaydi. Webhook rejimida middleware sifatida,
 * aks holda long-polling'da ishga tushiriladi. Xatolar yutiladi — bot
 * ishlamasa ham asosiy API ishlashda davom etadi.
 */
export async function attachBot(app: Express): Promise<Telegraf | null> {
  if (!config.botEnabled) {
    logger.info("Bot o'chirilgan (BOT_ENABLED=false)");
    return null;
  }
  if (!config.telegramBotToken) {
    logger.warn("TELEGRAM_BOT_TOKEN sozlanmagan — bot ishga tushmadi");
    return null;
  }
  if (!config.miniAppUrl) {
    logger.warn("MINI_APP_URL/PUBLIC_BASE_URL sozlanmagan — bot tugmasi noto'g'ri bo'lishi mumkin");
  }

  const bot = new Telegraf(config.telegramBotToken);
  registerHandlers(bot);
  botInstance = bot;

  // Doimiy menyu tugmasi — bosilganda to'g'ridan-to'g'ri Mini App ochiladi.
  if (config.miniAppUrl) {
    bot.telegram
      .setChatMenuButton({
        menuButton: { type: "web_app", text: "Ilovani ochish", web_app: { url: config.miniAppUrl } },
      })
      .catch(() => {});
  }
  bot.telegram
    .setMyCommands([
      { command: "start", description: "Botni ishga tushirish" },
      { command: "app", description: "Ilovani ochish" },
      { command: "help", description: "Yordam" },
    ])
    .catch(() => {});

  if (config.useWebhook) {
    if (!config.webhookDomain) {
      logger.warn("USE_WEBHOOK=true, lekin WEBHOOK_DOMAIN/PUBLIC_BASE_URL yo'q — webhook o'rnatilmadi");
      return bot;
    }
    // Express'ga webhook middleware'ini ulaymiz.
    app.use(bot.webhookCallback(config.webhookPath));
    try {
      await bot.telegram.setWebhook(`${config.webhookDomain}${config.webhookPath}`);
      logger.info(`Bot webhook o'rnatildi: ${config.webhookDomain}${config.webhookPath}`);
    } catch (err) {
      logger.warn({ err }, "Webhook o'rnatib bo'lmadi");
    }
  } else {
    // Dev / long-polling rejimi.
    bot.launch().catch((err) => logger.warn({ err }, "Bot long-polling xatosi"));
    logger.info("Bot long-polling rejimida ishga tushdi");
  }

  return bot;
}

export function stopBot() {
  if (botInstance) {
    try {
      botInstance.stop("SIGTERM");
    } catch {
      /* ignore */
    }
  }
}
