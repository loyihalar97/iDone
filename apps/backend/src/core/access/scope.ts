import { GLOBAL_SCOPE_ROLES, Role } from "@app/shared-types";
import { prisma } from "../database/prisma";
import { AppError } from "../errors/AppError";
import type { AuthTokenPayload } from "../../modules/auth/auth.service";
import { tx } from "../i18n";

/**
 * Foydalanuvchining ko'rish/boshqarish doirasi (scope).
 *
 *  - `all`        — barcha filiallar (Superadmin, Bosh texnik, Rahbar)
 *  - `branches`   — faqat sanab o'tilgan filiallar (Hududiy rahbar — unga
 *                   biriktirilgan filiallar; Direktor va Filial menejeri —
 *                   o'zining bitta filiali). Bo'sh massiv — hech narsa
 *                   ko'rinmaydi (filial biriktirilmagan).
 *  - `technician` — faqat o'ziga biriktirilgan ishlar (Texnik)
 */
export type AccessScope =
  | { kind: "all" }
  | { kind: "branches"; branchIds: string[] }
  | { kind: "technician"; technicianId: string };

/** Hududiy rahbarga biriktirilgan filial ID'lari. */
export async function getManagedBranchIds(userId: string): Promise<string[]> {
  const rows = await prisma.userBranch.findMany({
    where: { userId },
    select: { branchId: true },
  });
  return rows.map((r: { branchId: string }) => r.branchId);
}

export async function resolveScope(actor: AuthTokenPayload): Promise<AccessScope> {
  if (GLOBAL_SCOPE_ROLES.includes(actor.role)) {
    return { kind: "all" };
  }

  if (actor.role === Role.TECHNICIAN) {
    return { kind: "technician", technicianId: actor.userId };
  }

  if (actor.role === Role.REGIONAL_MANAGER) {
    return { kind: "branches", branchIds: await getManagedBranchIds(actor.userId) };
  }

  // Direktor va Filial menejeri — faqat o'z filiali.
  const user = await prisma.user.findUnique({ where: { id: actor.userId } });
  // Token yaroqli, lekin xodim o'chirilgan bo'lishi mumkin — 500 o'rniga 401.
  if (!user) throw AppError.unauthorized(tx("Hisobingiz topilmadi. Qaytadan kiring.", "Ваш аккаунт не найден. Войдите заново."));
  return { kind: "branches", branchIds: user.branchId ? [user.branchId] : [] };
}

/** Berilgan filial foydalanuvchining doirasiga kiradimi? */
export function scopeAllowsBranch(scope: AccessScope, branchId: string): boolean {
  if (scope.kind === "all") return true;
  if (scope.kind === "branches") return scope.branchIds.includes(branchId);
  return false;
}

/**
 * Zayavka ochilayotgan filialni aniqlaydi va ruxsatni tekshiradi.
 *
 *  - Direktor / Filial menejeri — filial profilidan olinadi (so'rovdagi qiymat
 *    e'tiborga olinmaydi);
 *  - Hududiy rahbar — faqat o'ziga biriktirilgan filiallardan birini tanlashi mumkin;
 *  - Rahbar / Superadmin — istalgan filial.
 */
export async function resolveCreateBranchId(
  requestedBranchId: string | undefined,
  actor: AuthTokenPayload
): Promise<string> {
  if (actor.role === Role.DIRECTOR || actor.role === Role.BRANCH_MANAGER) {
    const user = await prisma.user.findUnique({ where: { id: actor.userId } });
    if (!user) throw AppError.unauthorized(tx("Hisobingiz topilmadi. Qaytadan kiring.", "Ваш аккаунт не найден. Войдите заново."));
    if (!user.branchId) {
      throw AppError.validation(
        tx("Sizga filial biriktirilmagan. Zayavka ochish uchun Superadminga murojaat qiling.", "Вам не назначен филиал. Для создания заявки обратитесь к суперадмину.")
      );
    }
    return user.branchId;
  }

  if (actor.role === Role.REGIONAL_MANAGER) {
    const managed = await getManagedBranchIds(actor.userId);
    if (managed.length === 0) {
      throw AppError.validation(
        tx("Sizga birorta ham filial biriktirilmagan. Superadminga murojaat qiling.", "Вам не назначен ни один филиал. Обратитесь к суперадмину.")
      );
    }
    if (!requestedBranchId) {
      throw AppError.validation(tx("Zayavka ochish uchun filialni tanlang", "Выберите филиал для создания заявки"));
    }
    if (!managed.includes(requestedBranchId)) {
      throw AppError.forbidden(tx("Bu filial sizga biriktirilmagan", "Этот филиал вам не назначен"));
    }
    return requestedBranchId;
  }

  // Rahbar va Superadmin — istalgan filial (mavjud va faol bo'lishi kerak).
  if (!requestedBranchId) {
    throw AppError.validation(tx("Zayavka ochish uchun filialni tanlang", "Выберите филиал для создания заявки"));
  }
  const branch = await prisma.branch.findUnique({ where: { id: requestedBranchId } });
  if (!branch) throw AppError.validation(tx("Bunday filial topilmadi", "Такой филиал не найден"));
  if (!branch.isActive) throw AppError.validation(tx("Bu filial faol emas", "Этот филиал неактивен"));
  return requestedBranchId;
}
