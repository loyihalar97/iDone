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

    const { telegramId, text } = req.body as { telegramId?: string; text?: string };
    if (!telegramId || !text) {
      return res.status(400).json({ error: "telegramId va text majburiy" });
    }

    try {
      await bot.telegram.sendMessage(telegramId, text);
      return res.json({ delivered: true });
    } catch (err) {
      // Foydalanuvchi botni bloklagan yoki hali /start bosmagan bo'lishi mumkin —
      // bu kritik xato emas, shunchaki yetkazib bo'lmadi deb belgilaymiz.
      return res.status(200).json({ delivered: false, reason: (err as Error).message });
    }
  });

  return router;
}
