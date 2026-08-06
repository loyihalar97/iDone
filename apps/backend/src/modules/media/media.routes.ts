import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth } from "../../core/middlewares/requireAuth";
import { mediaService } from "./media.service";
import { AppError } from "../../core/errors/AppError";

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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(AppError.validation("Faqat rasm (jpg/png/webp) yoki video (mp4/mov) fayllarga ruxsat berilgan"));
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
    if (!req.file) throw AppError.validation("Fayl topilmadi");
    const url = await mediaService.uploadAndGetUrl(req.file);
    res.json({ url });
  })
);
