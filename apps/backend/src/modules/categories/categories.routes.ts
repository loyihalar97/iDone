import { Router } from "express";
import { z } from "zod";
import { PRIORITY_LABELS_UZ, STATUS_LABELS_UZ, Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { categoriesService } from "./categories.service";

export const categoriesRouter = Router();

// Barcha foydalanuvchilar uchun — faol kategoriyalar (zayavka yaratishda ishlatiladi).
categoriesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const cats = await categoriesService.listActive();
    res.json(cats.map((c) => ({ value: c.key, label: c.label })));
  })
);

// Superadmin — boshqarish uchun to'liq ro'yxat (id, isActive, sortOrder bilan).
categoriesRouter.get(
  "/manage",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (_req, res) => {
    res.json(await categoriesService.listAll());
  })
);

const createSchema = z.object({
  label: z.string().min(2).max(60),
  key: z.string().min(1).max(60).optional(),
});

categoriesRouter.post(
  "/",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    res.status(201).json(await categoriesService.create(data, req.auth!.userId));
  })
);

const updateSchema = z.object({
  label: z.string().min(2).max(60).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

categoriesRouter.patch(
  "/:id",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    res.json(await categoriesService.update(req.params.id, data, req.auth!.userId));
  })
);

categoriesRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    res.json(await categoriesService.remove(req.params.id, req.auth!.userId));
  })
);

categoriesRouter.get("/priorities", requireAuth, (_req, res) => {
  res.json(Object.entries(PRIORITY_LABELS_UZ).map(([value, label]) => ({ value, label })));
});

categoriesRouter.get("/statuses", requireAuth, (_req, res) => {
  res.json(Object.entries(STATUS_LABELS_UZ).map(([value, label]) => ({ value, label })));
});
