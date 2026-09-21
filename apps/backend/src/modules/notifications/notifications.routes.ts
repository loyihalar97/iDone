import { Router } from "express";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { AppError } from "../../core/errors/AppError";
import { tx } from "../../core/i18n";
import { notificationsService } from "./notifications.service";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === "true";
    const list = await notificationsService.listForUser(req.auth!.userId, unreadOnly);
    res.json(list);
  })
);

notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    await notificationsService.markRead(req.params.id, req.auth!.userId);
    res.status(204).send();
  })
);

/**
 * Superadmin panelidagi "Barchaga xabar yuborish" tugmasi shu endpoint'ga
 * murojaat qiladi. Faqat Superadmin uchun ochiq.
 */
notificationsRouter.post(
  "/broadcast",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const text = String(req.body?.text ?? "").trim();
    if (!text) {
      throw AppError.validation(
        tx("Xabar matni bo'sh bo'lishi mumkin emas", "Текст сообщения не может быть пустым")
      );
    }
    if (text.length > 4000) {
      throw AppError.validation(
        tx("Xabar juda uzun (4000 belgidan oshmasin)", "Сообщение слишком длинное (не более 4000 символов)")
      );
    }
    const result = await notificationsService.broadcastToAll(text, req.auth!.userId);
    res.json(result);
  })
);
