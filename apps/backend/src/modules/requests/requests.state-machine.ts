import { RequestStatus, Role } from "@app/shared-types";
import { AppError } from "../../core/errors/AppError";

type Transition = {
  from: RequestStatus;
  to: RequestStatus;
  allowedRoles: Role[];
};

/**
 * Zayavka statuslari faqat shu jadvalda ko'rsatilgan yo'nalishda o'tishi mumkin.
 * "Closed" holatiga hech qachon to'g'ridan-to'g'ri, qo'lda o'tish mumkin emas —
 * u faqat avtomatik logika orqali (chiefApproved && directorAccepted) qo'yiladi.
 */
const TRANSITIONS: Transition[] = [
  // Texnik "Ishni boshlash" bosadi (Bosh texnik ham boshlashi mumkin).
  { from: RequestStatus.NEW, to: RequestStatus.IN_PROGRESS, allowedRoles: [Role.TECHNICIAN, Role.CHIEF_TECHNICIAN] },
  // Texnik ishni tugatib, natija rasmi bilan "Ishni yakunlash" bosadi.
  {
    from: RequestStatus.IN_PROGRESS,
    to: RequestStatus.COMPLETED_BY_TECHNICIAN,
    allowedRoles: [Role.TECHNICIAN, Role.CHIEF_TECHNICIAN],
  },
  // Bosh texnik harajat summasini kiritib "Ishni yakunlash" bosadi.
  {
    from: RequestStatus.COMPLETED_BY_TECHNICIAN,
    to: RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN,
    allowedRoles: [Role.CHIEF_TECHNICIAN],
  },
  // Direktor ishni qabul qilib zayavkani yopadi.
  {
    from: RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN,
    to: RequestStatus.ACCEPTED_BY_DIRECTOR,
    allowedRoles: [Role.DIRECTOR],
  },
];

export function assertValidTransition(current: RequestStatus, next: RequestStatus, role: Role) {
  if (next === RequestStatus.CLOSED) {
    throw AppError.forbidden(
      "Zayavkani qo'lda yopib bo'lmaydi. U Bosh texnik va Direktor tasdiqlaganidan so'ng avtomatik yopiladi."
    );
  }

  const transition = TRANSITIONS.find((t) => t.from === current && t.to === next);
  if (!transition) {
    throw AppError.conflict(`"${current}" holatidan "${next}" holatiga o'tish mumkin emas`);
  }
  if (role === Role.SUPERADMIN) return; // superadmin har doim boshqara oladi
  if (!transition.allowedRoles.includes(role)) {
    throw AppError.forbidden("Bu status o'zgarishi uchun ruxsatingiz yo'q");
  }
}

/**
 * Avtomatik yopilish logikasi: Bosh texnik tasdiqlashi (APPROVED_BY_CHIEF_TECHNICIAN)
 * VA Direktor qabul qilishi (ACCEPTED_BY_DIRECTOR) — ikkalasi bajarilgach,
 * tizim statusni avtomatik ravishda CLOSED ga o'tkazadi.
 * Amaliy oqimda ACCEPTED_BY_DIRECTOR statusiga faqat APPROVED_BY_CHIEF_TECHNICIAN dan
 * o'tilishi mumkinligi sababli, direktor qabul qilgan zahoti bu shart avtomatik bajariladi.
 */
export function shouldAutoClose(next: RequestStatus): boolean {
  return next === RequestStatus.ACCEPTED_BY_DIRECTOR;
}
