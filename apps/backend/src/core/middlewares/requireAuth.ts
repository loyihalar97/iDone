import { NextFunction, Request, Response } from "express";
import { Role } from "@app/shared-types";
import { AppError } from "../errors/AppError";
import { verifyToken } from "../../modules/auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw AppError.unauthorized("Authorization header topilmadi");
  }
  const token = header.slice("Bearer ".length);
  const payload = verifyToken(token);
  req.auth = payload;
  next();
}

/** Faqat berilgan rollarga ruxsat beruvchi middleware factory */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw AppError.unauthorized();
    if (!roles.includes(req.auth.role)) {
      throw AppError.forbidden("Bu amal uchun ruxsatingiz yo'q");
    }
    next();
  };
}
