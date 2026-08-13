import {
  NotificationType,
  Priority,
  PRIORITY_LABELS_UZ,
  RequestStatus,
  Role,
  STATUS_LABELS_UZ,
} from "@app/shared-types";
import { RequestStatus as PrismaRequestStatus } from "@prisma/client";
import { AppError } from "../../core/errors/AppError";
import { prisma } from "../../core/database/prisma";
import { requestsRepository, RequestFilters } from "./requests.repository";
import { assertValidTransition, shouldAutoClose } from "./requests.state-machine";
import { buildPdf, buildXlsx, ExportRow } from "./requests.export";
import { auditLogService } from "../audit-log/audit-log.service";
import { categoriesService } from "../categories/categories.service";
import { notificationsService } from "../notifications/notifications.service";
import { mediaService } from "../media/media.service";
import type { AuthTokenPayload } from "../auth/auth.service";

interface CreateRequestInput {
  branchId?: string;
  category: string;
  description: string;
  priority: string;
  beforePhotoUrl: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type RequestWithRelations = NonNullable<Awaited<ReturnType<typeof requestsRepository.findById>>>;

/**
 * Zayavka haqida Telegram'ga (HTML formatida) yuboriladigan chiroyli
 * "karta" matnini quradi — ochilganda va yopilganda ishlatiladi.
 */
function buildRequestCardHtml(
  request: RequestWithRelations,
  title: string,
  categoryLabel: string
): string {
  const lines = [
    `<b>${title}</b>`,
    ``,
    `🏢 <b>Filial:</b> ${escapeHtml(request.branch.name)}`,
    `📂 <b>Kategoriya:</b> ${escapeHtml(categoryLabel)}`,
    `⚠️ <b>Muhimlik:</b> ${PRIORITY_LABELS_UZ[request.priority as Priority]}`,
    `📝 <b>Tavsif:</b> ${escapeHtml(request.description)}`,
    `👤 <b>Direktor:</b> ${escapeHtml(request.createdBy.fullName)}`,
  ];
  if (request.chiefTechnician) {
    lines.push(`🧑‍🔧 <b>Bosh texnik:</b> ${escapeHtml(request.chiefTechnician.fullName)}`);
  }
  if (request.technician) {
    lines.push(`🔧 <b>Texnik:</b> ${escapeHtml(request.technician.fullName)}`);
  }
  if (request.expenseAmount !== null && request.expenseAmount !== undefined) {
    lines.push(`💵 <b>Harajat:</b> ${Number(request.expenseAmount).toLocaleString("uz-UZ")} so'm`);
  }
  lines.push(`📌 <b>Holat:</b> ${STATUS_LABELS_UZ[request.status as RequestStatus]}`);
  return lines.join("\n");
}

export const requestsService = {
  async create(input: CreateRequestInput, actor: AuthTokenPayload) {
    if (actor.role !== Role.DIRECTOR && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Faqat filial direktori zayavka yarata oladi");
    }

    // Direktor faqat O'Z filialiga zayavka ochadi. Filial Superadmin tomonidan
    // biriktiriladi — biriktirilmagan bo'lsa, zayavka ochish taqiqlanadi.
    let branchId = input.branchId;
    if (actor.role === Role.DIRECTOR) {
      const director = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
      if (!director.branchId) {
        throw AppError.validation(
          "Sizga filial biriktirilmagan. Zayavka ochish uchun Superadminga murojaat qiling."
        );
      }
      branchId = director.branchId;
    }
    if (!branchId) {
      throw AppError.validation("Filial ko'rsatilishi shart");
    }

    // Bosh texnik AVTOMATIK belgilanadi — tizimda bitta faol Bosh texnik bo'ladi.
    const chief = await prisma.user.findFirst({
      where: { role: Role.CHIEF_TECHNICIAN, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const request = await requestsRepository.create({
      branchId,
      createdById: actor.userId,
      chiefTechnicianId: chief?.id,
      category: input.category as any,
      description: input.description,
      priority: input.priority as any,
      beforePhotoUrl: input.beforePhotoUrl,
      status: PrismaRequestStatus.new,
    });

    await requestsRepository.addStatusHistory(request.id, null, PrismaRequestStatus.new, actor.userId);

    await auditLogService.log({
      entityType: "request",
      entityId: request.id,
      action: "created",
      performedById: actor.userId,
      metadata: { branchId, priority: input.priority },
    });

    // Zayavka ochilganda Direktor va Bosh texnikka formatlangan, rasmli xabar yuboriladi.
    const categoryLabel = await categoriesService.getLabel(request.category);
    const openCardText = buildRequestCardHtml(request, "🆕 Yangi zayavka ochildi", categoryLabel);
    const openPhotoUrls = request.beforePhotoUrl ? [request.beforePhotoUrl] : undefined;

    await notificationsService.notify({
      userId: actor.userId,
      requestId: request.id,
      type: NotificationType.REQUEST_CREATED,
      text: openCardText,
      photoUrls: openPhotoUrls,
      html: true,
    });

    // Avtomatik belgilangan Bosh texnikka xabar boradi.
    if (request.chiefTechnician) {
      await notificationsService.notify({
        userId: request.chiefTechnician.id,
        requestId: request.id,
        type: NotificationType.REQUEST_CREATED,
        text: openCardText,
        photoUrls: openPhotoUrls,
        html: true,
      });
    }

    return request;
  },

  async getById(id: string, actor: AuthTokenPayload) {
    const request = await requestsRepository.findById(id);
    if (!request) throw AppError.notFound("Zayavka topilmadi");
    await this.assertCanView(request, actor);
    return request;
  },

  async list(filters: RequestFilters, page: number, pageSize: number, actor: AuthTokenPayload) {
    // Rol asosida ko'rish doirasini cheklash
    if (actor.role === Role.DIRECTOR) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
      filters.branchId = user.branchId ?? "__none__";
    } else if (actor.role === Role.TECHNICIAN) {
      filters.technicianId = actor.userId;
    }
    // chief_technician va superadmin — barcha filiallarni ko'radi

    const skip = (page - 1) * pageSize;
    const [items, total] = await requestsRepository.findMany(filters, skip, pageSize);
    return { items, total, page, pageSize };
  },

  async assignTechnician(requestId: string, technicianId: string, actor: AuthTokenPayload) {
    if (actor.role !== Role.CHIEF_TECHNICIAN && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Faqat Bosh texnik texnik biriktira oladi");
    }
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound("Zayavka topilmadi");

    const technician = await prisma.user.findUnique({ where: { id: technicianId } });
    if (!technician || technician.role !== Role.TECHNICIAN) {
      throw AppError.validation("Ko'rsatilgan foydalanuvchi texnik emas");
    }

    const updated = await requestsRepository.assignTechnician(requestId, technicianId);

    await auditLogService.log({
      entityType: "request",
      entityId: requestId,
      action: "technician_assigned",
      performedById: actor.userId,
      metadata: { technicianId },
    });

    const assignCategoryLabel = await categoriesService.getLabel(updated.category);
    await notificationsService.notify({
      userId: technicianId,
      requestId,
      type: NotificationType.TECHNICIAN_ASSIGNED,
      text: `🔧 Sizga yangi zayavka biriktirildi: ${updated.branch.name} filiali, "${assignCategoryLabel}".`,
    });

    return updated;
  },

  async changeStatus(
    requestId: string,
    nextStatus: RequestStatus,
    actor: AuthTokenPayload,
    afterPhotoUrl?: string,
    expenseAmount?: number
  ) {
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound("Zayavka topilmadi");

    await this.assertCanActOnRequest(request, actor);

    assertValidTransition(request.status as RequestStatus, nextStatus, actor.role);

    // Texnik ishni yakunlashda natija rasmi majburiy.
    if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN && !afterPhotoUrl && !request.afterPhotoUrl) {
      throw AppError.validation("Ish yakunlangandan keyingi natija rasmi majburiy");
    }

    // Bosh texnik "Ishni yakunlash" bosishdan oldin ishlatilgan harajatlar
    // summasini kiritishi MAJBURIY (harajat bo'lmasa 0 kiritiladi).
    if (
      nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN &&
      expenseAmount === undefined &&
      request.expenseAmount === null
    ) {
      throw AppError.validation(
        "Ishlatilgan harajatlar summasini kiriting. Harajat bo'lmagan bo'lsa 0 kiriting."
      );
    }
    if (expenseAmount !== undefined && expenseAmount < 0) {
      throw AppError.validation("Harajat summasi manfiy bo'lishi mumkin emas");
    }

    const willAutoClose = shouldAutoClose(nextStatus);

    const updated = await requestsRepository.updateStatus(
      requestId,
      nextStatus as PrismaRequestStatus,
      {
        afterPhotoUrl: afterPhotoUrl ?? request.afterPhotoUrl ?? undefined,
        ...(expenseAmount !== undefined ? { expenseAmount } : {}),
        ...(willAutoClose ? { closedAt: new Date() } : {}),
      }
    );

    await requestsRepository.addStatusHistory(
      requestId,
      request.status,
      nextStatus as PrismaRequestStatus,
      actor.userId
    );

    let finalRequest = updated;

    if (willAutoClose) {
      finalRequest = await requestsRepository.updateStatus(requestId, PrismaRequestStatus.closed);
      await requestsRepository.addStatusHistory(
        requestId,
        RequestStatus.ACCEPTED_BY_DIRECTOR as PrismaRequestStatus,
        PrismaRequestStatus.closed,
        actor.userId
      );
    }

    await auditLogService.log({
      entityType: "request",
      entityId: requestId,
      action: `status_changed_to_${nextStatus}`,
      performedById: actor.userId,
      ...(expenseAmount !== undefined ? { metadata: { expenseAmount } } : {}),
    });

    await this.notifyOnStatusChange(finalRequest, nextStatus, actor);

    return finalRequest;
  },

  /**
   * Bosh texnik ochiq zayavkalarni drag-and-drop orqali o'z ixtiyoriga ko'ra
   * tartiblaydi. orderedIds — yangi tartibdagi zayavka ID'lari ro'yxati.
   */
  async reorder(orderedIds: string[], actor: AuthTokenPayload) {
    if (actor.role !== Role.CHIEF_TECHNICIAN && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Faqat Bosh texnik zayavkalarni tartiblashi mumkin");
    }
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.request.update({ where: { id }, data: { sortOrder: index + 1 } })
      )
    );
    return { success: true };
  },

