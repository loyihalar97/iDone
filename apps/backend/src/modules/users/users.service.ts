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

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw AppError.validation("O'zingizni o'chira olmaysiz");
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("Foydalanuvchi topilmadi");

    // Yaratilgan zayavkalar yoki audit yozuvlari bo'lsa — o'chirib bo'lmaydi
    // (tarix buziladi). Bu holatda faolsizlantirish tavsiya etiladi.
    const [createdCount, auditCount] = await Promise.all([
      prisma.request.count({ where: { createdById: id } }),
      prisma.auditLog.count({ where: { performedById: id } }),
    ]);
    if (createdCount > 0 || auditCount > 0) {
      throw AppError.validation(
        "Bu foydalanuvchi bilan bog'liq zayavka yoki harakatlar tarixi bor. O'chirish o'rniga uni faolsizlantiring."
      );
    }

    // Bog'liq (nullable) biriktirishlarni bo'shatamiz va bildirishnomalarni o'chiramiz.
    await prisma.$transaction([
      prisma.request.updateMany({ where: { technicianId: id }, data: { technicianId: null } }),
      prisma.request.updateMany({ where: { chiefTechnicianId: id }, data: { chiefTechnicianId: null } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await auditLogService.log({
      entityType: "user",
      entityId: id,
      action: "deleted",
      performedById: actorId,
      metadata: { fullName: user.fullName, telegramId: user.telegramId },
    });
    return { success: true };
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
