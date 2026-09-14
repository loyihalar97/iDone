/**
 * Alohida bot mikroservisi uchun soddalashtirilgan ikki tilli matnlar.
 *
 * Bu servisda baza ulanishi yo'q, shuning uchun til Telegram ilovasining
 * tili (`language_code`) bo'yicha aniqlanadi. Foydalanuvchi Mini App'da
 * tanlagan til esa backend yuboradigan bildirishnomalarda hisobga olinadi.
 */

export type BotLang = "uz" | "ru";

export function detectLang(languageCode?: string): BotLang {
  return languageCode?.toLowerCase().startsWith("ru") ? "ru" : "uz";
}

interface BotMessages {
  openApp: string;
  openShort: string;
  start: (name: string) => string;
  help: string;
  openAppPrompt: string;
  fallback: string;
  commands: { start: string; app: string; help: string };
}

export const botMessages: Record<BotLang, BotMessages> = {
  uz: {
    openApp: "🛠 Ilovani ochish",
    openShort: "🛠 Ochish",
    start: (name) =>
      `Assalomu alaykum, ${name}! 👋\n\n` +
      `Bu bot orqali restoran/filiallar tarmog'idagi texnik muammolar bo'yicha zayavkalarni yuritasiz.\n\n` +
      `Ilovani ochish uchun quyidagi tugmani bosing.`,
    help:
      "ℹ️ Yordam:\n\n" +
      "• /start — botni ishga tushirish va Mini App'ni ochish\n" +
      "• Ilova ichida rolingizga qarab (Direktor / Bosh texnik / Texnik / Superadmin) zayavkalar bilan ishlaysiz\n" +
      "• Ilovadagi UZ/RU tugmasi orqali tilni istalgan payt o'zgartirasiz\n" +
      "• Zayavka holati o'zgarganda sizga shu yerda avtomatik xabar keladi\n\n" +
      "Savollar bo'lsa, tizim administratoriga murojaat qiling.",
    openAppPrompt: "Ilovani ochish:",
    fallback: "Zayavka yaratish yoki ko'rish uchun ilovani oching 👇",
    commands: {
      start: "Botni ishga tushirish",
      app: "Ilovani ochish",
      help: "Yordam",
    },
  },
  ru: {
    openApp: "🛠 Открыть приложение",
    openShort: "🛠 Открыть",
    start: (name) =>
      `Здравствуйте, ${name}! 👋\n\n` +
      `Через этого бота вы ведёте заявки по техническим проблемам сети ресторанов/филиалов.\n\n` +
      `Нажмите кнопку ниже, чтобы открыть приложение.`,
    help:
      "ℹ️ Помощь:\n\n" +
      "• /start — запустить бота и открыть Mini App\n" +
      "• В приложении вы работаете с заявками согласно своей роли (Директор / Главный техник / Техник / Суперадмин)\n" +
      "• Кнопкой UZ/RU в приложении можно в любой момент сменить язык\n" +
      "• При изменении статуса заявки вам автоматически придёт уведомление сюда\n\n" +
      "По вопросам обращайтесь к администратору системы.",
    openAppPrompt: "Открыть приложение:",
    fallback: "Чтобы создать или посмотреть заявку, откройте приложение 👇",
    commands: {
      start: "Запустить бота",
      app: "Открыть приложение",
      help: "Помощь",
    },
  },
};

export function bt(languageCode?: string): BotMessages {
  return botMessages[detectLang(languageCode)];
}
