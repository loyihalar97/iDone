import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
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

  app.use(helmet());
  app.use(cors({ origin: config.frontendOrigin, credentials: true }));
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
