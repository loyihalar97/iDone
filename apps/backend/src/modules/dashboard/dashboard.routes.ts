import { Router } from "express";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { dashboardService } from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  requireAuth,
  requireRole(Role.SUPERADMIN, Role.CHIEF_TECHNICIAN),
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.getStats());
  })
);
