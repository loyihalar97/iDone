import { Telegraf, Markup } from "telegraf";
import type { Express } from "express";
import { Language, normalizeLanguage } from "@app/shared-types";
import { config } from "../../core/config";
import { logger } from "../../core/logger";
import { prisma } from "../../core/database/prisma";
import { DEFAULT_LANGUAGE, userLanguage } from "../../core/i18n";
import { t } from "../../core/i18n/messages";

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

/**
 * Chat egasining tili: avval bazadagi tanlovi (Mini App'dagi UZ/RU tugmasi),
 * bo'lmasa Telegram ilovasining tili, u ham noma'lum bo'lsa — o'zbekcha.
 */
async function resolveChatLanguage(
  telegramId?: number | string,
  telegramLangCode?: string
): Promise<Language> {
  if (telegramId !== undefined) {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
        select: { language: true },
      });
      if (user?.language) return userLanguage(user.language);
    } catch (err) {
      logger.warn({ err }, "Bot: foydalanuvchi tilini aniqlab bo'lmadi");
    }
  }
  return normalizeLanguage(telegramLangCode, DEFAULT_LANGUAGE);
}

function registerHandlers(bot: Telegraf) {
  const miniAppUrl = config.miniAppUrl;
  const openButton = (lang: Language) =>
    Markup.inlineKeyboard([Markup.button.webApp(t(lang).bot.openApp, miniAppUrl)]);

  bot.start(async (ctx) => {
    const lang = await resolveChatLanguage(ctx.from.id, ctx.from.language_code);
    await ctx.reply(
      t(lang).bot.start(ctx.from.first_name),
      Markup.keyboard([[Markup.button.webApp(t(lang).bot.openApp, miniAppUrl)]]).resize()
    );
  });

  bot.help(async (ctx) => {
    const lang = await resolveChatLanguage(ctx.from?.id, ctx.from?.language_code);
    await ctx.reply(t(lang).bot.help);
  });

  bot.command("app", async (ctx) => {
    const lang = await resolveChatLanguage(ctx.from?.id, ctx.from?.language_code);
    await ctx.reply(t(lang).bot.openAppPrompt, openButton(lang));
  });

  bot.on("text", async (ctx) => {
    const lang = await resolveChatLanguage(ctx.from?.id, ctx.from?.language_code);
    await ctx.reply(t(lang).bot.fallback, openButton(lang));
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
        menuButton: {
          type: "web_app",
          text: t(DEFAULT_LANGUAGE).bot.commands.app,
          web_app: { url: config.miniAppUrl },
        },
      })
      .catch(() => {});
  }

  // Buyruqlar ro'yxati ikki tilda: Telegram foydalanuvchining ilova tiliga
  // qarab mos variantni ko'rsatadi (standarti — o'zbekcha).
  const commandsFor = (lang: Language) => {
    const c = t(lang).bot.commands;
    return [
      { command: "start", description: c.start },
      { command: "app", description: c.app },
      { command: "help", description: c.help },
    ];
  };
  bot.telegram.setMyCommands(commandsFor(DEFAULT_LANGUAGE)).catch(() => {});
  bot.telegram
    .setMyCommands(commandsFor(Language.RU), { language_code: "ru" } as any)
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
