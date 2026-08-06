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

export const dashboardService = {
  async getStats() {
    const [openCount, inProgressCount, closedTodayCount, closedThisMonthCount, closedRequests, branchGroups, technicianGroups] =
      await Promise.all([
        prisma.request.count({ where: { status: RequestStatus.NEW as any } }),
        prisma.request.count({
          where: {
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
          where: { status: RequestStatus.CLOSED as any, closedAt: { gte: startOfToday() } },
        }),
        prisma.request.count({
          where: { status: RequestStatus.CLOSED as any, closedAt: { gte: startOfMonth() } },
        }),
        prisma.request.findMany({
          where: { status: RequestStatus.CLOSED as any, closedAt: { not: null } },
          select: { createdAt: true, closedAt: true },
          take: 500,
          orderBy: { closedAt: "desc" },
        }),
        prisma.request.groupBy({
          by: ["branchId"],
          _count: { _all: true },
          orderBy: { _count: { branchId: "desc" } },
          take: 5,
        }),
        prisma.request.groupBy({
          by: ["technicianId"],
          _count: { _all: true },
          where: { technicianId: { not: null } },
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
