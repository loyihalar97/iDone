import { Language } from "@app/shared-types";
import { DEFAULT_LANGUAGE, LocalizedText, pick } from "../i18n";

/**
 * Ilova xatosi. Xabar bir tilli (satr) yoki IKKI TILLI bo'lishi mumkin:
 *
 *   throw AppError.notFound(tx("Zayavka topilmadi", "Заявка не найдена"));
 *
 * `errorHandler` javob qaytarayotganda so'rovning tilini (X-Lang sarlavhasi)
 * hisobga olib kerakli variantni tanlaydi; loglarga har doim o'zbekchasi
 * yoziladi.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  /** Ikki tilli xabar (berilgan bo'lsa). */
  public readonly localized?: LocalizedText;

  constructor(
    message: LocalizedText,
    statusCode = 400,
    code = "BAD_REQUEST",
    details?: unknown
  ) {
    super(pick(message, DEFAULT_LANGUAGE));
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.localized = message;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Xabarni kerakli tilda qaytaradi. */
  messageIn(lang: Language): string {
    return pick(this.localized ?? this.message, lang);
  }

  static notFound(message: LocalizedText = { uz: "Resurs topilmadi", ru: "Ресурс не найден" }) {
    return new AppError(message, 404, "NOT_FOUND");
  }

  static forbidden(message: LocalizedText = { uz: "Ruxsat yo'q", ru: "Доступ запрещён" }) {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static unauthorized(
    message: LocalizedText = { uz: "Avtorizatsiyadan o'tilmagan", ru: "Не авторизован" }
  ) {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static conflict(message: LocalizedText = { uz: "Holat ziddiyati", ru: "Конфликт состояния" }) {
    return new AppError(message, 409, "CONFLICT");
  }

  static validation(
    message: LocalizedText = {
      uz: "Kiritilgan ma'lumotlar noto'g'ri",
      ru: "Введённые данные некорректны",
    },
    details?: unknown
  ) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }
}
