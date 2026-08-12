import { Router } from "express";
import { z } from "zod";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { branchesService } from "./branches.service";

export const branchesRouter = Router();

branchesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const activeOnly = req.query.activeOnly !== "false";
    res.json(await branchesService.list(activeOnly));
  })
);

const createSchema = z.object({ name: z.string().min(2), address: z.string().optional() });

branchesRouter.post(
  "/",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    res.status(201).json(await branchesService.create(data, req.auth!.userId));
  })
);

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

branchesRouter.patch(
  "/:id",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    res.json(await branchesService.update(req.params.id, data, req.auth!.userId));
  })
);

branchesRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    res.json(await branchesService.remove(req.params.id, req.auth!.userId));
  })
);
