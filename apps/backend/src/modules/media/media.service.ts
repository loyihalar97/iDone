import fs from "fs";
import path from "path";
import sharp from "sharp";
import { config } from "../../core/config";
import { AppError } from "../../core/errors/AppError";

const MAX_IMAGE_BYTES = 1024 * 1024; // 1MB

/**
 * Rasmni 1MB dan kichik bo'lguncha siqadi — avval sifatni, keyin o'lchamni
 * bosqichma-bosqich kamaytiradi. Har doim JPEG formatiga o'tkazadi
 * (eng ishonchli va yaxshi siqiladigan format).
 */
async function compressToUnder1MB(filePath: string): Promise<Buffer> {
  const metadata = await sharp(filePath).metadata();
  let width = metadata.width;
  let quality = 85;

  let buffer = await sharp(filePath)
    .resize({ width: width && width > 1920 ? 1920 : width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  let attempts = 0;
  while (buffer.length > MAX_IMAGE_BYTES && attempts < 15) {
    attempts++;
    if (quality > 30) {
      quality -= 10;
    } else if (width && width > 400) {
      width = Math.round(width * 0.85);
      quality = 60;
    } else {
      break; // bundan buyon siqib bo'lmaydi, qo'lda cheklaymiz
    }
    buffer = await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return buffer;
}

/**
 * Storage driver interfeysi. Kelajakda Supabase Storage yoki Cloudinary
 * qo'shish uchun shu interfeysni implement qilish kifoya —
 * qolgan kod (controller/service) o'zgarmaydi.
 */
interface StorageDriver {
  upload(file: Express.Multer.File): Promise<string>; // returns public URL
}

class LocalStorageDriver implements StorageDriver {
  async upload(file: Express.Multer.File): Promise<string> {
    // multer diskStorage allaqachon faylni saqlagan, biz faqat public URL qaytaramiz
    const publicPath = `/uploads/${file.filename}`;
    return `${config.publicBaseUrl}${publicPath}`;
  }
}

class SupabaseStorageDriver implements StorageDriver {
  async upload(file: Express.Multer.File): Promise<string> {
    // TODO: @supabase/supabase-js orqali implement qilinadi.
    // Misol:
    // const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    // const { data, error } = await supabase.storage
    //   .from(config.supabaseBucket)
    //   .upload(`requests/${Date.now()}-${file.originalname}`, fs.readFileSync(file.path));
    // return supabase.storage.from(config.supabaseBucket).getPublicUrl(data.path).data.publicUrl;
    throw AppError.validation("Supabase storage driver hali ulanmagan (.env da STORAGE_DRIVER=local qiling)");
  }
}

class CloudinaryStorageDriver implements StorageDriver {
  async upload(_file: Express.Multer.File): Promise<string> {
    // TODO: cloudinary SDK orqali implement qilinadi.
    throw AppError.validation("Cloudinary storage driver hali ulanmagan (.env da STORAGE_DRIVER=local qiling)");
  }
}

function getDriver(): StorageDriver {
  switch (config.storageDriver) {
    case "supabase":
      return new SupabaseStorageDriver();
    case "cloudinary":
      return new CloudinaryStorageDriver();
    default:
      return new LocalStorageDriver();
  }
}

export const mediaService = {
  async uploadAndGetUrl(file: Express.Multer.File): Promise<string> {
    const driver = getDriver();
    return driver.upload(file);
  },

  ensureUploadDirExists() {
    const dir = path.resolve(process.cwd(), config.localUploadDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },

  /**
   * Agar fayl rasm bo'lsa va 1MB dan katta bo'lsa, uni siqadi va diskdagi
   * faylni yangilangan (kichraytirilgan) versiyasi bilan almashtiradi.
   * `file` obyekti (filename/path/mimetype) shu yerda mutatsiya qilinadi,
   * shunda undan keyin chaqiriladigan uploadAndGetUrl to'g'ri nomni oladi.
   * Video fayllarga tegilmaydi.
   */
  async compressImageIfNeeded(file: Express.Multer.File): Promise<void> {
    if (!file.mimetype.startsWith("image/")) return;

    const stat = fs.statSync(file.path);
    if (stat.size <= MAX_IMAGE_BYTES) return;

    const buffer = await compressToUnder1MB(file.path);

    const newFilename = file.filename.replace(/\.[^.]+$/, "") + ".jpg";
    const newPath = path.join(path.dirname(file.path), newFilename);

    await fs.promises.writeFile(newPath, buffer);
    if (newPath !== file.path) {
      await fs.promises.unlink(file.path).catch(() => {});
    }

    file.filename = newFilename;
    file.path = newPath;
    file.mimetype = "image/jpeg";
  },

  /**
   * Public URL orqali (masalan https://.../uploads/xxx.jpg) lokal diskdagi
   * faylni topib o'chiradi. Faqat STORAGE_DRIVER=local uchun ishlaydi —
   * boshqa driverlar (Supabase va h.k.) uchun bu funksiya shunchaki
   * hech narsa qilmaydi (URL naqsh mos kelmaydi).
   */
  deleteLocalFileByUrl(url: string | null | undefined) {
    if (!url) return;
    try {
      const marker = "/uploads/";
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      const filename = url.slice(idx + marker.length);
      const filePath = path.resolve(process.cwd(), config.localUploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Faylni o'chirib bo'lmasa ham davom etamiz — bu kritik xato emas.
    }
  },
};
