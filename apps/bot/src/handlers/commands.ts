import { Telegraf, Markup } from "telegraf";
import { config } from "../config";

export function registerHandlers(bot: Telegraf) {
  bot.start(async (ctx) => {
    await ctx.reply(
      `Assalomu alaykum, ${ctx.from.first_name}! 👋\n\n` +
        `Bu bot orqali restoran/filiallar tarmog'idagi texnik muammolar bo'yicha zayavkalarni yuritasiz.\n\n` +
        `Ilovani ochish uchun quyidagi tugmani bosing.`,
      Markup.keyboard([[Markup.button.webApp("🛠 Ilovani ochish", config.miniAppUrl)]]).resize()
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
    await ctx.reply(
      "Ilovani ochish:",
      Markup.inlineKeyboard([Markup.button.webApp("🛠 Ochish", config.miniAppUrl)])
    );
  });

  // Botga kelgan boshqa har qanday matnli xabarga qisqa yo'l-yo'riq
  bot.on("text", async (ctx) => {
    await ctx.reply(
      "Zayavka yaratish yoki ko'rish uchun ilovani oching 👇",
      Markup.inlineKeyboard([Markup.button.webApp("🛠 Ilovani ochish", config.miniAppUrl)])
    );
  });
}
