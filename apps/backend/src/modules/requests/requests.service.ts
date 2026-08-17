import {
  NotificationType,
  Priority,
  PRIORITY_LABELS_UZ,
  REQUEST_CREATOR_ROLES,
  RequestStatus,
  Role,
  ROLE_LABELS_UZ,
  STATUS_LABELS_UZ,
} from "@app/shared-types";
import { RequestStatus as PrismaRequestStatus } from "@prisma/client";
import { AppError } from "../../core/errors/AppError";
import { config } from "../../core/config";
import { prisma } from "../../core/database/prisma";
import { requestsRepository, RequestFilters } from "./requests.repository";
import { assertValidTransition, shouldAutoClose } from "./requests.state-machine";
import { buildPdf, buildXlsx, ExportRow } from "./requests.export";
import { auditLogService } from "../audit-log/audit-log.service";
import { categoriesService } from "../categories/categories.service";
import { notificationsService } from "../notifications/notifications.service";
import { mediaService } from "../media/media.service";
import { resolveCreateBranchId, resolveScope, scopeAllowsBranch } from "../../core/access/scope";
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

export type RequestWithRelations = NonNullable<
  Awaited<ReturnType<typeof requestsRepository.findById>>
>;

/**
 * Zayavkalarni eksport (PDF/XLSX) qatorlariga aylantiradi. Qo'l bilan
 * eksport qilishda ham, avtomatik haftalik/oylik hisobotlarda ham
 * ishlatiladi — ustunlar bir xil bo'lishi uchun.
 */
export async function buildExportRows(items: RequestWithRelations[]): Promise<ExportRow[]> {
  const labels = new Map<string, string>();
  for (const item of items) {
    if (!labels.has(item.category)) {
      labels.set(item.category, await categoriesService.getLabel(item.category));
    }
  }

  return items.map((r) => ({
    createdAt: r.createdAt,
    closedAt: r.closedAt,
    branchName: r.branch.name,
    categoryLabel: labels.get(r.category) ?? r.category,
    description: r.description,
    priority: r.priority,
    status: r.status,
    createdByName: r.createdBy.fullName,
    createdByRoleLabel: ROLE_LABELS_UZ[r.createdBy.role as Role] ?? r.createdBy.role,
    chiefTechnicianName: r.chiefTechnician?.fullName ?? null,
    technicianName: r.technician?.fullName ?? null,
    expenseAmount: r.expenseAmount,
    comment: r.comments?.[0]?.text ?? null,
  }));
}

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
    `👤 <b>Yaratdi:</b> ${escapeHtml(request.createdBy.fullName)}` +
      ` (${ROLE_LABELS_UZ[request.createdBy.role as Role] ?? request.createdBy.role})`,
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

/** Tizimdagi barcha faol Bosh texniklarning ID'lari. */
async function findActiveChiefTechnicianIds(): Promise<string[]> {
  const chiefs = await prisma.user.findMany({
    where: { role: Role.CHIEF_TECHNICIAN, isActive: true },
    select: { id: true },
  });
  return chiefs.map((c: { id: string }) => c.id);
}

/** Filialga mas'ul rahbarlar (direktor va filial menejeri) ID'lari. */
async function findBranchLeaderIds(branchId: string): Promise<string[]> {
  const leaders = await prisma.user.findMany({
    where: {
      branchId,
      isActive: true,
      role: { in: [Role.DIRECTOR, Role.BRANCH_MANAGER] as any },
    },
    select: { id: true },
  });
  return leaders.map((u: { id: string }) => u.id);
}

