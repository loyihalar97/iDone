import { Router } from "express";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth } from "../../core/middlewares/requireAuth";
import { prisma } from "../../core/database/prisma";
import { dashboardService, DashboardScope } from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const actor = req.auth!;
    const scope: DashboardScope = {};

    // Rol asosida statistika doirasini cheklash:
    // Direktor — faqat o'z filiali, Texnik — faqat o'ziga biriktirilgan ishlar.
    // Bosh texnik va Superadmin — kompaniya bo'yicha to'liq statistika.
    if (actor.role === Role.DIRECTOR) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
      scope.branchId = user.branchId ?? "__none__";
    } else if (actor.role === Role.TECHNICIAN) {
      scope.technicianId = actor.userId;
    }

    res.json(await dashboardService.getStats(scope));
  })
);
