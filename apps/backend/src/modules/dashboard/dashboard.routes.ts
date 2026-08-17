import { Router } from "express";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth } from "../../core/middlewares/requireAuth";
import { resolveScope } from "../../core/access/scope";
import { dashboardService, DashboardScope } from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Statistika doirasi ko'rish doirasi bilan bir xil:
    // Direktor / Filial menejeri — o'z filiali, Hududiy rahbar — biriktirilgan
    // filiallari, Texnik — o'z ishlari, Bosh texnik / Rahbar / Superadmin —
    // kompaniya bo'yicha to'liq.
    const scope = await resolveScope(req.auth!);
    const dashboardScope: DashboardScope = {};

    if (scope.kind === "technician") {
      dashboardScope.technicianId = scope.technicianId;
    } else if (scope.kind === "branches") {
      dashboardScope.branchIds = scope.branchIds;
    }

    res.json(await dashboardService.getStats(dashboardScope));
  })
);
