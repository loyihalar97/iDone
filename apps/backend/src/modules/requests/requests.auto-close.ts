import { config } from "../../core/config";
import { logger } from "../../core/logger";
import { requestsService } from "./requests.service";

/**
 * Muddati o'tgan zayavkalarni avtomatik yopish rejalashtiruvchisi.
 *
 * Bosh texnik ishni tasdiqlagandan (APPROVED_BY_CHIEF_TECHNICIAN) so'ng
 * `REQUEST_AUTO_CLOSE_DAYS` kun ichida mas'ul rahbar (odatda Direktor) uni
 * qabul qilib yopmasa, tizim zayavkani o'zi yopadi va Direktorga bot orqali
 * xabar yuboradi.
 *
 * media.cleanup.ts va reports.scheduler.ts kabi oddiy `setInterval` asosida
 * ishlaydi — Railway'da alohida cron infratuzilmasi shart emas.
 */

export async function runAutoCloseCheck(now: Date = new Date()): Promise<void> {
  try {
    await requestsService.autoCloseOverdue(now);
  } catch (err) {
    logger.warn({ err }, "Avtomatik yopish tekshiruvida xatolik");
  }
}

export function startAutoCloseScheduler(): NodeJS.Timeout | null {
  if (!config.requestAutoCloseEnabled || config.requestAutoCloseDays < 0) {
    logger.info(
      "Zayavkalarni avtomatik yopish o'chirilgan (REQUEST_AUTO_CLOSE_ENABLED=false yoki REQUEST_AUTO_CLOSE_DAYS=-1)"
    );
    return null;
  }

  const intervalMs = Math.max(config.requestAutoCloseCheckIntervalMinutes, 1) * 60 * 1000;

  // Startdan 3 daqiqa keyin birinchi tekshiruv (server to'liq ko'tarilsin).
  setTimeout(() => void runAutoCloseCheck(), 3 * 60 * 1000).unref?.();

  const timer = setInterval(() => void runAutoCloseCheck(), intervalMs);

  logger.info(
    `Zayavkalarni avtomatik yopish yoqildi: Bosh texnik tasdiqlagandan ${config.requestAutoCloseDays} ` +
      `kun o'tsa-yu, hali qabul qilinmagan bo'lsa — avtomatik yopiladi ` +
      `(har ${config.requestAutoCloseCheckIntervalMinutes} daqiqada tekshiriladi)`
  );

  return timer;
}
