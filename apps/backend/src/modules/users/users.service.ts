import { Role } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { AppError } from "../../core/errors/AppError";
import { auditLogService } from "../audit-log/audit-log.service";

export const usersService = {
  list(filters: { role?: Role; branchId?: string; isActive?: boolean }) {
    return prisma.user.findMany({
      where: filters,
      include: { branch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async assignRole(
    id: string,
    data: { role: Role; branchId?: string | null; isActive?: boolean },
    actorId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("Foydalanuvchi topilmadi");

    if ((data.role === Role.DIRECTOR || data.role === Role.TECHNICIAN) && !data.branchId && !user.branchId) {
      throw AppError.validation("Direktor va Texnik uchun filial belgilanishi shart");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: data.role,
        branchId: data.branchId === undefined ? undefined : data.branchId,
        isActive: data.isActive ?? user.isActive,
      },
    });

    await auditLogService.log({
      entityType: "user",
      entityId: id,
      action: "role_assigned",
      performedById: actorId,
      metadata: data,
    });

    return updated;
  },

  async setActive(id: string, isActive: boolean, actorId: string) {
    const updated = await prisma.user.update({ where: { id }, data: { isActive } });
    await auditLogService.log({
      entityType: "user",
      entityId: id,
      action: isActive ? "activated" : "deactivated",
      performedById: actorId,
    });
    return updated;
  },

  listTechnicians(branchId?: string) {
    return prisma.user.findMany({
      where: { role: Role.TECHNICIAN, isActive: true, ...(branchId ? { branchId } : {}) },
      select: { id: true, fullName: true, branchId: true },
    });
  },

  listChiefTechnicians() {
    return prisma.user.findMany({
      where: { role: Role.CHIEF_TECHNICIAN, isActive: true },
      select: { id: true, fullName: true },
    });
  },
};
