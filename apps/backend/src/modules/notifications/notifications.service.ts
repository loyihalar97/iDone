import { Language, NotificationType } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { config } from "../../core/config";
import { logger } from "../../core/logger";
import { userLanguage } from "../../core/i18n";

/**
 * Bildirishnoma matnini QABUL QILUVCHINING tilida quruvchi funksiya.
 * Bitta voqea (masalan zayavka yopilishi) har bir xodimga o'z tilida boradi.
 */
export type NotificationTextBuilder = (lang: Language) => string;

interface NotifyInput {
  userId: string;
  requestId?: string;
  type: NotificationType;
  /** Tayyor matn yoki qabul qiluvchi tiliga qarab quriladigan matn. */
  text: string | NotificationTextBuilder;
  /** Agar berilsa, bot xabarni matn o'rniga (yoki matn bilan birga, caption sifatida) rasm(lar) bilan yuboradi. */
  photoUrls?: string[];
  /** true bo'lsa, bot xabarni Telegram HTML formatlash bilan yuboradi (masalan <b>...</b>). */
  html?: boolean;
}

const TELEGRAM_API_BASE = "https://api.telegram.org";

/** Foydalanuvchi tanlagan til (tanlamagan bo'lsa — o'zbekcha). */
export async function getUserLanguage(userId: string): Promise<Language> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { language: true },
  });
  return userLanguage(user?.language);
}

export const notificationsService = {
  async notify(input: NotifyInput, opts: { awaitDelivery?: boolean } = {}) {
    // Qabul qiluvchining tili — xabar shu tilda tuziladi va shu ko'rinishda
    // bazaga ham yoziladi.
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { telegramId: true, language: true },
    });
    const lang = userLanguage(user?.language);
    const text = typeof input.text === "function" ? input.text(lang) : input.text;

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        requestId: input.requestId,
        type: input.type as any,
        text,
      },
    });

    // Telegram Bot API'ga to'g'ridan-to'g'ri, HTTPS orqali yuboramiz — alohida
    // bot mikroservisi ishlab turishini talab qilmaydi. Xato bo'lsa (masalan
    // foydalanuvchi botni bloklagan yoki hali /start bosmagan) asosiy oqim
    // to'xtab qolmasligi uchun xatoni yutib, faqat log qilamiz.
    const delivery = this.sendToTelegram({ ...input, text }, user?.telegramId).catch((err) => {
      logger.warn({ err, userId: input.userId }, "Telegramga bildirishnoma yuborib bo'lmadi");
    });

    if (opts.awaitDelivery) {
      await delivery;
    }

    return notification;
  },

  async sendToTelegram(input: NotifyInput & { text: string }, telegramId?: string | null) {
    if (!config.telegramBotToken) {
      logger.warn("TELEGRAM_BOT_TOKEN sozlanmagan — bildirishnoma yuborilmadi");
      return;
    }

    let chatId = telegramId;
    if (!chatId) {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      chatId = user?.telegramId;
    }
    if (!chatId) return;

    const parseMode = input.html ? "HTML" : undefined;
    const apiUrl = `${TELEGRAM_API_BASE}/bot${config.telegramBotToken}`;

    let response: Response;

    if (input.photoUrls && input.photoUrls.length === 1) {
      response = await fetch(`${apiUrl}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: input.photoUrls[0],
          caption: input.text,
          parse_mode: parseMode,
        }),
      });
    } else if (input.photoUrls && input.photoUrls.length > 1) {
      response = await fetch(`${apiUrl}/sendMediaGroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          media: input.photoUrls.map((url, i) => ({
            type: "photo",
            media: url,
            ...(i === 0 ? { caption: input.text, parse_mode: parseMode } : {}),
          })),
        }),
      });
    } else {
      response = await fetch(`${apiUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: input.text,
          parse_mode: parseMode,
        }),
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Telegram API xatosi (${response.status}): ${body}`);
    }
  },

  /**
   * Foydalanuvchining bot chatiga hujjat (PDF/XLSX) yuboradi.
   * History eksporti shu orqali yetkaziladi.
   */
  async sendDocumentToUser(
    userId: string,
    file: Buffer,
    filename: string,
    mimeType: string,
    caption?: string,
    opts: { html?: boolean } = {}
  ) {
    if (!config.telegramBotToken) {
      throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan — hujjat yuborib bo'lmadi");
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.telegramId) {
      throw new Error("Foydalanuvchining Telegram ID'si topilmadi");
    }

    const form = new FormData();
    form.append("chat_id", user.telegramId);
    form.append("document", new Blob([new Uint8Array(file)], { type: mimeType }), filename);
    if (caption) form.append("caption", caption);
    if (caption && opts.html) form.append("parse_mode", "HTML");

    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${config.telegramBotToken}/sendDocument`,
      { method: "POST", body: form }
    );
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Telegram sendDocument xatosi (${response.status}): ${body}`);
    }
  },

  /**
   * Foydalanuvchining bot chatiga oddiy matnli xabar yuboradi (bazada
   * bildirishnoma yozuvi yaratmasdan). Avtomatik hisobotlarda "bu davrda
   * zayavka bo'lmadi" xabari uchun ishlatiladi.
   */
  async sendTextToUser(userId: string, text: string, opts: { html?: boolean } = {}) {
    if (!config.telegramBotToken) {
      throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan — xabar yuborib bo'lmadi");
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.telegramId) {
      throw new Error("Foydalanuvchining Telegram ID'si topilmadi");
    }

    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${config.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: user.telegramId,
          text,
          ...(opts.html ? { parse_mode: "HTML" } : {}),
        }),
      }
    );
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Telegram sendMessage xatosi (${response.status}): ${body}`);
    }
  },

  async listForUser(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { sentAt: "desc" },
      take: 50,
    });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  /**
   * Superadmin panelidan BARCHA faol foydalanuvchilarning bot chatiga bir
   * vaqtda oddiy e'lon yuboradi (masalan: texnik ishlar, umumiy ogohlantirish).
   *
   * Telegram Bot API bir vaqtda juda ko'p so'rovni yoqtirmaydi (429 xatosi
   * berishi mumkin), shuning uchun barchasini bitta Promise.all bilan emas,
   * kichik partiyalar (BATCH_SIZE) bilan, orada qisqa tanaffus bilan yuboramiz.
   * Bitta foydalanuvchiga yuborib bo'lmasa (botni bloklagan va h.k.) qolganlar
   * uchun jarayon davom etadi — faqat shu foydalanuvchi "failed" hisoblanadi.
   */
  async broadcastToAll(text: string, actorId: string) {
    const BATCH_SIZE = 20;
    const BATCH_DELAY_MS = 1100; // Telegram: umumiy ~30 xabar/soniya limiti.

    const users = await prisma.user.findMany({
      where: { isActive: true, telegramId: { not: null } },
      select: { id: true, telegramId: true },
    });

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (user: { id: string; telegramId: string | null }) => {
          await prisma.notification.create({
            data: { userId: user.id, type: NotificationType.ANNOUNCEMENT, text },
          });
          await this.sendToTelegram(
            { userId: user.id, type: NotificationType.ANNOUNCEMENT, text },
            user.telegramId
          );
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") sent += 1;
        else {
          failed += 1;
          logger.warn({ err: r.reason }, "E'lonni bitta foydalanuvchiga yuborib bo'lmadi");
        }
      }
      if (i + BATCH_SIZE < users.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    logger.info(
      { actorId, total: users.length, sent, failed },
      "Superadmin barcha foydalanuvchilarga e'lon yubordi"
    );

    return { total: users.length, sent, failed };
  },
};
