import { createApp } from "./app";
import { config } from "./core/config";
import { logger } from "./core/logger";
import { prisma } from "./core/database/prisma";

async function main() {
  await prisma.$connect();
  logger.info("Database connected");

  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`Backend server running on port ${config.port} (${config.env})`);
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
