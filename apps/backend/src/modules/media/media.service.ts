import fs from "fs";
import path from "path";
import { config } from "../../core/config";
import { AppError } from "../../core/errors/AppError";

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
};
