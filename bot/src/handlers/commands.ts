import { Telegraf, Markup } from "telegraf";
import { config } from "../config";
import { bt } from "../i18n";

export function registerHandlers(bot: Telegraf) {
  bot.start(async (ctx) => {
    const m = bt(ctx.from.language_code);
    await ctx.reply(
      m.start(ctx.from.first_name),
      Markup.keyboard([[Markup.button.webApp(m.openApp, config.miniAppUrl)]]).resize()
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(bt(ctx.from?.language_code).help);
  });

  bot.command("app", async (ctx) => {
    const m = bt(ctx.from?.language_code);
    await ctx.reply(
      m.openAppPrompt,
      Markup.inlineKeyboard([Markup.button.webApp(m.openShort, config.miniAppUrl)])
    );
  });

  // Botga kelgan boshqa har qanday matnli xabarga qisqa yo'l-yo'riq
  bot.on("text", async (ctx) => {
    const m = bt(ctx.from?.language_code);
    await ctx.reply(
      m.fallback,
      Markup.inlineKeyboard([Markup.button.webApp(m.openApp, config.miniAppUrl)])
    );
  });
}
