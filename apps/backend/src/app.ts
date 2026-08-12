import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { config } from "./core/config";
import { logger } from "./core/logger";
import { errorHandler, notFoundHandler } from "./core/errors/errorHandler";

import { authRouter } from "./modules/auth/auth.routes";
import { requestsRouter } from "./modules/requests/requests.routes";
import { branchesRouter } from "./modules/branches/branches.routes";
import { usersRouter } from "./modules/users/users.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { mediaRouter } from "./modules/media/media.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { auditLogRouter } from "./modules/audit-log/audit-log.routes";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // SPA (Mini App) statik fayllarini beruvchi bir servis stsenariysida
      // qat'iy CSP muammo tug'dirmasligi uchun o'chirilgan.
      contentSecurityPolicy: false,
    })
  );
  // Frontend backend bilan bir originda bo'lsa CORS shart emas; alohida deploy
  // uchun FRONTEND_ORIGIN ni ko'rsating. Bo'sh/"*" bo'lsa origin aks ettiriladi.
  const corsOrigin =
    !config.frontendOrigin || config.frontendOrigin === "*" ? true : config.frontendOrigin;
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(pinoHttp({ logger }));

  // Lokal saqlangan rasm/video fayllarga statik ulanish (STORAGE_DRIVER=local uchun)
  app.use("/uploads", express.static(path.resolve(process.cwd(), config.localUploadDir)));

  app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/api/auth", authRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/branches", branchesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/audit-logs", auditLogRouter);

  return app;
}

/**
 * Bot webhook'i ulanganidan keyin chaqiriladi: frontend statik fayllarini
 * (agar mavjud bo'lsa) beradi, SPA fallback qo'yadi, so'ng 404/error
 * handlerlarni oxirida ro'yxatdan o'tkazadi.
 */
export function finalizeApp(app: Express) {
  const publicDir = path.resolve(process.cwd(), config.serveFrontendDir);
  const indexHtml = path.join(publicDir, "index.html");
  const hasFrontend = config.serveFrontendDir && fs.existsSync(indexHtml);

  if (hasFrontend) {
    logger.info(`Frontend statik fayllari beriladi: ${publicDir}`);
    app.use(express.static(publicDir));

    // SPA fallback — API/upload/health/webhook bo'lmagan GET so'rovlarga index.html.
    app.get("*", (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/uploads") ||
        req.path.startsWith("/health") ||
        req.path.startsWith(config.webhookPath)
      ) {
        return next();
      }
      res.sendFile(indexHtml);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
}
