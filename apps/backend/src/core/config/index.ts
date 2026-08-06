import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),

  databaseUrl: required("DATABASE_URL"),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  botInternalUrl: process.env.BOT_INTERNAL_URL ?? "http://localhost:4100",
  botInternalSecret: process.env.BOT_INTERNAL_SECRET ?? "",

  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "supabase" | "cloudinary",
  localUploadDir: process.env.LOCAL_UPLOAD_DIR ?? "uploads",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:4000",

  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_BUCKET ?? "request-media",

  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",

  isProd: process.env.NODE_ENV === "production",
};
