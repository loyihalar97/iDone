import { Language } from "@app/shared-types";
import { DEFAULT_LANGUAGE } from "./index";

/**
 * Backend tomonidan foydalanuvchiga yetkaziladigan barcha matnlar
 * (Telegram bildirishnomalari, PDF/Excel hisobotlar, bot javoblari).
 *
 * Har bir foydalanuvchi o'zi tanlagan tilda oladi: bildirishnoma
 * yuborilayotganda QABUL QILUVCHINING tili, eksport qilinayotganda esa
 * eksportni bosgan foydalanuvchining tili ishlatiladi.
 */
export interface Messages {
  /** Pul birligi. */
  currency: string;

  export: {
    /** Excel varag'i nomi va hisobot sarlavhasi. */
    historyTitle: string;
    sheetName: string;
    /** Yuklab olinadigan fayl nomining boshlanishi. */
    fileBaseName: string;
    columns: {
      index: string;
      createdAt: string;
      branch: string;
      category: string;
      description: string;
      priority: string;
      status: string;
      createdBy: string;
      createdByRole: string;
      chiefTechnician: string;
      technician: string;
      expense: string;
      comment: string;
      closedAt: string;
    };
    pdfColumns: {
      index: string;
      date: string;
      branch: string;
      category: string;
      description: string;
      status: string;
      people: string;
      expense: string;
      comment: string;
      closedAt: string;
    };
    /** PDF "Mas'ullar" ustunidagi qisqartmalar. */
    chiefShort: string;
    technicianShort: string;
    totalExpenseLabel: string;
    meta: (date: string, count: number) => string;
    totalExpenseLine: (amount: string) => string;
    caption: (count: number, format: string) => string;
  };

  notify: {
    card: {
      newRequest: string;
      closedRequest: string;
      branch: string;
      category: string;
      priority: string;
      description: string;
      createdBy: string;
      chiefTechnician: string;
      technician: string;
      expense: string;
      status: string;
    };
    assigned: (branch: string, category: string) => string;
    reassigned: (branch: string, category: string) => string;
    priorityChanged: {
      title: string;
      branch: string;
      category: string;
      change: string;
    };
    comment: {
      blockerTitle: string;
      plainTitle: string;
      branch: string;
      category: string;
      request: string;
      author: string;
      text: string;
    };
    started: (technician: string, branch: string, category: string) => string;
    completed: (technician: string, branch: string, category: string, expense: string | null) => string;
    chiefApproved: (branch: string, category: string) => string;
    closedForTechnician: (branch: string, category: string) => string;
    /** Muddatida qabul qilinmagani sababli tizim avtomatik yopgan zayavka haqida Direktorga xabar. */
    autoClosedForDirector: (branch: string, category: string, days: number) => string;
    /** Texnik ismi noma'lum bo'lganda. */
    someTechnician: string;
  };

  report: {
    weeklyTitle: string;
    monthlyTitle: string;
    allBranches: string;
    noBranch: string;
    periodLabel: string;
    emptyText: (title: string, period: string, scope: string) => string;
    caption: (args: {
      title: string;
      period: string;
      scope: string;
      total: number;
      closed: number;
      open: number;
      expense: string;
    }) => string;
    subtitle: (period: string, scope: string) => string;
    monthNames: string[];
  };

  bot: {
    openApp: string;
    start: (name: string) => string;
    help: string;
    openAppPrompt: string;
    fallback: string;
    commands: { start: string; app: string; help: string };
  };
}

