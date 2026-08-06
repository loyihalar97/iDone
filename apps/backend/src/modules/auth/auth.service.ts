import jwt from "jsonwebtoken";
import { Role } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { config } from "../../core/config";
import { AppError } from "../../core/errors/AppError";
import { validateTelegramInitData } from "./telegramValidator";
import { auditLogService } from "../audit-log/audit-log.service";

export interface AuthTokenPayload {
  userId: string;
  role: Role;
}

export const authService = {
  /**
   * Telegram initData orqali kirish. Agar foydalanuvchi bazada mavjud bo'lmasa,
   * u "is_active: false" holatida yaratiladi va Superadmin uni faollashtirib,
   * rolini tayinlashi kerak bo'ladi (xavfsizlik uchun default-deny yondashuvi).
   */
  async loginWithTelegram(initData: string) {
    const tgUser = validateTelegramInitData(initData);
    const telegramId = String(tgUser.id);

    let user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username: tgUser.username,
          fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
          role: Role.DIRECTOR, // default rol; superadmin keyinchalik o'zgartiradi
          isActive: false, // superadmin tasdiqlamaguncha tizimga kira olmaydi
        },
      });

      await auditLogService.log({
        entityType: "user",
        entityId: user.id,
        action: "self_registered_via_telegram",
        performedById: user.id,
      });
    }

    if (!user.isActive) {
      throw AppError.forbidden(
        "Hisobingiz hali faollashtirilmagan. Iltimos, administratorga murojaat qiling."
      );
    }

    const token = signToken({ userId: user.id, role: user.role as Role });
    return { token, user };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { branch: true },
    });
    if (!user) throw AppError.notFound("Foydalanuvchi topilmadi");
    return user;
  },
};

export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  } catch {
    throw AppError.unauthorized("Token yaroqsiz yoki muddati o'tgan");
  }
}
