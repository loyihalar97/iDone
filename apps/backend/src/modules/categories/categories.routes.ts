import { Router } from "express";
import { z } from "zod";
import { PRIORITY_LABELS, STATUS_LABELS, Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { categoriesService, pickCategoryLabel } from "./categories.service";
import { getRequestLanguage } from "../../core/i18n";

export const categoriesRouter = Router();

// Barcha foydalanuvchilar uchun — faol kategoriyalar (zayavka yaratishda
// ishlatiladi). Nomlar so'rovdagi tilda (X-Lang) qaytariladi.
categoriesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const lang = getRequestLanguage(req);
    const cats = await categoriesService.listActive();
    res.json(cats.map((c) => ({ value: c.key, label: pickCategoryLabel(c, lang) })));
  })
);

// Superadmin — boshqarish uchun to'liq ro'yxat (ikkala tildagi nomlar bilan).
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
  /** Ruscha nomi (ixtiyoriy — bo'sh bo'lsa o'zbekchasi ko'rsatiladi). */
  labelRu: z.string().max(60).optional(),
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
  labelRu: z.string().max(60).nullable().optional(),
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

categoriesRouter.get("/priorities", requireAuth, (req, res) => {
  const labels = PRIORITY_LABELS[getRequestLanguage(req)];
  res.json(Object.entries(labels).map(([value, label]) => ({ value, label })));
});

categoriesRouter.get("/statuses", requireAuth, (req, res) => {
  const labels = STATUS_LABELS[getRequestLanguage(req)];
  res.json(Object.entries(labels).map(([value, label]) => ({ value, label })));
});
