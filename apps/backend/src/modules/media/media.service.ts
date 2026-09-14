import fs from "fs";
import path from "path";
import sharp from "sharp";
import { config } from "../../core/config";
import { AppError } from "../../core/errors/AppError";
import { tx } from "../../core/i18n";

/**
 * MUHIM (xotira sarfi): sharp (libvips) standart holatda dekodlangan
 * rasmlarni ichki keshda saqlaydi — bu kesh V8 heap'idan tashqarida
 * (native/C++ xotirada) turadi va Node GC uni tozalay olmaydi. Bizning
 * holatimizda har bir rasm faqat BIR MARTA siqiladi va qayta ishlatilmaydi,
 * shuning uchun bu kesh foyda bermaydi — faqat RSS xotirani vaqt o'tishi
 * bilan asta-sekin o'sishiga sabab bo'ladi (Railway'da doimiy o'sib
 * boruvchi Memory grafigi shundan kelib chiqqan bo'lishi mumkin).
 * Keshni o'chiramiz va parallel ishlov thread'lar sonini cheklaymiz.
 */
sharp.cache(false);
sharp.concurrency(1);

/** Rasm uchun ruxsat etilgan maksimal hajm (standart — 0.2 MB). */
const maxImageBytes = () => Math.max(config.maxImageKb, 48) * 1024;

/**
 * Siqishdan keyingi maksimal kenglik (piksel).
 *
 * 1280 px — telefon ekrani (odatda 1080 px kenglik) uchun yetarli, hatto
 * rasmni kattalashtirib ko'rganda ham. Kenglikni kamaytirish sifatni
 * pasaytirishdan KO'RA yaxshiroq yo'l: 1280 px @ sifat 72 chiqqan rasm
 * 1600 px @ sifat 45 dan ancha toza ko'rinadi, hajmi esa bir xil.
 */
const MAX_WIDTH = 1280;

/** Ro'yxat kartalari uchun kichik nusxa fayl nomiga qo'shiladigan qo'shimcha. */
export const THUMB_SUFFIX = "_thumb";

/** Fayl nomi kichik nusxa (thumbnail) ga tegishlimi? */
export function isThumbFilename(name: string): boolean {
  return /_thumb\.jpg$/i.test(name);
}

/** `/uploads/abc.jpg` → `/uploads/abc_thumb.jpg` (fayl nomi yoki to'liq URL uchun). */
export function toThumbPath(nameOrUrl: string): string {
  return nameOrUrl.replace(/(\.[^./]+)?$/, `${THUMB_SUFFIX}.jpg`);
}

/**
 * Rasmni belgilangan hajmdan (standart 0.2 MB) kichik bo'lguncha siqadi —
 * avval sifatni, keyin o'lchamni bosqichma-bosqich kamaytiradi. Har doim
 * JPEG formatiga o'tkazadi (eng ishonchli va yaxshi siqiladigan format).
 *
 * Faylni diskdan FAQAT BIR MARTA o'qiymiz (buffer sifatida) va har bir
 * urinishda shu bufferdan yangi sharp pipeline yaratamiz — oldingi versiya
 * har urinishda faylni diskdan qayta o'qib, qo'shimcha CPU/IO sarflagan.
 */
async function compressToLimit(original: Buffer, originalWidth?: number): Promise<Buffer> {
  const limit = maxImageBytes();
  let width = originalWidth && originalWidth > MAX_WIDTH ? MAX_WIDTH : originalWidth;

  // Boshlang'ich sifat 72 — 1280px kenglikdagi odatiy telefon surati shu
  // sifatda deyarli har doim 0.2 MB dan kichik chiqadi, ya'ni siqish BIR
  // MARTA bajariladi. Yuqoriroq qiymatdan boshlash ko'p hollarda 2-3 marta
  // qayta siqishga olib kelardi — bu Railway'da bekorga sarflangan CPU.
  let quality = 72;

  let buffer = await sharp(original)
    .rotate() // EXIF orientation bo'yicha to'g'rilaydi (keyin EXIF tashlanadi)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  let attempts = 0;
  while (buffer.length > limit && attempts < 8) {
    attempts++;
    if (quality > 38) {
      quality -= 12;
    } else if (width && width > 480) {
      width = Math.round(width * 0.75);
      quality = 58;
    } else {
      break; // bundan buyon siqib bo'lmaydi
    }
    buffer = await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return buffer;
}

/**
 * Ro'yxat kartalari uchun kichik nusxa (thumbnail) yaratadi — odatda 15–30 KB.
 *
 * Nega kerak: zayavkalar ro'yxatida har bir karta 40×40 px rasmcha
 * ko'rsatadi. Thumbnail bo'lmasa, brauzer har bir karta uchun TO'LIQ rasmni
 * yuklab oladi — 100 ta zayavkali ro'yxat ~50 MB trafik degani. Thumbnail
 * bilan bu ~2 MB ga tushadi (Railway egress xarajati shunga mos kamayadi).
 */
async function buildThumbnail(original: Buffer): Promise<Buffer> {
  return sharp(original)
    .rotate()
    .resize({ width: Math.max(config.thumbnailWidth, 80), withoutEnlargement: true })
    .jpeg({ quality: 62, mozjpeg: true })
    .toBuffer();
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
    throw AppError.validation(tx("Supabase storage driver hali ulanmagan (.env da STORAGE_DRIVER=local qiling)", "Драйвер хранилища Supabase ещё не подключён (укажите STORAGE_DRIVER=local в .env)"));
  }
}

