import { Router } from "express";
import { z } from "zod";
import { Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { AppError } from "../../core/errors/AppError";
import { prisma } from "../../core/database/prisma";
import { resolvePeriod } from "./reports.period";
import { sendReportToUser, sendReportsForPeriod } from "./reports.service";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

const typeSchema = z.object({
  type: z.enum(["weekly", "monthly"]),
  /**
   * true bo'lsa, avval yuborilgan bo'lsa ham qayta yuboriladi.
   * DIQQAT: z.coerce.boolean() ishlatilmaydi — u "false" satrini ham `true`
   * deb hisoblaydi (JS truthiness).
   */
  force: z
    .preprocess(
      (v) => (v === undefined ? undefined : v === true || v === "true" || v === "1"),
      z.boolean().optional()
    )
    .optional(),
});

/**
 * Joriy davr ma'lumotini ko'rish (qachondan qachongacha, qaysi kalit bilan).
 * Sozlamani tekshirish uchun qulay.
 */
reportsRouter.get(
  "/period",
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const { type } = typeSchema.parse(req.query);
    const period = resolvePeriod(type);
    res.json({
      type: period.type,
      key: period.key,
      label: period.label,
      start: period.start,
      end: period.end,
      triggerAt: period.triggerAt,
    });
  })
);

/**
 * Hisobotni QO'LDA ishga tushirish — barcha tegishli foydalanuvchilarga.
 * Faqat Superadmin. Sinov uchun: `POST /api/reports/run?type=weekly&force=true`.
 */
reportsRouter.post(
  "/run",
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const { type, force } = typeSchema.parse({ ...req.query, ...req.body });
    const period = resolvePeriod(type);
    res.json(await sendReportsForPeriod(period, { force: force ?? true }));
  })
);

/**
 * Hisobotni FAQAT o'ziga yuborish (sinov uchun eng xavfsiz yo'l — boshqa
 * xodimlarning chatiga xabar bormaydi).
 */
reportsRouter.post(
  "/run/me",
  requireRole(Role.SUPERADMIN, Role.DIRECTOR, Role.REGIONAL_MANAGER),
  asyncHandler(async (req, res) => {
    const { type } = typeSchema.parse({ ...req.query, ...req.body });
    const period = resolvePeriod(type);

    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: { id: true, fullName: true, role: true },
    });
    if (!user) throw AppError.notFound("Foydalanuvchi topilmadi");

    const outcome = await sendReportToUser(user as any, period, { force: true });
    res.json({ period: period.key, label: period.label, outcome });
  })
);
