import { config } from "../../core/config";
import { logger } from "../../core/logger";
import { ReportType, resolvePeriod } from "./reports.period";
import { sendReportsForPeriod } from "./reports.service";

/**
 * Avtomatik hisobot rejalashtiruvchisi.
 *
 * Klassik cron o'rniga "yetib olish" (catch-up) usuli ishlatiladi: har
 * `REPORT_CHECK_INTERVAL_MINUTES` daqiqada oxirgi o'tib ketgan davr
 * hisoblanadi va u hali yuborilmagan bo'lsa — yuboriladi.
 *
 * Nega shunday: Railway'da servis uxlab qolishi (App Sleeping), qayta
 * deploy bo'lishi yoki restart bo'lishi mumkin. Oddiy cron o'sha
 * lahzada server ishlamasa hisobotni butunlay o'tkazib yuborardi;
 * bu usulda esa server uyg'onishi bilan hisobot yetkaziladi.
 *
 * Takroriy yuborilmasligi audit_logs jadvali orqali kafolatlanadi
 * (har bir foydalanuvchi + davr uchun bitta yozuv).
 */

const TYPES: ReportType[] = ["weekly", "monthly"];

export async function runScheduledReports(now: Date = new Date()): Promise<void> {
  if (!config.reportsEnabled) return;

  for (const type of TYPES) {
    try {
      const period = resolvePeriod(type, now);

      // Trigger hali kelmagan bo'lsa (resolvePeriod har doim o'tgan davrni
      // qaytaradi, shuning uchun bu deyarli bo'lmaydi) — o'tkazamiz.
      const ageHours = (now.getTime() - period.triggerAt.getTime()) / 3_600_000;
      if (ageHours < 0) continue;

      // Juda eski davrni yubormaymiz (uzoq to'xtab qolgandan keyin eski
      // hisobotlar to'planib kelmasligi uchun).
      if (ageHours > config.reportMaxCatchupHours) continue;

      const result = await sendReportsForPeriod(period);
      if (result.sent > 0 || result.empty > 0 || result.failed > 0) {
        logger.info({ type, ...result }, "Avtomatik hisobot yuborildi");
      }
    } catch (err) {
      logger.warn({ err, type }, "Avtomatik hisobotni yuborishda xatolik");
    }
  }
}

export function startReportScheduler(): NodeJS.Timeout | null {
  if (!config.reportsEnabled) {
    logger.info("Avtomatik hisobotlar o'chirilgan (REPORTS_ENABLED=false)");
    return null;
  }

  const intervalMs = Math.max(config.reportCheckIntervalMinutes, 1) * 60 * 1000;

  // Startdan 2 daqiqa keyin birinchi tekshiruv (server to'liq ko'tarilsin).
  setTimeout(() => void runScheduledReports(), 2 * 60 * 1000).unref?.();

  const timer = setInterval(() => void runScheduledReports(), intervalMs);

  logger.info(
    `Avtomatik hisobotlar yoqildi: haftalik — dushanba ${config.reportWeeklyHour}:00, ` +
      `oylik — oyning oxirgi kuni ${config.reportMonthlyHour}:00 ` +
      `(UTC+${config.reportTzOffsetMinutes / 60}); har ${config.reportCheckIntervalMinutes} daqiqada tekshiriladi`
  );

  return timer;
}
