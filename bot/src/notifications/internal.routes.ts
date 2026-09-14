import { Router } from "express";
import { Telegraf } from "telegraf";
import { config } from "../config";

export function createNotificationsRouter(bot: Telegraf) {
  const router = Router();

  router.post("/notify", async (req, res) => {
    const secret = req.headers["x-internal-secret"];
    if (!config.internalSecret || secret !== config.internalSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { telegramId, text, photoUrls, html } = req.body as {
      telegramId?: string;
      text?: string;
      photoUrls?: string[];
      html?: boolean;
    };
    if (!telegramId || !text) {
      return res.status(400).json({ error: "telegramId va text majburiy" });
    }

    const parseMode = html ? ("HTML" as const) : undefined;

    try {
      if (photoUrls && photoUrls.length === 1) {
        await bot.telegram.sendPhoto(telegramId, photoUrls[0], {
          caption: text,
          parse_mode: parseMode,
        });
      } else if (photoUrls && photoUrls.length > 1) {
        await bot.telegram.sendMediaGroup(
          telegramId,
          photoUrls.map((url, i) => ({
            type: "photo" as const,
            media: url,
            ...(i === 0 ? { caption: text, parse_mode: parseMode } : {}),
          }))
        );
      } else {
        await bot.telegram.sendMessage(telegramId, text, { parse_mode: parseMode });
      }
      return res.json({ delivered: true });
    } catch (err) {
      // Foydalanuvchi botni bloklagan yoki hali /start bosmagan bo'lishi mumkin —
      // bu kritik xato emas, shunchaki yetkazib bo'lmadi deb belgilaymiz.
      return res.status(200).json({ delivered: false, reason: (err as Error).message });
    }
  });

  return router;
}
