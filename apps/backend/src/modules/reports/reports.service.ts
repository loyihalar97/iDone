import { RequestStatus, Role, ROLE_LABELS_UZ } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { logger } from "../../core/logger";
import { resolveScope } from "../../core/access/scope";
import { buildPdf } from "../requests/requests.export";
import { buildExportRows } from "../requests/requests.service";
import { requestsRepository, RequestFilters } from "../requests/requests.repository";
import { notificationsService } from "../notifications/notifications.service";
import { auditLogService } from "../audit-log/audit-log.service";
import { ReportPeriod, ReportType } from "./reports.period";

/**
 * Avtomatik haftalik va oylik hisobotlar.
 *
 * Kimlar oladi: **Superadmin**, **Filial direktori**, **Hududiy rahbar**.
 * Har biri o'zining ko'rish doirasidagi ma'lumotni oladi:
 *   - Superadmin      — barcha filiallar
 *   - Hududiy rahbar  — o'ziga biriktirilgan filiallar
 *   - Filial direktori — o'z filiali
 *
 * Hisobot PDF fayl sifatida foydalanuvchining Telegram bot chatiga yuboriladi.
 * Davrda zayavka bo'lmasa — PDF o'rniga qisqa matnli xabar boradi.
 */

export const REPORT_RECIPIENT_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.DIRECTOR,
  Role.REGIONAL_MANAGER,
];

const TITLES: Record<ReportType, string> = {
  weekly: "Haftalik hisobot",
  monthly: "Oylik hisobot",
};

const AUDIT_ACTIONS: Record<ReportType, string> = {
  weekly: "weekly_report_sent",
  monthly: "monthly_report_sent",
};

interface Recipient {
  id: string;
  fullName: string;
  role: Role;
}

function formatSum(value: number): string {
  return value.toLocaleString("uz-UZ");
}

/** Foydalanuvchining ko'rish doirasini matn bilan tasvirlaydi (PDF sarlavhasi uchun). */
async function describeScope(user: Recipient): Promise<string> {
  if (user.role === Role.SUPERADMIN) return "Barcha filiallar";

  if (user.role === Role.REGIONAL_MANAGER) {
    const rows = await prisma.userBranch.findMany({
      where: { userId: user.id },
      include: { branch: { select: { name: true } } },
    });
    const names = rows.map((r: { branch: { name: string } }) => r.branch.name);
    return names.length > 0 ? names.join(", ") : "Filial biriktirilmagan";
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { branch: { select: { name: true } } },
  });
  return dbUser?.branch?.name ?? "Filial biriktirilmagan";
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

  const [items] = await requestsRepository.findMany(filters, 0, 2000);

  const title = TITLES[period.type];
  const scopeLabel = await describeScope(user);

  if (items.length === 0) {
    // Bo'sh davr — PDF o'rniga qisqa matn.
    await notificationsService.sendTextToUser(
      user.id,
      `📊 <b>${title}</b>\n` +
        `📅 Davr: ${period.label}\n` +
        `🏢 ${scopeLabel}\n\n` +
        `Bu davrda birorta ham zayavka ochilmagan.`,
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

  const rows = await buildExportRows(items);
  const subtitle = `Davr: ${period.label}  ·  ${scopeLabel}`;
  const file = await buildPdf(rows, title, subtitle);

  const filename = `${period.key}.pdf`;
  const caption =
    `📊 <b>${title}</b>\n` +
    `📅 Davr: ${period.label}\n` +
    `🏢 ${scopeLabel}\n\n` +
    `📄 Jami: <b>${items.length}</b> ta zayavka\n` +
    `✅ Yopilgan: <b>${closed}</b> · ⏳ Ochiq: <b>${items.length - closed}</b>\n` +
    `💵 Umumiy harajat: <b>${formatSum(totalExpense)}</b> so'm`;

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

/** Davr bo'yicha barcha tegishli foydalanuvchilarga hisobot yuboradi. */
export async function sendReportsForPeriod(
  period: ReportPeriod,
  opts: { force?: boolean } = {}
): Promise<ReportRunResult> {
  const recipients: Recipient[] = await prisma.user.findMany({
    where: { isActive: true, role: { in: REPORT_RECIPIENT_ROLES as any } },
    select: { id: true, fullName: true, role: true },
  });

  const result: ReportRunResult = { period: period.key, sent: 0, empty: 0, skipped: 0, failed: 0 };

  for (const user of recipients) {
    try {
      const outcome = await sendReportToUser(user, period, opts);
      result[outcome === "failed" ? "failed" : outcome] += 1;
    } catch (err) {
      result.failed += 1;
      // Bitta foydalanuvchiga yuborib bo'lmasa (botni bloklagan, /start bosmagan
      // va h.k.) qolganlariga yuborish davom etadi.
      logger.warn(
        { err, userId: user.id, role: ROLE_LABELS_UZ[user.role], period: period.key },
        "Hisobotni yuborib bo'lmadi"
      );
    }
  }

  return result;
}
