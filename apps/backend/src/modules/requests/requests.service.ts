import {
  CATEGORY_LABELS_UZ,
  Category,
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
import { auditLogService } from "../audit-log/audit-log.service";
import { notificationsService } from "../notifications/notifications.service";
import { mediaService } from "../media/media.service";
import type { AuthTokenPayload } from "../auth/auth.service";

interface CreateRequestInput {
  branchId: string;
  chiefTechnicianId?: string;
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
function buildRequestCardHtml(request: RequestWithRelations, title: string): string {
  const lines = [
    `<b>${title}</b>`,
    ``,
    `🏢 <b>Filial:</b> ${escapeHtml(request.branch.name)}`,
    `📂 <b>Kategoriya:</b> ${CATEGORY_LABELS_UZ[request.category as Category]}`,
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
  lines.push(`📌 <b>Holat:</b> ${STATUS_LABELS_UZ[request.status as RequestStatus]}`);
  return lines.join("\n");
}

export const requestsService = {
  async create(input: CreateRequestInput, actor: AuthTokenPayload) {
    if (actor.role !== Role.DIRECTOR && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Faqat filial direktori zayavka yarata oladi");
    }

    const request = await requestsRepository.create({
      branchId: input.branchId,
      createdById: actor.userId,
      chiefTechnicianId: input.chiefTechnicianId,
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
      metadata: { branchId: input.branchId, priority: input.priority },
    });

    // Zayavka ochilganda Direktor va Bosh texnikka formatlangan, rasmli xabar yuboriladi.
    const openCardText = buildRequestCardHtml(request, "🆕 Yangi zayavka ochildi");
    const openPhotoUrls = request.beforePhotoUrl ? [request.beforePhotoUrl] : undefined;

    await notificationsService.notify({
      userId: actor.userId,
      requestId: request.id,
      type: NotificationType.REQUEST_CREATED,
      text: openCardText,
      photoUrls: openPhotoUrls,
      html: true,
    });

    const chiefTechnicians = request.chiefTechnicianId
      ? [request.chiefTechnician]
      : await prisma.user.findMany({ where: { role: Role.CHIEF_TECHNICIAN, isActive: true } });

    for (const ct of chiefTechnicians) {
      if (!ct) continue;
      await notificationsService.notify({
        userId: ct.id,
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

    await notificationsService.notify({
      userId: technicianId,
      requestId,
      type: NotificationType.TECHNICIAN_ASSIGNED,
      text: `🔧 Sizga yangi zayavka biriktirildi: ${updated.branch.name} filiali, "${updated.category}".`,
    });

    return updated;
  },

  async changeStatus(
    requestId: string,
    nextStatus: RequestStatus,
    actor: AuthTokenPayload,
    afterPhotoUrl?: string
  ) {
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound("Zayavka topilmadi");

    await this.assertCanActOnRequest(request, actor);

    assertValidTransition(request.status as RequestStatus, nextStatus, actor.role);

    if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN && !afterPhotoUrl && !request.afterPhotoUrl) {
      throw AppError.validation("Ish yakunlangandan keyingi natija rasmi majburiy");
    }

    const willAutoClose = shouldAutoClose(nextStatus);

    const updated = await requestsRepository.updateStatus(
      requestId,
      nextStatus as PrismaRequestStatus,
      {
        afterPhotoUrl: afterPhotoUrl ?? request.afterPhotoUrl ?? undefined,
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

    // Bosh texnik "Tugatildi" bossa, alohida "Tasdiqlash" bosqichi kerak emas —
    // tizim avtomatik ravishda tasdiqlangan deb belgilaydi va Direktorga xabar boradi.
    const autoApprove =
      nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN && actor.role === Role.CHIEF_TECHNICIAN;

    if (autoApprove) {
      finalRequest = await requestsRepository.updateStatus(
        requestId,
        RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN as PrismaRequestStatus
      );
      await requestsRepository.addStatusHistory(
        requestId,
        RequestStatus.COMPLETED_BY_TECHNICIAN as PrismaRequestStatus,
        RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN as PrismaRequestStatus,
        actor.userId
      );
    }

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
    });

    await this.notifyOnStatusChange(finalRequest, autoApprove ? RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN : nextStatus);

    return finalRequest;
  },

  async notifyOnStatusChange(request: Awaited<ReturnType<typeof requestsRepository.findById>>, nextStatus: RequestStatus) {
    if (!request) return;

    if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN && request.chiefTechnicianId) {
      await notificationsService.notify({
        userId: request.chiefTechnicianId,
        requestId: request.id,
        type: NotificationType.TECHNICIAN_COMPLETED,
        text: `✅ Texnik ishni yakunladi: ${request.branch.name}, "${request.category}". Tasdiqlashingiz kerak.`,
      });
    }

    if (nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN) {
      await notificationsService.notify({
        userId: request.createdById,
        requestId: request.id,
        type: NotificationType.CHIEF_APPROVED,
        text: `👍 Bosh texnik ishni tasdiqladi: ${request.branch.name}, "${request.category}". Qabul qilishingiz kerak.`,
      });
    }

    if (nextStatus === RequestStatus.ACCEPTED_BY_DIRECTOR) {
      const closeCardText = buildRequestCardHtml(request, "🔒 Zayavka yopildi");
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
          text: `🔒 Zayavka yopildi: ${request.branch.name}, "${request.category}".`,
        });
      }

      // Rasmlar Telegram chatlarida saqlanib qoladi (yuqorida yuborildi),
      // shuning uchun bazadan va diskdan xavfsiz o'chirib tashlaymiz.
      await this.purgeMedia(request);
    }
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
