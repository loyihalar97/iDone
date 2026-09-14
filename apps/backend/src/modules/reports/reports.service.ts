import { Language, RequestStatus, Role, roleLabel } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { logger } from "../../core/logger";
import { resolveScope } from "../../core/access/scope";
import { buildPdf } from "../requests/requests.export";
import { buildExportRows } from "../requests/requests.service";
import { requestsRepository, RequestFilters } from "../requests/requests.repository";
import { notificationsService } from "../notifications/notifications.service";
import { auditLogService } from "../audit-log/audit-log.service";
import { ReportPeriod, ReportType } from "./reports.period";
import { DEFAULT_LANGUAGE, formatNumber, userLanguage } from "../../core/i18n";
import { t } from "../../core/i18n/messages";

/**
 * Avtomatik haftalik va oylik hisobotlar.
 *
 * Kimlar oladi: **Superadmin**, **Filial direktori**, **Hududiy rahbar**.
 * Har biri o'zining ko'rish doirasidagi ma'lumotni oladi:
 *   - Superadmin      — barcha filiallar
 *   - Hududiy rahbar  — o'ziga biriktirilgan filiallar
 *   - Filial direktori — o'z filiali
 *
 * Hisobot PDF fayl sifatida foydalanuvchining Telegram bot chatiga yuboriladi
 * va HAR BIR XODIM UCHUN O'ZI TANLAGAN TILDA tayyorlanadi (PDF ustunlari,
 * holat nomlari, sana formati va xabar matni).
 * Davrda zayavka bo'lmasa — PDF o'rniga qisqa matnli xabar boradi.
 */

export const REPORT_RECIPIENT_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.DIRECTOR,
  Role.REGIONAL_MANAGER,
];

const AUDIT_ACTIONS: Record<ReportType, string> = {
  weekly: "weekly_report_sent",
  monthly: "monthly_report_sent",
};

/** Hisobot sarlavhasi tanlangan tilda. */
function reportTitle(type: ReportType, lang: Language): string {
  return type === "weekly" ? t(lang).report.weeklyTitle : t(lang).report.monthlyTitle;
}

interface Recipient {
  id: string;
  fullName: string;
  role: Role;
  /** Tanlangan til (bazadan). null bo'lsa — o'zbekcha. */
  language?: string | null;
}

/** Foydalanuvchining ko'rish doirasini matn bilan tasvirlaydi (PDF sarlavhasi uchun). */
async function describeScope(user: Recipient, lang: Language): Promise<string> {
  const messages = t(lang).report;

  if (user.role === Role.SUPERADMIN) return messages.allBranches;

  if (user.role === Role.REGIONAL_MANAGER) {
    const rows = await prisma.userBranch.findMany({
      where: { userId: user.id },
      include: { branch: { select: { name: true } } },
    });
    const names = rows.map((r: { branch: { name: string } }) => r.branch.name);
    return names.length > 0 ? names.join(", ") : messages.noBranch;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { branch: { select: { name: true } } },
  });
  return dbUser?.branch?.name ?? messages.noBranch;
}

/** Shu davr uchun shu foydalanuvchiga hisobot allaqachon yuborilganmi? */
async function alreadySent(period: ReportPeriod, userId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      entityType: "report",
      entityId: period.key,
      action: AUDIT_ACTIONS[period.type],
      performedById: userId,
    },
    select: { id: true },
  });
  return !!existing;
}

/**
 * Bitta foydalanuvchiga hisobot tayyorlab yuboradi.
 * `force = true` bo'lsa, oldin yuborilgan-yuborilmagani tekshirilmaydi
 * (qo'lda ishga tushirish uchun).
 */
