import fs from "fs";
import path from "path";
import { RequestStatus } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { config } from "../../core/config";
import { logger } from "../../core/logger";
import { mediaService } from "./media.service";

/**
 * Media saqlash muddati (retention) vazifasi.
 *
 * Zayavka yopilganda rasmlar DARHOL o'chirilmaydi — ular
 * `MEDIA_RETENTION_DAYS` kun davomida ilovada ko'rinib turadi. Muddat
 * o'tgach fayllar diskdan, URL'lar esa bazadan tozalanadi (rasmlar Telegram
 * bot chatidagi xabarlarda saqlanib qolaveradi).
 *
 * Bu Railway'dagi volume hajmi cheksiz o'sib ketmasligi uchun kerak.
 */

/** Bir martalik ishga tushirishda ko'pi bilan shuncha zayavka tozalanadi. */
const BATCH_SIZE = 500;

/** Yuklangan, lekin zayavkaga biriktirilmagan fayllar shu muddatdan keyin o'chiriladi. */
const ORPHAN_FILE_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Muddati o'tgan (yopilganiga MEDIA_RETENTION_DAYS kundan ko'p bo'lgan)
 * zayavkalarning rasmlarini o'chiradi.
 */
export async function purgeExpiredRequestMedia(): Promise<number> {
  const days = config.mediaRetentionDays;
  if (days < 0) return 0; // -1 — hech qachon o'chirilmaydi

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const expired = await prisma.request.findMany({
    where: {
      status: RequestStatus.CLOSED as any,
      closedAt: { not: null, lte: cutoff },
      OR: [{ beforePhotoUrl: { not: null } }, { afterPhotoUrl: { not: null } }],
    },
    select: { id: true, beforePhotoUrl: true, afterPhotoUrl: true },
    take: BATCH_SIZE,
  });

  if (expired.length === 0) return 0;

  for (const r of expired) {
    mediaService.deleteLocalFileByUrl(r.beforePhotoUrl);
    mediaService.deleteLocalFileByUrl(r.afterPhotoUrl);
  }

  await prisma.request.updateMany({
    where: { id: { in: expired.map((r: { id: string }) => r.id) } },
    data: { beforePhotoUrl: null, afterPhotoUrl: null },
  });

  return expired.length;
}

/**
 * "Yetim" fayllarni o'chiradi: foydalanuvchi rasm yuklab, zayavkani
 * yubormasdan chiqib ketgan holatlar. Faqat 24 soatdan eski va bazada
 * hech qanday zayavkaga bog'lanmagan fayllar o'chiriladi.
 */
export async function purgeOrphanFiles(): Promise<number> {
  if (config.storageDriver !== "local") return 0;

  const dir = path.resolve(process.cwd(), config.localUploadDir);
  if (!fs.existsSync(dir)) return 0;

  const files = await fs.promises.readdir(dir);
  if (files.length === 0) return 0;

  // Bazada ishlatilayotgan barcha fayl nomlari.
  const used = await prisma.request.findMany({
    where: { OR: [{ beforePhotoUrl: { not: null } }, { afterPhotoUrl: { not: null } }] },
    select: { beforePhotoUrl: true, afterPhotoUrl: true },
  });

  const usedNames = new Set<string>();
  for (const r of used) {
    for (const url of [r.beforePhotoUrl, r.afterPhotoUrl]) {
      if (!url) continue;
      const idx = url.indexOf("/uploads/");
      if (idx !== -1) usedNames.add(url.slice(idx + "/uploads/".length));
    }
  }

  const now = Date.now();
  let removed = 0;

  for (const name of files) {
    if (usedNames.has(name)) continue;
    const filePath = path.join(dir, name);
    try {
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) continue;
      // Yaqinda yuklangan fayllarga tegmaymiz — zayavka hali yaratilayotgan bo'lishi mumkin.
      if (now - stat.mtimeMs < ORPHAN_FILE_MIN_AGE_MS) continue;
      await fs.promises.unlink(filePath);
      removed++;
    } catch {
      // Bitta fayl o'chmasa ham davom etamiz.
    }
  }

  return removed;
}

export async function runMediaCleanup(): Promise<void> {
  try {
    const purged = await purgeExpiredRequestMedia();
    const orphans = await purgeOrphanFiles();
    if (purged > 0 || orphans > 0) {
      logger.info(
        { purgedRequests: purged, orphanFiles: orphans },
        "Media tozalash bajarildi"
      );
    }
  } catch (err) {
    // Tozalash muvaffaqiyatsiz bo'lsa ham ilova ishlashda davom etadi.
    logger.warn({ err }, "Media tozalashda xatolik");
  }
}

/**
 * Vazifani ishga tushiradi: startdan 1 daqiqa keyin bir marta, so'ngra
 * belgilangan oraliqda takrorlanadi. To'xtatish uchun qaytgan timer'ni
 * `clearInterval` qiling.
 */
export function startMediaCleanupJob(): NodeJS.Timeout | null {
  if (config.mediaRetentionDays < 0) {
    logger.info("Media tozalash o'chirilgan (MEDIA_RETENTION_DAYS=-1)");
    return null;
  }

  const intervalMs = Math.max(config.mediaCleanupIntervalMinutes, 5) * 60 * 1000;

  // Startda darhol emas — server ko'tarilib bo'lishiga imkon beramiz.
  setTimeout(() => void runMediaCleanup(), 60 * 1000).unref?.();

  const timer = setInterval(() => void runMediaCleanup(), intervalMs);
  logger.info(
    `Media tozalash yoqildi: yopilgandan ${config.mediaRetentionDays} kun keyin, ` +
      `har ${config.mediaCleanupIntervalMinutes} daqiqada tekshiriladi`
  );
  return timer;
}
