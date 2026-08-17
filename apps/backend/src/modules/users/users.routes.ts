import { Router } from "express";
import { z } from "zod";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { usersService } from "./users.service";

export const usersRouter = Router();

// Bo'sh qatorlar (?branchId=) undefined sifatida qabul qilinadi — aks holda
// Prisma validatsiya xatosi 500 bo'lib qaytardi.
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const listQuerySchema = z.object({
  role: z.preprocess(emptyToUndefined, z.nativeEnum(Role).optional()),
  branchId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  isActive: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v === "true" || v === true),
    z.boolean().optional()
  ),
});

usersRouter.get(
  "/",
  requireAuth,
  requireRole(Role.SUPERADMIN, Role.CHIEF_TECHNICIAN, Role.EXECUTIVE),
  asyncHandler(async (req, res) => {
    const { role, branchId, isActive } = listQuerySchema.parse(req.query);
    res.json(await usersService.list({ role, branchId, isActive }));
  })
);

usersRouter.get(
  "/technicians",
  requireAuth,
  requireRole(Role.CHIEF_TECHNICIAN, Role.SUPERADMIN, Role.EXECUTIVE),
  asyncHandler(async (req, res) => {
    res.json(await usersService.listTechnicians(req.query.branchId as string | undefined));
  })
);

// Bosh texnik va Rahbar uchun texniklar nazorati (yuklama kesimi bilan).
usersRouter.get(
  "/technicians/overview",
  requireAuth,
  requireRole(Role.CHIEF_TECHNICIAN, Role.SUPERADMIN, Role.EXECUTIVE),
  asyncHandler(async (_req, res) => {
    res.json(await usersService.techniciansOverview());
  })
);

usersRouter.get(
  "/chief-technicians",
  requireAuth,
  requireRole(Role.DIRECTOR, Role.SUPERADMIN),
  asyncHandler(async (_req, res) => {
    res.json(await usersService.listChiefTechnicians());
  })
);

const assignRoleSchema = z.object({
  role: z.nativeEnum(Role),
  branchId: z.string().uuid().nullable().optional(),
  // Hududiy rahbarga biriktiriladigan filiallar ro'yxati.
  branchIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

usersRouter.patch(
  "/:id/role",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const data = assignRoleSchema.parse(req.body);
    res.json(await usersService.assignRole(req.params.id, data, req.auth!.userId));
  })
);

const activeSchema = z.object({ isActive: z.boolean() });

usersRouter.patch(
  "/:id/active",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const { isActive } = activeSchema.parse(req.body);
    res.json(await usersService.setActive(req.params.id, isActive, req.auth!.userId));
  })
);

usersRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    res.json(await usersService.remove(req.params.id, req.auth!.userId));
  })
);
