import { PrismaClient } from "@prisma/client";
import { config } from "../config";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

// Dev muhitida hot-reload paytida bir nechta ulanish ochilib ketmasligi uchun singleton
export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: config.isProd ? ["error", "warn"] : ["error", "warn"],
  });

if (!config.isProd) {
  global.__prisma__ = prisma;
}
