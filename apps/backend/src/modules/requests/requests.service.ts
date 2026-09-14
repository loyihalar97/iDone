import {
  Language,
  NotificationType,
  Priority,
  priorityLabel,
  REQUEST_CREATOR_ROLES,
  RequestStatus,
  Role,
  roleLabel,
  statusLabel,
} from "@app/shared-types";
import { RequestStatus as PrismaRequestStatus } from "@prisma/client";
import { AppError } from "../../core/errors/AppError";
import { config } from "../../core/config";
import { logger } from "../../core/logger";
import { prisma } from "../../core/database/prisma";
import { requestsRepository, RequestFilters } from "./requests.repository";
import { assertValidTransition, shouldAutoClose } from "./requests.state-machine";
import { buildPdf, buildXlsx, ExportRow } from "./requests.export";
import { auditLogService } from "../audit-log/audit-log.service";
import { categoriesService, pickCategoryLabel } from "../categories/categories.service";
import { notificationsService, getUserLanguage } from "../notifications/notifications.service";
import { mediaService } from "../media/media.service";
import { resolveCreateBranchId, resolveScope, scopeAllowsBranch } from "../../core/access/scope";
import type { AuthTokenPayload } from "../auth/auth.service";
import { DEFAULT_LANGUAGE, formatNumber, tx } from "../../core/i18n";
import { t } from "../../core/i18n/messages";

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
 * Kategoriya nomini istalgan tilda qaytaradigan funksiya tayyorlaydi.
 *
 * Bildirishnoma matni har bir qabul qiluvchining tilida quriladi, lekin
 * matn quruvchi funksiya sinxron bo'lishi kerak — shuning uchun kategoriya
 * nomlarini oldindan (bir marta) bazadan olamiz.
 */
async function categoryLabeller(): Promise<(key: string, lang: Language) => string> {
  const rows = await categoriesService.getRows();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return (key, lang) => {
    const row = byKey.get(key);
    return row ? pickCategoryLabel(row, lang) : key;
  };
}

/**
 * Zayavkalarni eksport (PDF/XLSX) qatorlariga aylantiradi. Qo'l bilan
 * eksport qilishda ham, avtomatik haftalik/oylik hisobotlarda ham
 * ishlatiladi — ustunlar bir xil bo'lishi uchun.
 *
 * `lang` — hisobotni oladigan foydalanuvchining tili: kategoriya nomlari
 * shu tilda olinadi, holat/muhimlik/lavozim nomlarini esa eksport moduli
 * o'zi tarjima qiladi.
 */
export async function buildExportRows(
  items: RequestWithRelations[],
  lang: Language = DEFAULT_LANGUAGE
): Promise<ExportRow[]> {
  const labelFor = await categoryLabeller();

  return items.map((r) => ({
    createdAt: r.createdAt,
    closedAt: r.closedAt,
    branchName: r.branch.name,
    categoryLabel: labelFor(r.category, lang),
    description: r.description,
    priority: r.priority,
    status: r.status,
    createdByName: r.createdBy.fullName,
    createdByRole: r.createdBy.role,
    chiefTechnicianName: r.chiefTechnician?.fullName ?? null,
    technicianName: r.technician?.fullName ?? null,
    expenseAmount: r.expenseAmount,
    comment: r.comments?.[0]?.text ?? null,
  }));
}

/**
 * Zayavka haqida Telegram'ga (HTML formatida) yuboriladigan chiroyli
 * "karta" matnini quradi — ochilganda va yopilganda ishlatiladi.
 * Matn qabul qiluvchining tilida tuziladi.
 */
