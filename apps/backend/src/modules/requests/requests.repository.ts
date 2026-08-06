import { Prisma, RequestStatus as PrismaRequestStatus } from "@prisma/client";
import { prisma } from "../../core/database/prisma";

export interface RequestFilters {
  branchId?: string;
  status?: PrismaRequestStatus;
  priority?: string;
  category?: string;
  technicianId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const includeRelations = {
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
  chiefTechnician: { select: { id: true, fullName: true } },
  technician: { select: { id: true, fullName: true } },
} satisfies Prisma.RequestInclude;

export const requestsRepository = {
  create(data: Prisma.RequestUncheckedCreateInput) {
    return prisma.request.create({ data, include: includeRelations });
  },

  findById(id: string) {
    return prisma.request.findUnique({ where: { id }, include: includeRelations });
  },

  findMany(filters: RequestFilters, skip: number, take: number) {
    const where: Prisma.RequestWhereInput = {
      branchId: filters.branchId,
      status: filters.status,
      priority: filters.priority as any,
      category: filters.category as any,
      technicianId: filters.technicianId,
      createdAt:
        filters.dateFrom || filters.dateTo
          ? { gte: filters.dateFrom, lte: filters.dateTo }
          : undefined,
    };

    return prisma.$transaction([
      prisma.request.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.request.count({ where }),
    ]);
  },

  updateStatus(id: string, status: PrismaRequestStatus, extra: Prisma.RequestUpdateInput = {}) {
    return prisma.request.update({
      where: { id },
      data: { status, ...extra },
      include: includeRelations,
    });
  },

  assignTechnician(id: string, technicianId: string) {
    return prisma.request.update({
      where: { id },
      data: { technicianId },
      include: includeRelations,
    });
  },

  addStatusHistory(requestId: string, fromStatus: PrismaRequestStatus | null, toStatus: PrismaRequestStatus, changedById: string) {
    return prisma.requestStatusHistory.create({
      data: { requestId, fromStatus, toStatus, changedById },
    });
  },
};
