import { Language, normalizeLanguage } from "@app/shared-types";
import type { Request } from "express";

export { Language, normalizeLanguage };

/** Standart til — foydalanuvchi hali tanlamagan bo'lsa ishlatiladi. */
export const DEFAULT_LANGUAGE = Language.UZ;

/**
 * Ikki tilli matn. Kodda `tx("O'zbekcha", "Русский")` ko'rinishida yoziladi
 * va foydalanuvchining tiliga qarab tanlanadi.
 */
export type LocalizedText = string | Record<Language, string>;

/** Ikki tilli matn yaratadi. */
export function tx(uz: string, ru: string): Record<Language, string> {
  return { [Language.UZ]: uz, [Language.RU]: ru };
}

/** Ikki tilli matndan kerakli tilni tanlaydi. */
export function pick(text: LocalizedText, lang: Language = DEFAULT_LANGUAGE): string {
  if (typeof text === "string") return text;
  return text[lang] ?? text[DEFAULT_LANGUAGE] ?? "";
}

/**
 * So'rov tilini aniqlaydi.
 *
 * Mini App har bir so'rovda `X-Lang: uz|ru` sarlavhasini yuboradi
 * (foydalanuvchi tanlagan til). Sarlavha bo'lmasa `Accept-Language`
 * ko'riladi, u ham bo'lmasa — o'zbekcha.
 */
export function getRequestLanguage(req: Request): Language {
  const header = req.headers["x-lang"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (raw) return normalizeLanguage(raw, DEFAULT_LANGUAGE);

  const accept = req.headers["accept-language"];
  if (typeof accept === "string" && accept.trim()) {
    return normalizeLanguage(accept.split(",")[0], DEFAULT_LANGUAGE);
  }
  return DEFAULT_LANGUAGE;
}

/** Bazadagi `users.language` (null bo'lishi mumkin) → aniq til. */
export function userLanguage(value: unknown): Language {
  return normalizeLanguage(value, DEFAULT_LANGUAGE);
}

/** Tanlangan tilga mos son formati (masalan "1 250 000"). */
export function formatNumber(value: number, lang: Language): string {
  return value.toLocaleString(lang === Language.RU ? "ru-RU" : "uz-UZ");
}

/** Sana va vaqt (Toshkent vaqti bo'yicha) tanlangan tilda. */
export function formatDateTime(date: Date | string | null, lang: Language): string {
  if (!date) return "—";
  return new Date(date).toLocaleString(lang === Language.RU ? "ru-RU" : "uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
}
