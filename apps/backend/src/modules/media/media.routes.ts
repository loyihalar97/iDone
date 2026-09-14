import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth } from "../../core/middlewares/requireAuth";
import { mediaService } from "./media.service";
import { config } from "../../core/config";
import { AppError } from "../../core/errors/AppError";
import { tx } from "../../core/i18n";

export const mediaRouter = Router();

const uploadDir = mediaService.ensureUploadDirExists();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];

const upload = multer({
  storage,
  // Siqishdan OLDINGI chegara. Rasmlar baribir ~0.2 MB gacha siqiladi,
  // bu chegara faqat juda katta fayl serverni band qilib qo'yishining
  // oldini oladi (MAX_UPLOAD_MB orqali sozlanadi).
  limits: { fileSize: Math.max(config.maxUploadMb, 1) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(AppError.validation(tx("Faqat rasm (jpg/png/webp) yoki video (mp4/mov) fayllarga ruxsat berilgan", "Разрешены только изображения (jpg/png/webp) или видео (mp4/mov)")));
      return;
    }
    cb(null, true);
  },
});

mediaRouter.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw AppError.validation(tx("Fayl topilmadi", "Файл не найден"));
    // Rasmni 0.2 MB gacha siqadi va ro'yxat uchun kichik nusxa yaratadi.
    await mediaService.prepareImage(req.file);
    const url = await mediaService.uploadAndGetUrl(req.file);
    res.json({ url });
  })
);
