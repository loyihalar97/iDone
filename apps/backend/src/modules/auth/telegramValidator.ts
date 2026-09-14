import crypto from "crypto";
import { config } from "../../core/config";
import { AppError } from "../../core/errors/AppError";
import { tx } from "../../core/i18n";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  /** Telegram interfeysi tili ("uz", "ru", "en" ...) — boshlang'ich til taxmini. */
  language_code?: string;
}

/**
 * Telegram Mini App tomonidan yuborilgan `initData` stringini
 * bot tokeni asosida HMAC-SHA256 orqali tekshiradi.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): TelegramWebAppUser {
  if (!initData) {
    throw AppError.unauthorized(tx("Telegram initData topilmadi", "Данные Telegram initData не найдены"));
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw AppError.unauthorized(tx("initData ichida hash yo'q", "В initData отсутствует hash"));
  }
  params.delete("hash");

  const dataCheckArr: string[] = [];
  params.forEach((value, key) => {
    dataCheckArr.push(`${key}=${value}`);
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(config.telegramBotToken).digest();

  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) {
    throw AppError.unauthorized(tx("Telegram initData imzosi noto'g'ri", "Неверная подпись Telegram initData"));
  }

  // MVP uchun auth_date muddati tekshirilmaydi, productionda 24 soatdan eski
  // initData'larni rad etish tavsiya etiladi.
  const userRaw = params.get("user");
  if (!userRaw) {
    throw AppError.unauthorized(tx("initData ichida foydalanuvchi ma'lumoti yo'q", "В initData нет данных пользователя"));
  }

  return JSON.parse(userRaw) as TelegramWebAppUser;
}
