import { Router } from "express";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { auditLogService } from "./audit-log.service";

export const auditLogRouter = Router();

auditLogRouter.get(
  "/",
  requireAuth,
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const take = req.query.take ? Number(req.query.take) : 50;
    const logs = await auditLogService.listAll({ skip, take });
    res.json(logs);
  })
);