  async notifyOnStatusChange(
    request: Awaited<ReturnType<typeof requestsRepository.findById>>,
    nextStatus: RequestStatus,
    actor?: AuthTokenPayload
  ) {
    if (!request) return;

    const categoryLabel = await categoriesService.getLabel(request.category);

    // Texnik "Ishni boshlash" bosganda Bosh texnikka xabar boradi.
    if (
      nextStatus === RequestStatus.IN_PROGRESS &&
      request.chiefTechnicianId &&
      request.chiefTechnicianId !== actor?.userId
    ) {
      const starterName = request.technician?.fullName ?? "Texnik";
      await notificationsService.notify({
        userId: request.chiefTechnicianId,
        requestId: request.id,
        type: NotificationType.TECHNICIAN_STARTED,
        text: `▶️ ${starterName} ishni boshladi: ${request.branch.name}, "${categoryLabel}".`,
      });
    }

    if (
      nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN &&
      request.chiefTechnicianId &&
      request.chiefTechnicianId !== actor?.userId
    ) {
      const workerName = request.technician?.fullName ?? "Texnik";
      await notificationsService.notify({
        userId: request.chiefTechnicianId,
        requestId: request.id,
        type: NotificationType.TECHNICIAN_COMPLETED,
        text: `✅ ${workerName} ishni yakunladi: ${request.branch.name}, "${categoryLabel}". Harajat summasini kiritib, ishni yakunlashingiz kerak.`,
      });
    }

    if (nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN) {
      await notificationsService.notify({
        userId: request.createdById,
        requestId: request.id,
        type: NotificationType.CHIEF_APPROVED,
        text: `👍 Bosh texnik ishni tasdiqladi: ${request.branch.name}, "${categoryLabel}". Qabul qilishingiz kerak.`,
      });
    }

    if (nextStatus === RequestStatus.ACCEPTED_BY_DIRECTOR) {
      const closeCardText = buildRequestCardHtml(request, "🔒 Zayavka yopildi", categoryLabel);
      const closePhotoUrls = [request.beforePhotoUrl, request.afterPhotoUrl].filter(
        (u): u is string => !!u
      );

      // Direktor va Bosh texnikka — formatlangan, oldin/keyin rasmlari bilan.
      const cardRecipients = [request.createdById, request.chiefTechnicianId].filter(
        (id): id is string => !!id
      );
      for (const userId of cardRecipients) {
        await notificationsService.notify(
          {
            userId,
            requestId: request.id,
            type: NotificationType.REQUEST_CLOSED,
            text: closeCardText,
            photoUrls: closePhotoUrls.length > 0 ? closePhotoUrls : undefined,
            html: true,
          },
          { awaitDelivery: true }
        );
      }

      // Texnikka — oddiy matnli xabar (o'zgarishsiz).
      if (request.technicianId) {
        await notificationsService.notify({
          userId: request.technicianId,
          requestId: request.id,
          type: NotificationType.REQUEST_CLOSED,
          text: `🔒 Zayavka yopildi: ${request.branch.name}, "${categoryLabel}".`,
        });
      }

      // Rasmlar Telegram chatlarida saqlanib qoladi (yuqorida yuborildi),
      // shuning uchun bazadan va diskdan xavfsiz o'chirib tashlaymiz.
      await this.purgeMedia(request);
    }
  },

