import { RequestStatus } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface DashboardScope {
  branchId?: string;
  /** Ruxsat etilgan filiallar (Hududiy rahbar — bir nechta). */
  branchIds?: string[];
  technicianId?: string;
}

export const dashboardService = {
  async getStats(scope: DashboardScope = {}) {
    const branchWhere = scope.branchIds
      ? { branchId: { in: scope.branchIds } }
      : scope.branchId
        ? { branchId: scope.branchId }
        : {};

    const scopeWhere = {
      ...branchWhere,
      ...(scope.technicianId ? { technicianId: scope.technicianId } : {}),
    };

    // Filial va texnik kesimidagi taqsimot bitta filial yoki bitta texnik
    // doirasida mantiqsiz — u faqat ko'p filialli ko'rinishda chiqariladi
    // (Hududiy rahbar, Rahbar, Bosh texnik, Superadmin).
    const isScoped =
      !!scope.technicianId ||
      !!scope.branchId ||
      (!!scope.branchIds && scope.branchIds.length <= 1);

    const [openCount, inProgressCount, closedTodayCount, closedThisMonthCount, closedRequests, branchGroups, technicianGroups] =
      await Promise.all([
        prisma.request.count({ where: { ...scopeWhere, status: RequestStatus.NEW as any } }),
        prisma.request.count({
          where: {
            ...scopeWhere,
            status: {
              in: [
                RequestStatus.IN_PROGRESS,
                RequestStatus.COMPLETED_BY_TECHNICIAN,
                RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN,
              ] as any,
            },
          },
        }),
        prisma.request.count({
          where: { ...scopeWhere, status: RequestStatus.CLOSED as any, closedAt: { gte: startOfToday() } },
        }),
        prisma.request.count({
          where: { ...scopeWhere, status: RequestStatus.CLOSED as any, closedAt: { gte: startOfMonth() } },
        }),
        prisma.request.findMany({
          where: { ...scopeWhere, status: RequestStatus.CLOSED as any, closedAt: { not: null } },
          select: { createdAt: true, closedAt: true },
          take: 500,
          orderBy: { closedAt: "desc" },
        }),
        // Filial va texnik bo'yicha taqsimot faqat umumiy (scope'lanmagan) ko'rinishda mantiqli —
        // shaxsiy ko'rinishda (direktor/texnik) bu ro'yxatlar bo'sh qaytariladi.
        isScoped
          ? Promise.resolve([])
          : prisma.request.groupBy({
              by: ["branchId"],
              _count: { _all: true },
              // DIQQAT: taqsimot ham foydalanuvchi doirasi bilan cheklanadi —
              // aks holda Hududiy rahbar begona filiallar nomini ko'rib qolardi.
              where: scopeWhere,
              orderBy: { _count: { branchId: "desc" } },
              take: 5,
            }),
        isScoped
          ? Promise.resolve([])
          : prisma.request.groupBy({
              by: ["technicianId"],
              _count: { _all: true },
              where: { ...scopeWhere, technicianId: { not: null } },
              orderBy: { _count: { technicianId: "desc" } },
              take: 5,
            }),
      ]);

    const avgResolutionHours =
      closedRequests.length === 0
        ? 0
        : closedRequests.reduce((sum: number, r: { createdAt: Date; closedAt: Date | null }) => {
            const diffMs = (r.closedAt as Date).getTime() - r.createdAt.getTime();
            return sum + diffMs / (1000 * 60 * 60);
          }, 0) / closedRequests.length;

    const branchIds = branchGroups.map((b: { branchId: string }) => b.branchId);
    const branches = await prisma.branch.findMany({ where: { id: { in: branchIds } } });
    const topBranchesByRequests = branchGroups.map((g: { branchId: string; _count: { _all: number } }) => ({
      branchName: branches.find((b: { id: string }) => b.id === g.branchId)?.name ?? "Noma'lum",
      count: g._count._all,
    }));

    const technicianIds = technicianGroups
      .map((t: { technicianId: string | null }) => t.technicianId)
      .filter((id: string | null): id is string => !!id);
    const technicians = await prisma.user.findMany({ where: { id: { in: technicianIds } } });
    const busiestTechnicians = technicianGroups.map(
      (g: { technicianId: string | null; _count: { _all: number } }) => ({
        technicianName: technicians.find((t: { id: string }) => t.id === g.technicianId)?.fullName ?? "Noma'lum",
        count: g._count._all,
      })
    );

    return {
      openCount,
      inProgressCount,
      closedTodayCount,
      closedThisMonthCount,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
      topBranchesByRequests,
      busiestTechnicians,
    };
  },
};
