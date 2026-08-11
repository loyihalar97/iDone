import { NotificationType } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { config } from "../../core/config";
import { logger } from "../../core/logger";

interface NotifyInput {
  userId: string;
  requestId?: string;
  type: NotificationType;
  text: string;
  /** Agar berilsa, bot xabarni matn o'rniga (yoki matn bilan birga, caption sifatida) rasm(lar) bilan yuboradi. */
  photoUrls?: string[];
  /** true bo'lsa, bot xabarni Telegram HTML formatlash bilan yuboradi (masalan <b>...</b>). */
  html?: boolean;
}

const TELEGRAM_API_BASE = "https://api.telegram.org";

export const notificationsService = {
  async notify(input: NotifyInput, opts: { awaitDelivery?: boolean } = {}) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        requestId: input.requestId,
        type: input.type as any,
        text: input.text,
      },
    });

    // Telegram Bot API'ga to'g'ridan-to'g'ri, HTTPS orqali yuboramiz — alohida
    // bot mikroservisi ishlab turishini talab qilmaydi. Xato bo'lsa (masalan
    // foydalanuvchi botni bloklagan yoki hali /start bosmagan) asosiy oqim
    // to'xtab qolmasligi uchun xatoni yutib, faqat log qilamiz.
    const delivery = this.sendToTelegram(input).catch((err) => {
      logger.warn({ err, userId: input.userId }, "Telegramga bildirishnoma yuborib bo'lmadi");
    });

    if (opts.awaitDelivery) {
      await delivery;
    }

    return notification;
  },

  async sendToTelegram(input: NotifyInput) {
    if (!config.telegramBotToken) {
      logger.warn("TELEGRAM_BOT_TOKEN sozlanmagan — bildirishnoma yuborilmadi");
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user?.telegramId) return;

    const chatId = user.telegramId;
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
};
