import { prisma } from "../../core/database/prisma";
import { AppError } from "../../core/errors/AppError";
import { auditLogService } from "../audit-log/audit-log.service";

export const branchesService = {
  list(activeOnly = false) {
    return prisma.branch.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
  },

  async create(data: { name: string; address?: string }, actorId: string) {
    const branch = await prisma.branch.create({ data });
    await auditLogService.log({
      entityType: "branch",
      entityId: branch.id,
      action: "created",
      performedById: actorId,
      metadata: data,
    });
    return branch;
  },

  async update(
    id: string,
    data: { name?: string; address?: string; isActive?: boolean },
    actorId: string
  ) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw AppError.notFound("Filial topilmadi");

    const updated = await prisma.branch.update({ where: { id }, data });
    await auditLogService.log({
      entityType: "branch",
      entityId: id,
      action: "updated",
      performedById: actorId,
      metadata: data,
    });
    return updated;
  },
};