class CloudinaryStorageDriver implements StorageDriver {
  async upload(_file: Express.Multer.File): Promise<string> {
    // TODO: cloudinary SDK orqali implement qilinadi.
    throw AppError.validation(tx("Cloudinary storage driver hali ulanmagan (.env da STORAGE_DRIVER=local qiling)", "Драйвер хранилища Cloudinary ещё не подключён (укажите STORAGE_DRIVER=local в .env)"));
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
   * Rasmni tayyorlaydi:
   *   1) hajmi `MAX_IMAGE_KB` dan (standart 0.2 MB) katta bo'lsa yoki
   *      kengligi 1280 px dan oshsa — siqadi va JPEG'ga o'tkazadi;
   *   2) ro'yxat kartalari uchun kichik nusxa (`*_thumb.jpg`) yaratadi.
   *
   * `file` obyekti (filename/path/mimetype) shu yerda mutatsiya qilinadi,
   * shunda undan keyin chaqiriladigan uploadAndGetUrl to'g'ri nomni oladi.
   * Video fayllarga tegilmaydi (ular siqilmaydi va thumbnail olmaydi).
   */
  async prepareImage(file: Express.Multer.File): Promise<void> {
    if (!file.mimetype.startsWith("image/")) return;

    // Faylni diskdan BIR MARTA o'qiymiz — siqish ham, thumbnail ham
    // shu bitta bufferdan tayyorlanadi (ortiqcha disk IO bo'lmaydi).
    const original = await fs.promises.readFile(file.path);
    const metadata = await sharp(original).metadata();
    const needsCompression =
      original.length > maxImageBytes() || (metadata.width ?? 0) > MAX_WIDTH;

    // Tip: sharp `Buffer<ArrayBufferLike>` qaytaradi, fs.readFile esa
    // `NonSharedBuffer` — umumiy `Buffer` tipini aniq ko'rsatamiz.
    let finalBuffer: Buffer = original;

    if (needsCompression) {
      finalBuffer = await compressToLimit(original, metadata.width);

      const newFilename = file.filename.replace(/\.[^.]+$/, "") + ".jpg";
      const newPath = path.join(path.dirname(file.path), newFilename);

      await fs.promises.writeFile(newPath, finalBuffer);
      if (newPath !== file.path) {
        await fs.promises.unlink(file.path).catch(() => {});
      }

      file.filename = newFilename;
      file.path = newPath;
      file.mimetype = "image/jpeg";
    }

    // Kichik nusxa — ro'yxatdagi 40×40 rasmchalar uchun.
    if (config.thumbnailWidth > 0) {
      try {
        const thumb = await buildThumbnail(finalBuffer);
        const thumbPath = path.join(path.dirname(file.path), toThumbPath(file.filename));
        await fs.promises.writeFile(thumbPath, thumb);
      } catch {
        // Thumbnail yaratilmasa ham yuklash muvaffaqiyatli hisoblanadi —
        // frontend bunday holatda to'liq rasmga qaytadi.
      }
    }
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
      const dir = path.resolve(process.cwd(), config.localUploadDir);

      // Asosiy rasm bilan birga uning kichik nusxasini ham o'chiramiz.
      for (const name of [filename, toThumbPath(filename)]) {
        const filePath = path.resolve(dir, name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      // Faylni o'chirib bo'lmasa ham davom etamiz — bu kritik xato emas.
    }
  },
};