export const requestsService = {
  async create(input: CreateRequestInput, actor: AuthTokenPayload) {
    if (!REQUEST_CREATOR_ROLES.includes(actor.role)) {
      throw AppError.forbidden("Sizning lavozimingiz zayavka ocha olmaydi");
    }

    // Filial rolga qarab aniqlanadi (o'z filiali / biriktirilgan filiallar / istalgani).
    const branchId = await resolveCreateBranchId(input.branchId, actor);

    // Bosh texnik OLDINDAN biriktirilmaydi: zayavka barcha faol bosh
    // texniklarga ko'rinadi va kim birinchi bo'lib texnik biriktirsa,
    // o'sha zayavkaning mas'ul bosh texnigi bo'lib qoladi.
    const request = await requestsRepository.create({
      branchId,
      createdById: actor.userId,
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

    // Zayavka ochilganda yaratuvchiga va BARCHA faol bosh texniklarga
    // formatlangan, rasmli xabar yuboriladi.
    const categoryLabel = await categoriesService.getLabel(request.category);
    const openCardText = buildRequestCardHtml(request, "🆕 Yangi zayavka ochildi", categoryLabel);
    const openPhotoUrls = request.beforePhotoUrl ? [request.beforePhotoUrl] : undefined;

    // Yaratuvchi + barcha faol bosh texniklar + filial rahbarlari
    // (Hududiy rahbar/Rahbar boshqa filialga zayavka ochsa, filial direktori
    // ham xabardor bo'ladi).
    const chiefIds = await findActiveChiefTechnicianIds();
    const leaderIds = await findBranchLeaderIds(branchId);
    const recipients = Array.from(new Set([actor.userId, ...chiefIds, ...leaderIds]));

    for (const userId of recipients) {
      await notificationsService.notify({
        userId,
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

  /**
   * Foydalanuvchi filtrlarini uning ko'rish doirasi bilan kesishtiradi.
   * Natijada repository faqat ruxsat etilgan yozuvlarni qaytaradi.
   */
  async applyScope(filters: RequestFilters, actor: AuthTokenPayload) {
    const scope = await resolveScope(actor);

    if (scope.kind === "technician") {
      filters.technicianId = scope.technicianId;
      delete filters.branchIds;
      return;
    }

    if (scope.kind === "branches") {
      const requested = filters.branchId;
      filters.branchIds = requested
        ? scope.branchIds.filter((id) => id === requested)
        : scope.branchIds;
      delete filters.branchId;
    }
    // "all" — cheklov yo'q, foydalanuvchi filtrlari o'z holicha qoladi.
  },

  async list(filters: RequestFilters, page: number, pageSize: number, actor: AuthTokenPayload) {
    await this.applyScope(filters, actor);

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
    if (request.status === RequestStatus.CLOSED) {
      throw AppError.conflict("Yopilgan zayavkaga texnik biriktirib bo'lmaydi");
    }

    const technician = await prisma.user.findUnique({ where: { id: technicianId } });
    // Bosh texnik ishni O'ZIGA ham biriktira oladi, shuning uchun bosh
    // texnik rolidagi xodim ham qabul qilinadi.
    if (
      !technician ||
      (technician.role !== Role.TECHNICIAN && technician.role !== Role.CHIEF_TECHNICIAN)
    ) {
      throw AppError.validation("Ko'rsatilgan foydalanuvchi texnik emas");
    }
    if (!technician.isActive) {
      throw AppError.validation("Bu xodim nofaol — unga ish biriktirib bo'lmaydi");
    }

    const previousTechnicianId = request.technicianId;

    // Mas'ul bosh texnik hali belgilanmagan bo'lsa — biriktirayotgan bosh
    // texnik zayavkaning mas'uli bo'lib qoladi.
    const claimChiefId =
      !request.chiefTechnicianId && actor.role === Role.CHIEF_TECHNICIAN ? actor.userId : undefined;

    const updated = await requestsRepository.assignTechnician(
      requestId,
      technicianId,
      claimChiefId
    );

    await auditLogService.log({
      entityType: "request",
      entityId: requestId,
      action: previousTechnicianId ? "technician_changed" : "technician_assigned",
      performedById: actor.userId,
      metadata: { technicianId, previousTechnicianId },
    });

    const assignCategoryLabel = await categoriesService.getLabel(updated.category);

    // Yangi texnikka xabar (o'ziga biriktirgan bo'lsa xabar yuborilmaydi).
    if (technicianId !== actor.userId) {
      await notificationsService.notify({
        userId: technicianId,
        requestId,
        type: NotificationType.TECHNICIAN_ASSIGNED,
        text: `🔧 Sizga yangi zayavka biriktirildi: ${updated.branch.name} filiali, "${assignCategoryLabel}".`,
      });
    }

    // Ish boshqa texnikdan olib qo'yilgan bo'lsa — eski texnikka ham xabar.
    if (previousTechnicianId && previousTechnicianId !== technicianId) {
      await notificationsService.notify({
        userId: previousTechnicianId,
        requestId,
        type: NotificationType.TECHNICIAN_ASSIGNED,
        text: `ℹ️ Zayavka boshqa texnikka o'tkazildi: ${updated.branch.name} filiali, "${assignCategoryLabel}".`,
      });
    }

    return updated;
  },

  /**
   * Muhimlik darajasini o'zgartiradi — faqat Bosh texnik (va Superadmin).
   */
  async changePriority(requestId: string, priority: Priority, actor: AuthTokenPayload) {
    if (actor.role !== Role.CHIEF_TECHNICIAN && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Muhimlik darajasini faqat Bosh texnik o'zgartira oladi");
    }
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound("Zayavka topilmadi");
    if (request.status === RequestStatus.CLOSED) {
      throw AppError.conflict("Yopilgan zayavkaning muhimligini o'zgartirib bo'lmaydi");
    }
    if (request.priority === priority) return request;

    const previous = request.priority as Priority;
    const updated = await requestsRepository.updatePriority(requestId, priority);

    await auditLogService.log({
      entityType: "request",
      entityId: requestId,
      action: "priority_changed",
      performedById: actor.userId,
      metadata: { from: previous, to: priority },
    });

    const categoryLabel = await categoriesService.getLabel(updated.category);
    const text =
      `⚠️ <b>Muhimlik darajasi o'zgartirildi</b>\n\n` +
      `🏢 <b>Filial:</b> ${escapeHtml(updated.branch.name)}\n` +
      `📂 <b>Kategoriya:</b> ${escapeHtml(categoryLabel)}\n` +
      `🔁 <b>O'zgarish:</b> ${PRIORITY_LABELS_UZ[previous]} → ${PRIORITY_LABELS_UZ[priority]}`;

    // Zayavka egasi, biriktirilgan texnik va filial rahbarlariga xabar.
    const recipients = new Set<string>([updated.createdById, ...(await findBranchLeaderIds(updated.branchId))]);
    if (updated.technicianId) recipients.add(updated.technicianId);
    recipients.delete(actor.userId);

    for (const userId of recipients) {
      await notificationsService.notify({
        userId,
        requestId,
        type: NotificationType.PRIORITY_CHANGED,
        text,
        html: true,
      });
    }

    return updated;
  },

  /**
   * Zayavkaga izoh qo'shadi. Asosiy stsenariy: Bosh texnik bajarish imkonsiz
   * bo'lgan ishga texnik biriktirmasdan sababni yozadi — izoh filial
   * direktorining (va filial menejerining) bot chatiga xabar bo'lib boradi.
   * Zayavka holati o'zgarmaydi — keyinchalik texnik biriktirish mumkin.
   */
  async addComment(
    requestId: string,
    input: { text: string; isBlocker?: boolean },
    actor: AuthTokenPayload
  ) {
    if (actor.role !== Role.CHIEF_TECHNICIAN && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden("Izohni faqat Bosh texnik yoza oladi");
    }
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound("Zayavka topilmadi");

    const isBlocker = input.isBlocker ?? true;
    const comment = await requestsRepository.addComment(
      requestId,
      actor.userId,
      input.text,
      isBlocker
    );

    await auditLogService.log({
      entityType: "request",
      entityId: requestId,
      action: isBlocker ? "blocker_comment_added" : "comment_added",
      performedById: actor.userId,
      metadata: { commentId: comment.id },
    });

    const categoryLabel = await categoriesService.getLabel(request.category);
    const author = await prisma.user.findUnique({ where: { id: actor.userId } });
    const title = isBlocker
      ? "🚫 Bu ishni bajarish imkonsiz"
      : "💬 Zayavkaga izoh qoldirildi";

    const text =
      `<b>${title}</b>\n\n` +
      `🏢 <b>Filial:</b> ${escapeHtml(request.branch.name)}\n` +
      `📂 <b>Kategoriya:</b> ${escapeHtml(categoryLabel)}\n` +
      `📝 <b>Zayavka:</b> ${escapeHtml(request.description)}\n` +
      `🧑‍🔧 <b>Bosh texnik:</b> ${escapeHtml(author?.fullName ?? "—")}\n\n` +
      `❗️ <b>Izoh:</b> ${escapeHtml(input.text)}`;

    // Filial direktori, filial menejeri va zayavka egasiga xabar boradi.
    const recipients = new Set<string>([
      request.createdById,
      ...(await findBranchLeaderIds(request.branchId)),
    ]);
    recipients.delete(actor.userId);

    for (const userId of recipients) {
      await notificationsService.notify({
        userId,
        requestId,
        type: NotificationType.REQUEST_COMMENT,
        text,
        html: true,
      });
    }

    return comment;
  },

  async listComments(requestId: string, actor: AuthTokenPayload) {
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound("Zayavka topilmadi");
    await this.assertCanView(request, actor);
    return requestsRepository.listComments(requestId);
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

    if (expenseAmount !== undefined && expenseAmount < 0) {
      throw AppError.validation("Harajat summasi manfiy bo'lishi mumkin emas");
    }

    // Harajat summasini endi TEXNIK ham kiritadi. Texnik summani kiritmasa —
    // avtomatik 0 yoziladi. Bosh texnik keyinchalik uni tahrirlashi mumkin
    // (majburiy emas).
    //
    // Summa FAQAT shu ikki o'tishda qabul qilinadi — boshqa o'tishlarda
    // (masalan direktor "qabul qilish" bosganda) yuborilgan qiymat e'tiborga
    // olinmaydi, aks holda tasdiqlangan summani ustidan yozib yuborish mumkin bo'lardi.
    const acceptsExpense =
      nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN ||
      nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN;

    let effectiveExpense = acceptsExpense ? expenseAmount : undefined;
    if (
      effectiveExpense === undefined &&
      nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN &&
      (request.expenseAmount === null || request.expenseAmount === undefined)
    ) {
      effectiveExpense = 0;
    }

    const willAutoClose = shouldAutoClose(nextStatus);

    const updated = await requestsRepository.updateStatus(
      requestId,
      nextStatus as PrismaRequestStatus,
      {
        afterPhotoUrl: afterPhotoUrl ?? request.afterPhotoUrl ?? undefined,
        ...(effectiveExpense !== undefined ? { expenseAmount: effectiveExpense } : {}),
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
      ...(effectiveExpense !== undefined ? { metadata: { expenseAmount: effectiveExpense } } : {}),
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
    // updateMany — oradan biror zayavka o'chirilgan bo'lsa ham xato bermaydi
    // (update esa P2025 bilan yiqilardi).
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.request.updateMany({ where: { id }, data: { sortOrder: index + 1 } })
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

    // Texnik "Ishni boshlash" bosganda mas'ul bosh texnikka xabar boradi.
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
      const expenseLine =
        request.expenseAmount !== null && request.expenseAmount !== undefined
          ? ` Kiritilgan harajat: ${Number(request.expenseAmount).toLocaleString("uz-UZ")} so'm.`
          : "";
      await notificationsService.notify({
        userId: request.chiefTechnicianId,
        requestId: request.id,
        type: NotificationType.TECHNICIAN_COMPLETED,
        text:
          `✅ ${workerName} ishni yakunladi: ${request.branch.name}, "${categoryLabel}".` +
          `${expenseLine} Tekshirib, ishni yakunlashingiz kerak.`,
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

      // Zayavka egasi va mas'ul Bosh texnikka — formatlangan, oldin/keyin rasmlari bilan.
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

      // Rasmlar zayavka yopilgandan keyin ham `MEDIA_RETENTION_DAYS` kun
      // (standart — 7 kun) ilovada ko'rinib turadi, so'ng fon vazifasi
      // (media.cleanup.ts) ularni diskdan va bazadan tozalaydi. Rasmlar
      // Telegram bot chatida esa doimo saqlanib qolaveradi.
      // MEDIA_RETENTION_DAYS=0 bo'lsa — eski xatti-harakat: darhol o'chiriladi.
      if (config.mediaRetentionDays === 0) {
        await this.purgeMedia(request);
      }
    }
  },

  /**
   * Zayavkalar tarixini PDF yoki XLSX faylga eksport qilib, foydalanuvchining
   * Telegram bot chatiga hujjat sifatida yuboradi. Ko'rish doirasi list()
   * bilan bir xil: Direktor/Filial menejeri — o'z filiali, Hududiy rahbar —
   * biriktirilgan filiallari, Texnik — o'z ishlari, Bosh texnik/Rahbar/
   * Superadmin — hammasi.
   */
  async exportHistory(filters: RequestFilters, format: "pdf" | "xlsx", actor: AuthTokenPayload) {
    await this.applyScope(filters, actor);

    const [items] = await requestsRepository.findMany(filters, 0, 2000);
    if (items.length === 0) {
      throw AppError.validation("Eksport uchun zayavkalar topilmadi");
    }

    const rows: ExportRow[] = await buildExportRows(items);

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

  async assertCanView(request: RequestWithRelations, actor: AuthTokenPayload) {
    const scope = await resolveScope(actor);

    if (scope.kind === "all") return;

    if (scope.kind === "technician") {
      if (request.technicianId !== actor.userId) {
        throw AppError.forbidden("Bu zayavka sizga biriktirilmagan");
      }
      return;
    }

    if (!scopeAllowsBranch(scope, request.branchId)) {
      throw AppError.forbidden("Bu zayavka sizning filial(lar)ingizga tegishli emas");
    }
  },

  async assertCanActOnRequest(request: RequestWithRelations, actor: AuthTokenPayload) {
    await this.assertCanView(request, actor);
    if (actor.role === Role.TECHNICIAN && request.technicianId !== actor.userId) {
      throw AppError.forbidden("Bu zayavka sizga biriktirilmagan");
    }
  },
};
