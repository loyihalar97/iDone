import { Role } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { AppError } from "../../core/errors/AppError";
import { auditLogService } from "../audit-log/audit-log.service";

export const usersService = {
  list(filters: { role?: Role; branchId?: string; isActive?: boolean }) {
    return prisma.user.findMany({
      where: filters,
      include: {
        branch: { select: { name: true } },
        // Hududiy rahbarga biriktirilgan filiallar.
        managedBranches: { include: { branch: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Rol tayinlash.
   *
   *  - Direktor va Filial menejeri uchun BITTA filial majburiy (`branchId`);
   *  - Hududiy rahbar uchun kamida bitta filial `branchIds` orqali biriktiriladi;
   *  - Texnik uchun filial ixtiyoriy (bo'sh = barcha filiallar);
   *  - Bosh texnik, Rahbar, Superadmin — filialsiz.
   *
   * Bosh texniklar soni cheklanmagan — tizimda bir nechta faol Bosh texnik
   * bo'lishi mumkin.
   */
  async assignRole(
    id: string,
    data: { role: Role; branchId?: string | null; branchIds?: string[]; isActive?: boolean },
    actorId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("Foydalanuvchi topilmadi");

    const needsSingleBranch = data.role === Role.DIRECTOR || data.role === Role.BRANCH_MANAGER;
    if (needsSingleBranch && !data.branchId && !user.branchId) {
      throw AppError.validation(
        data.role === Role.DIRECTOR
          ? "Direktor uchun filial belgilanishi shart"
          : "Filial menejeri uchun filial belgilanishi shart"
      );
    }

    if (data.role === Role.REGIONAL_MANAGER && (data.branchIds ?? []).length === 0) {
      throw AppError.validation(
        "Hududiy rahbar uchun kamida bitta filial biriktirilishi shart"
      );
    }

    // Bitta filial faqat quyidagi rollarda saqlanadi; qolganlarida tozalanadi.
    const keepsSingleBranch = needsSingleBranch || data.role === Role.TECHNICIAN;
    const nextBranchId = keepsSingleBranch
      ? data.branchId === undefined
        ? undefined
        : data.branchId
      : null;

    const updated = await prisma.$transaction(async (tx: any) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          role: data.role,
          branchId: nextBranchId,
          isActive: data.isActive ?? user.isActive,
        },
      });

      // Ko'p-filial biriktiruvlari faqat Hududiy rahbarda saqlanadi.
      await tx.userBranch.deleteMany({ where: { userId: id } });
      if (data.role === Role.REGIONAL_MANAGER && data.branchIds?.length) {
        await tx.userBranch.createMany({
          data: data.branchIds.map((branchId: string) => ({ userId: id, branchId })),
          skipDuplicates: true,
        });
      }

      return u;
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
      // Yozgan izohlari saqlanadi, muallifligi o'chiruvchi adminga o'tadi.
      prisma.requestComment.updateMany({ where: { authorId: id }, data: { authorId: actorId } }),
      // Filial biriktiruvlari (Hududiy rahbar) bekor qilinadi.
      prisma.userBranch.deleteMany({ where: { userId: id } }),
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

  /**
   * Zayavkaga biriktirish mumkin bo'lgan xodimlar. Texniklardan tashqari
   * BOSH TEXNIKLAR ham qaytariladi — bosh texnik ishni o'ziga (yoki boshqa
   * bosh texnikka) biriktira olishi kerak.
   */
  listTechnicians(branchId?: string) {
    return prisma.user.findMany({
      where: {
        role: { in: [Role.TECHNICIAN, Role.CHIEF_TECHNICIAN] as any },
        isActive: true,
        // branchId berilsa — shu filial texniklari + barcha filiallarga
        // biriktirilgan (branchId = null) texniklar qaytariladi.
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
      select: { id: true, fullName: true, branchId: true, role: true },
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
    });
  },

  /**
   * Bosh texnik uchun texniklar nazorati: har bir texnikning filiali va
   * unga biriktirilgan ishlar kesimi (yangi, jarayonda, yakunlangan, yopilgan).
   */
  async techniciansOverview() {
    const technicians = await prisma.user.findMany({
      // Bosh texniklar ham ishni o'ziga biriktira oladi — ular ham nazoratda
      // ko'rinadi.
      where: { role: { in: [Role.TECHNICIAN, Role.CHIEF_TECHNICIAN] as any } },
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
        role: t.role,
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
