import { createApp } from "./app";
import { config } from "./core/config";
import { logger } from "./core/logger";
import { prisma } from "./core/database/prisma";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception - process is dying");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled rejection - process is dying");
  process.exit(1);
});

async function main() {
  await prisma.$connect();
  logger.info("Database connected");

  const app = createApp();
  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info(`Backend server running on 0.0.0.0:${config.port} (${config.env})`);
  });

  server.on("error", (err) => {
    logger.error({ err }, "HTTP server failed to start");
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