  /**
   * Zayavkalar tarixini PDF yoki XLSX faylga eksport qilib, foydalanuvchining
   * Telegram bot chatiga hujjat sifatida yuboradi. Ko'rish doirasi list()
   * bilan bir xil: Direktor — o'z filiali, Texnik — o'z ishlari,
   * Bosh texnik va Superadmin — hammasi.
   */
  async exportHistory(filters: RequestFilters, format: "pdf" | "xlsx", actor: AuthTokenPayload) {
    if (actor.role === Role.DIRECTOR) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
      filters.branchId = user.branchId ?? "__none__";
    } else if (actor.role === Role.TECHNICIAN) {
      filters.technicianId = actor.userId;
    }

    const [items] = await requestsRepository.findMany(filters, 0, 2000);
    if (items.length === 0) {
      throw AppError.validation("Eksport uchun zayavkalar topilmadi");
    }

    const labels = new Map<string, string>();
    for (const item of items) {
      if (!labels.has(item.category)) {
        labels.set(item.category, await categoriesService.getLabel(item.category));
      }
    }

    const rows: ExportRow[] = items.map((r) => ({
      createdAt: r.createdAt,
      closedAt: r.closedAt,
      branchName: r.branch.name,
      categoryLabel: labels.get(r.category) ?? r.category,
      description: r.description,
      priority: r.priority,
      status: r.status,
      createdByName: r.createdBy.fullName,
      chiefTechnicianName: r.chiefTechnician?.fullName ?? null,
      technicianName: r.technician?.fullName ?? null,
      expenseAmount: r.expenseAmount,
    }));

