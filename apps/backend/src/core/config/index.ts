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

  // Telegram bot (backend ichida ishlaydi — alohida servis kerak emas).
  // Mini App URL: bir servisga birlashtirilganda frontend backend bilan bir
  // xil originda xizmat qilinadi, shuning uchun standart qiymat PUBLIC_BASE_URL.
  miniAppUrl: process.env.MINI_APP_URL ?? process.env.PUBLIC_BASE_URL ?? "",
  botEnabled: (process.env.BOT_ENABLED ?? "true") !== "false",
  useWebhook: process.env.USE_WEBHOOK === "true",
  webhookPath: process.env.WEBHOOK_PATH ?? "/telegram/webhook",
  // Webhook domeni: berilmasa PUBLIC_BASE_URL dan olinadi (bir servis stsenariysi).
  webhookDomain: process.env.WEBHOOK_DOMAIN ?? process.env.PUBLIC_BASE_URL ?? "",
  // Frontend statik build papkasi (Express orqali beriladi). Bo'sh bo'lsa
  // statik xizmat o'chiriladi (frontend alohida deploy qilingan holat).
  serveFrontendDir: process.env.SERVE_FRONTEND_DIR ?? "public",

  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "supabase" | "cloudinary",
  localUploadDir: process.env.LOCAL_UPLOAD_DIR ?? "uploads",

  // Zayavka YOPILGANIDAN keyin rasmlar qancha kun saqlanadi. Muddat o'tgach
  // fayllar diskdan va URL'lar bazadan avtomatik o'chiriladi (rasmlar
  // Telegram bot chatida qolaveradi).
  //   0  — yopilgan zahoti darhol o'chiriladi (eski xatti-harakat)
  //   -1 — hech qachon o'chirilmaydi
  mediaRetentionDays: parseInt(process.env.MEDIA_RETENTION_DAYS ?? "7", 10),
  // Tozalash vazifasi necha daqiqada bir ishga tushadi.
  mediaCleanupIntervalMinutes: parseInt(
    process.env.MEDIA_CLEANUP_INTERVAL_MINUTES ?? "360",
    10
  ),

  // --- Avtomatik hisobotlar ------------------------------------------------
  reportsEnabled: (process.env.REPORTS_ENABLED ?? "true") !== "false",
  // Mahalliy vaqt siljishi (daqiqada). O'zbekiston — UTC+5, yozgi vaqt yo'q.
  reportTzOffsetMinutes: parseInt(process.env.REPORT_TZ_OFFSET_MINUTES ?? "300", 10),
  // Haftalik hisobot: dushanba kuni shu soatda (mahalliy vaqt).
  reportWeeklyHour: parseInt(process.env.REPORT_WEEKLY_HOUR ?? "7", 10),
  // Oylik hisobot: oyning oxirgi kuni shu soatda (mahalliy vaqt).
  reportMonthlyHour: parseInt(process.env.REPORT_MONTHLY_HOUR ?? "16", 10),
  // Rejalashtiruvchi necha daqiqada bir tekshiradi.
  reportCheckIntervalMinutes: parseInt(process.env.REPORT_CHECK_INTERVAL_MINUTES ?? "10", 10),
  // Server o'chib qolgan bo'lsa, kechikkan hisobot shu muddat ichida bo'lsa
  // yuboriladi; undan eski bo'lsa o'tkazib yuboriladi (eski hisobotlar
  // to'planib kelib qolmasligi uchun).
  reportMaxCatchupHours: parseInt(process.env.REPORT_MAX_CATCHUP_HOURS ?? "72", 10),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:4000",

  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_BUCKET ?? "request-media",

  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",

  isProd: process.env.NODE_ENV === "production",
};
