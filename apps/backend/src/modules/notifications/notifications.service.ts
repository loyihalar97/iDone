import { NotificationType } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { config } from "../../core/config";
import { logger } from "../../core/logger";

interface NotifyInput {
  userId: string;
  requestId?: string;
  type: NotificationType;
  text: string;
}

export const notificationsService = {
  async notify(input: NotifyInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        requestId: input.requestId,
        type: input.type as any,
        text: input.text,
      },
    });

    // Bot'ning ichki serveriga yuborib, Telegram xabarini jo'natishni so'raymiz.
    // Bot server ishlamasa ham asosiy oqim to'xtab qolmasligi uchun xatoni yutib, faqat log qilamiz.
    this.forwardToBot(input).catch((err) => {
      logger.warn({ err }, "Bildirishnomani botga yuborib bo'lmadi");
    });

    return notification;
  },

  async forwardToBot(input: NotifyInput) {
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) return;

    await fetch(`${config.botInternalUrl}/internal/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": config.botInternalSecret,
      },
      body: JSON.stringify({
        telegramId: user.telegramId,
        text: input.text,
        requestId: input.requestId,
      }),
    });
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