    const stamp = new Date().toISOString().slice(0, 10);
    const title = "Zayavkalar tarixi";
    const file =
      format === "xlsx" ? await buildXlsx(rows, title) : await buildPdf(rows, title);
    const filename = `zayavkalar-tarixi-${stamp}.${format}`;
    const mime =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    await notificationsService.sendDocumentToUser(
      actor.userId,
      file,
      filename,
      mime,
      `📄 Zayavkalar tarixi (${items.length} ta) — ${format.toUpperCase()}`
    );

    await auditLogService.log({
      entityType: "request",
      entityId: "export",
      action: `history_exported_${format}`,
      performedById: actor.userId,
      metadata: { count: items.length },
    });

    return { success: true, count: items.length };
  },

  /**
   * Zayavka yopilgandan keyin uning rasm fayllarini diskdan va bazadan
   * o'chiradi. Rasmlar Telegram bot chatida (yuqorida yuborilgan xabarlarda)
   * saqlanib qolaveradi, chunki Telegram ularni o'z serverida keshlaydi.
   */
  async purgeMedia(request: RequestWithRelations) {
    mediaService.deleteLocalFileByUrl(request.beforePhotoUrl);
    mediaService.deleteLocalFileByUrl(request.afterPhotoUrl);
    await requestsRepository.clearMedia(request.id);
  },

  /**
   * Zayavkani butunlay o'chiradi (faqat Superadmin — tarixdan swipe-delete).
   * Bog'liq status tarixi cascade orqali, bildirishnomalar SetNull orqali
   * tozalanadi; rasm fayllari diskdan o'chiriladi.
   */
  async remove(id: string, actor: AuthTokenPayload) {
    if (actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Faqat superadmin zayavkani o'chira oladi");
    }
    const request = await requestsRepository.findById(id);
    if (!request) throw AppError.notFound("Zayavka topilmadi");

    mediaService.deleteLocalFileByUrl(request.beforePhotoUrl);
    mediaService.deleteLocalFileByUrl(request.afterPhotoUrl);

    await requestsRepository.remove(id);

    await auditLogService.log({
      entityType: "request",
      entityId: id,
      action: "deleted",
      performedById: actor.userId,
      metadata: { branchId: request.branchId, category: request.category },
    });

    return { success: true };
  },

  async assertCanView(request: NonNullable<Awaited<ReturnType<typeof requestsRepository.findById>>>, actor: AuthTokenPayload) {
    if (actor.role === Role.SUPERADMIN || actor.role === Role.CHIEF_TECHNICIAN) return;
    if (actor.role === Role.DIRECTOR) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
      if (request.branchId !== user.branchId) {
        throw AppError.forbidden("Bu zayavka boshqa filialga tegishli");
      }
      return;
    }
    if (actor.role === Role.TECHNICIAN) {
      if (request.technicianId !== actor.userId) {
        throw AppError.forbidden("Bu zayavka sizga biriktirilmagan");
      }
      return;
    }
  },

  async assertCanActOnRequest(request: NonNullable<Awaited<ReturnType<typeof requestsRepository.findById>>>, actor: AuthTokenPayload) {
    await this.assertCanView(request, actor);
    if (actor.role === Role.TECHNICIAN && request.technicianId !== actor.userId) {
      throw AppError.forbidden("Bu zayavka sizga biriktirilmagan");
    }
    if (actor.role === Role.DIRECTOR && request.createdById !== actor.userId) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.userId } });
      if (request.branchId !== user.branchId) {
        throw AppError.forbidden("Bu zayavka sizning filialingizga tegishli emas");
      }
    }
  },
};
