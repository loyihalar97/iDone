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

  /**
   * Foydalanuvchini o'chiradi — HECH QANDAY CHEKLOVSIZ (rol/tarix/huquqdan
   * qat'iy nazar). Yagona xavfsizlik: admin o'zini o'chira olmaydi (aks holda
   * o'z sessiyasini buzadi va tizim qulflanib qolishi mumkin).
   *
   * Bog'liqliklar FK xatosini bermasligi uchun quyidagicha hal qilinadi:
   *  - xodim YARATGAN zayavkalar o'chiruvchi adminga biriktiriladi (zayavka
   *    ma'lumoti va tarixi saqlanadi — yo'qolmaydi);
   *  - xodim biriktirilgan (texnik/bosh texnik) ishlar bo'shatiladi;
   *  - xodimning shaxsiy bildirishnomalari va audit yozuvlari o'chiriladi.
   */
  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw AppError.validation(
        "O'zingizni o'chira olmaysiz. Boshqa superadmin orqali o'chiring."
      );
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("Foydalanuvchi topilmadi");

    await prisma.$transaction([
      // Yaratgan zayavkalarini adminга o'tkazamiz (ma'lumot saqlanadi).
      prisma.request.updateMany({ where: { createdById: id }, data: { createdById: actorId } }),
      // Biriktirilgan ishlarni bo'shatamiz.
      prisma.request.updateMany({ where: { technicianId: id }, data: { technicianId: null } }),
      prisma.request.updateMany({ where: { chiefTechnicianId: id }, data: { chiefTechnicianId: null } }),
      // Shaxsiy audit yozuvlari va bildirishnomalarni o'chiramiz.
      prisma.auditLog.deleteMany({ where: { performedById: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      // Foydalanuvchining o'zini o'chiramiz.
      prisma.user.delete({ where: { id } }),
    ]);

    await auditLogService.log({
      entityType: "user",
      entityId: id,
      action: "deleted",
      performedById: actorId,
      metadata: { fullName: user.fullName, telegramId: user.telegramId, role: user.role },
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
