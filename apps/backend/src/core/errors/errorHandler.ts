import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./AppError";
import { logger } from "../logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint topilmadi" } });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    logger.warn({ path: req.path, body: req.body, details: err.flatten() }, "Validation error");
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Kiritilgan ma'lumotlar noto'g'ri",
        details: err.flatten(),
      },
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err }, err.message);
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Kutilmagan xatolik yuz berdi" },
  });
}

// Async route handlerlarni try/catch bilan o'rab, xatoni errorHandlerga uzatadi
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