export async function sendReportToUser(
  user: Recipient,
  period: ReportPeriod,
  opts: { force?: boolean } = {}
): Promise<"sent" | "empty" | "skipped" | "failed"> {
  if (!opts.force && (await alreadySent(period, user.id))) return "skipped";

  const scope = await resolveScope({ userId: user.id, role: user.role });

  // Filial biriktirilmagan direktor/hududiy rahbarga yuboradigan narsa yo'q.
  if (scope.kind === "branches" && scope.branchIds.length === 0) return "skipped";

  const filters: RequestFilters = {
    dateFrom: period.start,
    dateTo: period.end,
    ...(scope.kind === "branches" ? { branchIds: scope.branchIds } : {}),
  };

  // Hisobotda izoh ustuni bor — izohlar matni bilan tortamiz.
  const [items] = await requestsRepository.findMany(filters, 0, 2000, { fullComments: true });

  // Hisobot foydalanuvchi tanlagan tilda tayyorlanadi.
  const lang = userLanguage(user.language);
  const messages = t(lang).report;
  const title = reportTitle(period.type, lang);
  const periodLabel = period.labelIn(lang);
  const scopeLabel = await describeScope(user, lang);

  if (items.length === 0) {
    // Bo'sh davr — PDF o'rniga qisqa matn.
    await notificationsService.sendTextToUser(
      user.id,
      messages.emptyText(title, periodLabel, scopeLabel),
      { html: true }
    );
    await logSent(period, user.id, 0);
    return "empty";
  }

  const closed = items.filter(
    (r: { status: string }) => r.status === RequestStatus.CLOSED
  ).length;
  const totalExpense = items.reduce(
    (sum: number, r: { expenseAmount: number | null }) => sum + (r.expenseAmount ?? 0),
    0
  );

  const rows = await buildExportRows(items, lang);
  const subtitle = messages.subtitle(periodLabel, scopeLabel);
  const file = await buildPdf(rows, title, lang, subtitle);

  const filename = `${period.key}.pdf`;
  const caption = messages.caption({
    title,
    period: periodLabel,
    scope: scopeLabel,
    total: items.length,
    closed,
    open: items.length - closed,
    expense: formatNumber(totalExpense, lang),
  });

  await notificationsService.sendDocumentToUser(
    user.id,
    file,
    filename,
    "application/pdf",
    caption,
    { html: true }
  );

  await logSent(period, user.id, items.length);
  return "sent";
}

async function logSent(period: ReportPeriod, userId: string, count: number) {
  await auditLogService.log({
    entityType: "report",
    entityId: period.key,
    action: AUDIT_ACTIONS[period.type],
    performedById: userId,
    metadata: { count, periodStart: period.start.toISOString(), periodEnd: period.end.toISOString() },
  });
}

export interface ReportRunResult {
  period: string;
  sent: number;
  empty: number;
  skipped: number;
  failed: number;
}

/**
 * Shu davrda hisobot allaqachon yuborilgan foydalanuvchilar ID'lari.
 *
 * Ilgari har bir foydalanuvchi uchun alohida so'rov ketardi va
 * rejalashtiruvchi har safar (davr tugagandan keyin 3 kun davomida, har
 * necha daqiqada) o'nlab keraksiz so'rov qilardi. Endi bitta so'rov bilan
 * olamiz va hammasi yuborilgan bo'lsa umuman ishlamaymiz.
 */
async function alreadySentUserIds(period: ReportPeriod): Promise<Set<string>> {
  const rows = await prisma.auditLog.findMany({
    where: {
      entityType: "report",
      entityId: period.key,
      action: AUDIT_ACTIONS[period.type],
    },
    select: { performedById: true },
  });
  return new Set(rows.map((r: { performedById: string }) => r.performedById));
}

/** Davr bo'yicha barcha tegishli foydalanuvchilarga hisobot yuboradi. */
export async function sendReportsForPeriod(
  period: ReportPeriod,
  opts: { force?: boolean } = {}
): Promise<ReportRunResult> {
  const recipients: Recipient[] = await prisma.user.findMany({
    where: { isActive: true, role: { in: REPORT_RECIPIENT_ROLES as any } },
    select: { id: true, fullName: true, role: true, language: true },
  });

  const result: ReportRunResult = { period: period.key, sent: 0, empty: 0, skipped: 0, failed: 0 };

  // Bitta so'rov bilan kim allaqachon olganini aniqlaymiz. Hammasi olgan
  // bo'lsa — hech narsa qilmasdan qaytamiz (rejalashtiruvchi davr tugagandan
  // keyin ham bir necha kun ishlashda davom etadi).
  const alreadyDone = opts.force ? new Set<string>() : await alreadySentUserIds(period);
  if (!opts.force && recipients.every((u) => alreadyDone.has(u.id))) {
    result.skipped = recipients.length;
    return result;
  }

  for (const user of recipients) {
    if (!opts.force && alreadyDone.has(user.id)) {
      result.skipped += 1;
      continue;
    }
    try {
      const outcome = await sendReportToUser(user, period, opts);
      result[outcome === "failed" ? "failed" : outcome] += 1;
    } catch (err) {
      result.failed += 1;
      // Bitta foydalanuvchiga yuborib bo'lmasa (botni bloklagan, /start bosmagan
      // va h.k.) qolganlariga yuborish davom etadi.
      logger.warn(
        {
          err,
          userId: user.id,
          role: roleLabel(user.role, DEFAULT_LANGUAGE),
          period: period.key,
        },
        "Hisobotni yuborib bo'lmadi"
      );
    }
  }

  return result;
}
