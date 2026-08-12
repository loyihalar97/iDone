import { Router } from "express";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth } from "../../core/middlewares/requireAuth";
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