const uz: Messages = {
  currency: "so'm",

  export: {
    historyTitle: "Zayavkalar tarixi",
    sheetName: "Zayavkalar tarixi",
    fileBaseName: "zayavkalar-tarixi",
    columns: {
      index: "№",
      createdAt: "Ochilgan sana",
      branch: "Filial",
      category: "Kategoriya",
      description: "Tavsif",
      priority: "Muhimlik",
      status: "Holat",
      createdBy: "Yaratuvchi",
      createdByRole: "Lavozimi",
      chiefTechnician: "Bosh texnik",
      technician: "Texnik",
      expense: "Harajat (so'm)",
      comment: "Izoh",
      closedAt: "Yopilgan sana",
    },
    pdfColumns: {
      index: "№",
      date: "Sana",
      branch: "Filial",
      category: "Kategoriya",
      description: "Tavsif",
      status: "Holat",
      people: "Mas'ullar",
      expense: "Harajat",
      comment: "Izoh",
      closedAt: "Yopilgan",
    },
    chiefShort: "BT",
    technicianShort: "T",
    totalExpenseLabel: "Jami harajat:",
    meta: (date, count) => `Eksport sanasi: ${date} · Jami: ${count} ta zayavka`,
    totalExpenseLine: (amount) => `Jami harajat: ${amount} so'm`,
    caption: (count, format) => `📄 Zayavkalar tarixi (${count} ta) — ${format}`,
  },

  notify: {
    card: {
      newRequest: "🆕 Yangi zayavka ochildi",
      closedRequest: "🔒 Zayavka yopildi",
      branch: "Filial",
      category: "Kategoriya",
      priority: "Muhimlik",
      description: "Tavsif",
      createdBy: "Yaratdi",
      chiefTechnician: "Bosh texnik",
      technician: "Texnik",
      expense: "Harajat",
      status: "Holat",
    },
    assigned: (branch, category) =>
      `🔧 Sizga yangi zayavka biriktirildi: ${branch} filiali, "${category}".`,
    reassigned: (branch, category) =>
      `ℹ️ Zayavka boshqa texnikka o'tkazildi: ${branch} filiali, "${category}".`,
    priorityChanged: {
      title: "⚠️ Muhimlik darajasi o'zgartirildi",
      branch: "Filial",
      category: "Kategoriya",
      change: "O'zgarish",
    },
    comment: {
      blockerTitle: "🚫 Bu ishni bajarish imkonsiz",
      plainTitle: "💬 Zayavkaga izoh qoldirildi",
      branch: "Filial",
      category: "Kategoriya",
      request: "Zayavka",
      author: "Bosh texnik",
      text: "Izoh",
    },
    started: (technician, branch, category) =>
      `▶️ ${technician} ishni boshladi: ${branch}, "${category}".`,
    completed: (technician, branch, category, expense) =>
      `✅ ${technician} ishni yakunladi: ${branch}, "${category}".` +
      (expense ? ` Kiritilgan harajat: ${expense} so'm.` : "") +
      ` Tekshirib, ishni yakunlashingiz kerak.`,
    chiefApproved: (branch, category) =>
      `👍 Bosh texnik ishni tasdiqladi: ${branch}, "${category}". Qabul qilishingiz kerak.`,
    closedForTechnician: (branch, category) => `🔒 Zayavka yopildi: ${branch}, "${category}".`,
    autoClosedForDirector: (branch, category, days) =>
      `⏰ <b>Zayavka avtomatik yopildi:</b> ${branch}, "${category}".\n` +
      `Bosh texnik tasdiqlagandan so'ng ${days} kun ichida qabul qilinmagani sababli tizim uni avtomatik yopdi.`,
    someTechnician: "Texnik",
  },

  report: {
    weeklyTitle: "Haftalik hisobot",
    monthlyTitle: "Oylik hisobot",
    allBranches: "Barcha filiallar",
    noBranch: "Filial biriktirilmagan",
    periodLabel: "Davr",
    emptyText: (title, period, scope) =>
      `📊 <b>${title}</b>\n` +
      `📅 Davr: ${period}\n` +
      `🏢 ${scope}\n\n` +
      `Bu davrda birorta ham zayavka ochilmagan.`,
    caption: ({ title, period, scope, total, closed, open, expense }) =>
      `📊 <b>${title}</b>\n` +
      `📅 Davr: ${period}\n` +
      `🏢 ${scope}\n\n` +
      `📄 Jami: <b>${total}</b> ta zayavka\n` +
      `✅ Yopilgan: <b>${closed}</b> · ⏳ Ochiq: <b>${open}</b>\n` +
      `💵 Umumiy harajat: <b>${expense}</b> so'm`,
    subtitle: (period, scope) => `Davr: ${period}  ·  ${scope}`,
    monthNames: [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ],
  },

  bot: {
    openApp: "🛠 Ilovani ochish",
    start: (name) =>
      `Assalomu alaykum, ${name}! 👋\n\n` +
      `Bu bot orqali restoran/filiallar tarmog'idagi texnik muammolar bo'yicha zayavkalarni yuritasiz.\n\n` +
      `Ilovani ochish uchun quyidagi tugmani bosing.`,
    help:
      "ℹ️ Yordam:\n\n" +
      "• /start — botni ishga tushirish va Mini App'ni ochish\n" +
      "• Ilova ichida rolingizga qarab (Direktor / Bosh texnik / Texnik / Superadmin) zayavkalar bilan ishlaysiz\n" +
      "• Ilovadagi UZ/RU tugmasi orqali tilni istalgan payt o'zgartirasiz — xabarlar va hisobotlar ham o'sha tilda keladi\n" +
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
};

const ru: Messages = {
  currency: "сум",

  export: {
    historyTitle: "История заявок",
    sheetName: "История заявок",
    fileBaseName: "istoriya-zayavok",
    columns: {
      index: "№",
      createdAt: "Дата создания",
      branch: "Филиал",
      category: "Категория",
      description: "Описание",
      priority: "Важность",
      status: "Статус",
      createdBy: "Создал",
      createdByRole: "Должность",
      chiefTechnician: "Главный техник",
      technician: "Техник",
      expense: "Расходы (сум)",
      comment: "Комментарий",
      closedAt: "Дата закрытия",
    },
    pdfColumns: {
      index: "№",
      date: "Дата",
      branch: "Филиал",
      category: "Категория",
      description: "Описание",
      status: "Статус",
      people: "Ответственные",
      expense: "Расходы",
      comment: "Комментарий",
      closedAt: "Закрыта",
    },
    chiefShort: "ГТ",
    technicianShort: "Т",
    totalExpenseLabel: "Итого расходы:",
    meta: (date, count) => `Дата экспорта: ${date} · Всего: ${count} заявок`,
    totalExpenseLine: (amount) => `Итого расходы: ${amount} сум`,
    caption: (count, format) => `📄 История заявок (${count} шт.) — ${format}`,
  },

  notify: {
    card: {
      newRequest: "🆕 Создана новая заявка",
      closedRequest: "🔒 Заявка закрыта",
      branch: "Филиал",
      category: "Категория",
      priority: "Важность",
      description: "Описание",
      createdBy: "Создал",
      chiefTechnician: "Главный техник",
      technician: "Техник",
      expense: "Расходы",
      status: "Статус",
    },
    assigned: (branch, category) =>
      `🔧 Вам назначена новая заявка: филиал ${branch}, "${category}".`,
    reassigned: (branch, category) =>
      `ℹ️ Заявка передана другому технику: филиал ${branch}, "${category}".`,
    priorityChanged: {
      title: "⚠️ Уровень важности изменён",
      branch: "Филиал",
      category: "Категория",
      change: "Изменение",
    },
    comment: {
      blockerTitle: "🚫 Эту работу выполнить невозможно",
      plainTitle: "💬 Комментарий к заявке",
      branch: "Филиал",
      category: "Категория",
      request: "Заявка",
      author: "Главный техник",
      text: "Комментарий",
    },
    started: (technician, branch, category) =>
      `▶️ ${technician} приступил к работе: ${branch}, "${category}".`,
    completed: (technician, branch, category, expense) =>
      `✅ ${technician} завершил работу: ${branch}, "${category}".` +
      (expense ? ` Указанные расходы: ${expense} сум.` : "") +
      ` Проверьте и завершите работу.`,
    chiefApproved: (branch, category) =>
      `👍 Главный техник подтвердил работу: ${branch}, "${category}". Вам нужно её принять.`,
    closedForTechnician: (branch, category) => `🔒 Заявка закрыта: ${branch}, "${category}".`,
    autoClosedForDirector: (branch, category, days) =>
      `⏰ <b>Заявка закрыта автоматически:</b> ${branch}, "${category}".\n` +
      `Система закрыла её автоматически, так как в течение ${days} дней после подтверждения главным техником она не была принята.`,
    someTechnician: "Техник",
  },

  report: {
    weeklyTitle: "Недельный отчёт",
    monthlyTitle: "Месячный отчёт",
    allBranches: "Все филиалы",
    noBranch: "Филиал не назначен",
    periodLabel: "Период",
    emptyText: (title, period, scope) =>
      `📊 <b>${title}</b>\n` +
      `📅 Период: ${period}\n` +
      `🏢 ${scope}\n\n` +
      `За этот период не было создано ни одной заявки.`,
    caption: ({ title, period, scope, total, closed, open, expense }) =>
      `📊 <b>${title}</b>\n` +
      `📅 Период: ${period}\n` +
      `🏢 ${scope}\n\n` +
      `📄 Всего: <b>${total}</b> заявок\n` +
      `✅ Закрыто: <b>${closed}</b> · ⏳ Открыто: <b>${open}</b>\n` +
      `💵 Общие расходы: <b>${expense}</b> сум`,
    subtitle: (period, scope) => `Период: ${period}  ·  ${scope}`,
    monthNames: [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ],
  },

  bot: {
    openApp: "🛠 Открыть приложение",
    start: (name) =>
      `Здравствуйте, ${name}! 👋\n\n` +
      `Через этого бота вы ведёте заявки по техническим проблемам сети ресторанов/филиалов.\n\n` +
      `Нажмите кнопку ниже, чтобы открыть приложение.`,
    help:
      "ℹ️ Помощь:\n\n" +
      "• /start — запустить бота и открыть Mini App\n" +
      "• В приложении вы работаете с заявками согласно своей роли (Директор / Главный техник / Техник / Суперадмин)\n" +
      "• Кнопкой UZ/RU в приложении можно в любой момент сменить язык — уведомления и отчёты придут на том же языке\n" +
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

export const messages: Record<Language, Messages> = {
  [Language.UZ]: uz,
  [Language.RU]: ru,
};

/** Tanlangan tildagi matnlar to'plami. */
export function t(lang: Language = DEFAULT_LANGUAGE): Messages {
  return messages[lang] ?? messages[DEFAULT_LANGUAGE];
}