function buildRequestCardHtml(
  request: RequestWithRelations,
  kind: "created" | "closed",
  lang: Language,
  categoryLabelText: string
): string {
  const c = t(lang).notify.card;
  const title = kind === "created" ? c.newRequest : c.closedRequest;

  const lines = [
    `<b>${title}</b>`,
    ``,
    `🏢 <b>${c.branch}:</b> ${escapeHtml(request.branch.name)}`,
    `📂 <b>${c.category}:</b> ${escapeHtml(categoryLabelText)}`,
    `⚠️ <b>${c.priority}:</b> ${priorityLabel(request.priority as Priority, lang)}`,
    `📝 <b>${c.description}:</b> ${escapeHtml(request.description)}`,
    `👤 <b>${c.createdBy}:</b> ${escapeHtml(request.createdBy.fullName)}` +
      ` (${roleLabel(request.createdBy.role as Role, lang)})`,
  ];
  if (request.chiefTechnician) {
    lines.push(`🧑‍🔧 <b>${c.chiefTechnician}:</b> ${escapeHtml(request.chiefTechnician.fullName)}`);
  }
  if (request.technician) {
    lines.push(`🔧 <b>${c.technician}:</b> ${escapeHtml(request.technician.fullName)}`);
  }
  if (request.expenseAmount !== null && request.expenseAmount !== undefined) {
    lines.push(
      `💵 <b>${c.expense}:</b> ${formatNumber(Number(request.expenseAmount), lang)} ${t(lang).currency}`
    );
  }
  lines.push(`📌 <b>${c.status}:</b> ${statusLabel(request.status as RequestStatus, lang)}`);
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
      throw AppError.forbidden(tx("Sizning lavozimingiz zayavka ocha olmaydi", "Ваша должность не позволяет создавать заявки"));
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
    // formatlangan, rasmli xabar yuboriladi — har biriga O'Z TILIDA.
    const labelFor = await categoryLabeller();
    const openCardText = (lang: Language) =>
      buildRequestCardHtml(request, "created", lang, labelFor(request.category, lang));
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
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));
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
      throw AppError.forbidden(tx("Faqat Bosh texnik texnik biriktira oladi", "Назначить техника может только главный техник"));
    }
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));
    if (request.status === RequestStatus.CLOSED) {
      throw AppError.conflict(tx("Yopilgan zayavkaga texnik biriktirib bo'lmaydi", "К закрытой заявке нельзя назначить техника"));
    }

    const technician = await prisma.user.findUnique({ where: { id: technicianId } });
    // Bosh texnik ishni O'ZIGA ham biriktira oladi, shuning uchun bosh
    // texnik rolidagi xodim ham qabul qilinadi.
    if (
      !technician ||
      (technician.role !== Role.TECHNICIAN && technician.role !== Role.CHIEF_TECHNICIAN)
    ) {
      throw AppError.validation(tx("Ko'rsatilgan foydalanuvchi texnik emas", "Указанный пользователь не является техником"));
    }
    if (!technician.isActive) {
      throw AppError.validation(tx("Bu xodim nofaol — unga ish biriktirib bo'lmaydi", "Этот сотрудник неактивен — назначить ему работу нельзя"));
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

    const labelFor = await categoryLabeller();

    // Yangi texnikka xabar (o'ziga biriktirgan bo'lsa xabar yuborilmaydi).
    if (technicianId !== actor.userId) {
      await notificationsService.notify({
        userId: technicianId,
        requestId,
        type: NotificationType.TECHNICIAN_ASSIGNED,
        text: (lang) =>
          t(lang).notify.assigned(updated.branch.name, labelFor(updated.category, lang)),
      });
    }

    // Ish boshqa texnikdan olib qo'yilgan bo'lsa — eski texnikka ham xabar.
    if (previousTechnicianId && previousTechnicianId !== technicianId) {
      await notificationsService.notify({
        userId: previousTechnicianId,
        requestId,
        type: NotificationType.TECHNICIAN_ASSIGNED,
        text: (lang) =>
          t(lang).notify.reassigned(updated.branch.name, labelFor(updated.category, lang)),
      });
    }

    return updated;
  },

  /**
   * Muhimlik darajasini o'zgartiradi — faqat Bosh texnik (va Superadmin).
   */
  async changePriority(requestId: string, priority: Priority, actor: AuthTokenPayload) {
    if (actor.role !== Role.CHIEF_TECHNICIAN && actor.role !== Role.SUPERADMIN) {
      throw AppError.forbidden(tx("Muhimlik darajasini faqat Bosh texnik o'zgartira oladi", "Изменить уровень важности может только главный техник"));
    }
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));
    if (request.status === RequestStatus.CLOSED) {
      throw AppError.conflict(tx("Yopilgan zayavkaning muhimligini o'zgartirib bo'lmaydi", "Нельзя изменить важность закрытой заявки"));
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

    const labelFor = await categoryLabeller();
    const text = (lang: Language) => {
      const m = t(lang).notify.priorityChanged;
      return (
        `⚠️ <b>${m.title}</b>\n\n` +
        `🏢 <b>${m.branch}:</b> ${escapeHtml(updated.branch.name)}\n` +
        `📂 <b>${m.category}:</b> ${escapeHtml(labelFor(updated.category, lang))}\n` +
        `🔁 <b>${m.change}:</b> ${priorityLabel(previous, lang)} → ${priorityLabel(priority, lang)}`
      );
    };

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
      throw AppError.forbidden(tx("Izohni faqat Bosh texnik yoza oladi", "Оставить комментарий может только главный техник"));
    }
    const request = await requestsRepository.findById(requestId);
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));

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

    const labelFor = await categoryLabeller();
    const author = await prisma.user.findUnique({ where: { id: actor.userId } });

    const text = (lang: Language) => {
      const m = t(lang).notify.comment;
      const title = isBlocker ? m.blockerTitle : m.plainTitle;
      return (
        `<b>${title}</b>\n\n` +
        `🏢 <b>${m.branch}:</b> ${escapeHtml(request.branch.name)}\n` +
        `📂 <b>${m.category}:</b> ${escapeHtml(labelFor(request.category, lang))}\n` +
        `📝 <b>${m.request}:</b> ${escapeHtml(request.description)}\n` +
        `🧑‍🔧 <b>${m.author}:</b> ${escapeHtml(author?.fullName ?? "—")}\n\n` +
        `❗️ <b>${m.text}:</b> ${escapeHtml(input.text)}`
      );
    };

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
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));
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
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));

    await this.assertCanActOnRequest(request, actor);

    assertValidTransition(request.status as RequestStatus, nextStatus, actor.role);

    // Texnik ishni yakunlashda natija rasmi majburiy.
    if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN && !afterPhotoUrl && !request.afterPhotoUrl) {
      throw AppError.validation(tx("Ish yakunlangandan keyingi natija rasmi majburiy", "Фото результата после завершения работы обязательно"));
    }

    if (expenseAmount !== undefined && expenseAmount < 0) {
      throw AppError.validation(tx("Harajat summasi manfiy bo'lishi mumkin emas", "Сумма расходов не может быть отрицательной"));
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
      throw AppError.forbidden(tx("Faqat Bosh texnik zayavkalarni tartiblashi mumkin", "Сортировать заявки может только главный техник"));
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

    const labelFor = await categoryLabeller();

    // Texnik "Ishni boshlash" bosganda mas'ul bosh texnikka xabar boradi.
    if (
      nextStatus === RequestStatus.IN_PROGRESS &&
      request.chiefTechnicianId &&
      request.chiefTechnicianId !== actor?.userId
    ) {
      await notificationsService.notify({
        userId: request.chiefTechnicianId,
        requestId: request.id,
        type: NotificationType.TECHNICIAN_STARTED,
        text: (lang) =>
          t(lang).notify.started(
            request.technician?.fullName ?? t(lang).notify.someTechnician,
            request.branch.name,
            labelFor(request.category, lang)
          ),
      });
    }

    if (
      nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN &&
      request.chiefTechnicianId &&
      request.chiefTechnicianId !== actor?.userId
    ) {
      await notificationsService.notify({
        userId: request.chiefTechnicianId,
        requestId: request.id,
        type: NotificationType.TECHNICIAN_COMPLETED,
        text: (lang) =>
          t(lang).notify.completed(
            request.technician?.fullName ?? t(lang).notify.someTechnician,
            request.branch.name,
            labelFor(request.category, lang),
            request.expenseAmount !== null && request.expenseAmount !== undefined
              ? formatNumber(Number(request.expenseAmount), lang)
              : null
          ),
      });
    }

    if (nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN) {
      await notificationsService.notify({
        userId: request.createdById,
        requestId: request.id,
        type: NotificationType.CHIEF_APPROVED,
        text: (lang) =>
          t(lang).notify.chiefApproved(request.branch.name, labelFor(request.category, lang)),
      });
    }

    if (nextStatus === RequestStatus.ACCEPTED_BY_DIRECTOR) {
      const closeCardText = (lang: Language) =>
        buildRequestCardHtml(request, "closed", lang, labelFor(request.category, lang));
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
          text: (lang) =>
            t(lang).notify.closedForTechnician(
              request.branch.name,
              labelFor(request.category, lang)
            ),
        });
      }

      // Rasmlarni tozalash. STANDART holatda (MEDIA_RETENTION_DAYS=0) rasmlar
      // zayavka YOPILGAN ZAHOTI diskdan ham, bazadan ham o'chiriladi — bu
      // Railway disk hajmi va trafik xarajatini minimal ushlab turadi.
      //
      // Muhim: yuqoridagi "zayavka yopildi" kartasi `awaitDelivery: true`
      // bilan yuborilgan — ya'ni Telegram rasmlarni O'Z SERVERIGA yuklab
      // bo'lgan. Shu sababli fayllarni endi xavfsiz o'chirsa bo'ladi:
      // bot chatidagi xabarlarda rasmlar doimo ko'rinib turaveradi.
      //
      // MEDIA_RETENTION_DAYS > 0 bo'lsa, rasmlar shuncha kun ilovada
      // ko'rinadi va keyin fon vazifasi (media.cleanup.ts) tozalaydi.
      if (config.mediaRetentionDays === 0) {
        try {
          await this.purgeMedia(request);
        } catch (err) {
          // Tozalash muvaffaqiyatsiz bo'lsa ham zayavka yopilgan holicha
          // qoladi — fon vazifasi keyinroq baribir tozalaydi.
          logger.warn({ err, requestId: request.id }, "Rasmlarni o'chirib bo'lmadi");
        }
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

    // Eksportda izoh ustuni bor — izohlar matni bilan tortamiz.
    const [items] = await requestsRepository.findMany(filters, 0, 2000, { fullComments: true });
    if (items.length === 0) {
      throw AppError.validation(tx("Eksport uchun zayavkalar topilmadi", "Заявки для экспорта не найдены"));
    }

    // Hisobot eksportni so'ragan foydalanuvchining tilida tayyorlanadi.
    const lang = await getUserLanguage(actor.userId);
    const messages = t(lang);
    const rows: ExportRow[] = await buildExportRows(items, lang);

    const stamp = new Date().toISOString().slice(0, 10);
    const title = messages.export.historyTitle;
    const file =
      format === "xlsx"
        ? await buildXlsx(rows, lang)
        : await buildPdf(rows, title, lang);
    const filename = `${messages.export.fileBaseName}-${stamp}.${format}`;
    const mime =
      format === "xlsx"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    await notificationsService.sendDocumentToUser(
      actor.userId,
      file,
      filename,
      mime,
      messages.export.caption(items.length, format.toUpperCase())
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
      throw AppError.forbidden(tx("Faqat superadmin zayavkani o'chira oladi", "Удалить заявку может только суперадмин"));
    }
    const request = await requestsRepository.findById(id);
    if (!request) throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));

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
        throw AppError.forbidden(tx("Bu zayavka sizga biriktirilmagan", "Эта заявка вам не назначена"));
      }
      return;
    }

    if (!scopeAllowsBranch(scope, request.branchId)) {
      throw AppError.forbidden(tx("Bu zayavka sizning filial(lar)ingizga tegishli emas", "Эта заявка не относится к вашему филиалу"));
    }
  },

  async assertCanActOnRequest(request: RequestWithRelations, actor: AuthTokenPayload) {
    await this.assertCanView(request, actor);
    if (actor.role === Role.TECHNICIAN && request.technicianId !== actor.userId) {
      throw AppError.forbidden(tx("Bu zayavka sizga biriktirilmagan", "Эта заявка вам не назначена"));
    }
  },
};
