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

    // Direktor uchun filial majburiy. Texnik uchun esa ixtiyoriy:
    // filial berilmasa (null) — texnik BARCHA filiallarga biriktirilgan hisoblanadi.
    if (data.role === Role.DIRECTOR && !data.branchId && !user.branchId) {
      throw AppError.validation("Direktor uchun filial belgilanishi shart");
    }

    // Tizimda faqat BITTA faol Bosh texnik bo'lishi mumkin — zayavkalar unga
    // avtomatik biriktiriladi.
    if (data.role === Role.CHIEF_TECHNICIAN && (data.isActive ?? user.isActive)) {
      const existingChief = await prisma.user.findFirst({
        where: { role: Role.CHIEF_TECHNICIAN, isActive: true, id: { not: id } },
      });
      if (existingChief) {
        throw AppError.validation(
          `Tizimda allaqachon faol Bosh texnik bor: ${existingChief.fullName}. ` +
            `Avval uni boshqa rolga o'tkazing yoki nofaol qiling.`
        );
      }
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
    if (isActive) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (user?.role === Role.CHIEF_TECHNICIAN) {
        const existingChief = await prisma.user.findFirst({
          where: { role: Role.CHIEF_TECHNICIAN, isActive: true, id: { not: id } },
        });
        if (existingChief) {
          throw AppError.validation(
            `Tizimda allaqachon faol Bosh texnik bor: ${existingChief.fullName}.`
          );
        }
      }
    }
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
      where: {
        role: Role.TECHNICIAN,
        isActive: true,
        // branchId berilsa — shu filial texniklari + barcha filiallarga
        // biriktirilgan (branchId = null) texniklar qaytariladi.
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
      select: { id: true, fullName: true, branchId: true },
    });
  },

  /**
   * Bosh texnik uchun texniklar nazorati: har bir texnikning filiali va
   * unga biriktirilgan ishlar kesimi (yangi, jarayonda, yakunlangan, yopilgan).
   */
  async techniciansOverview() {
    const technicians = await prisma.user.findMany({
      where: { role: Role.TECHNICIAN },
      include: { branch: { select: { name: true } } },
      orderBy: { fullName: "asc" },
    });

    const grouped = await prisma.request.groupBy({
      by: ["technicianId", "status"],
      where: { technicianId: { not: null } },
      _count: { _all: true },
    });

    return technicians.map((t) => {
      const rows = grouped.filter((g) => g.technicianId === t.id);
      const count = (statuses: string[]) =>
        rows.filter((r) => statuses.includes(r.status)).reduce((sum, r) => sum + r._count._all, 0);
      return {
        id: t.id,
        fullName: t.fullName,
        isActive: t.isActive,
        branchName: t.branch?.name ?? null, // null — barcha filiallar
        newCount: count(["new"]),
        inProgressCount: count(["in_progress"]),
        completedCount: count(["completed_by_technician", "approved_by_chief_technician", "accepted_by_director"]),
        closedCount: count(["closed"]),
      };
    });
  },

  listChiefTechnicians() {
    return prisma.user.findMany({
      where: { role: Role.CHIEF_TECHNICIAN, isActive: true },
      select: { id: true, fullName: true },
    });
  },
};
