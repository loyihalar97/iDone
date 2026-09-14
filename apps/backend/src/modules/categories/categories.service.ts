import { Language } from "@app/shared-types";
import { prisma } from "../../core/database/prisma";
import { AppError } from "../../core/errors/AppError";
import { auditLogService } from "../audit-log/audit-log.service";
import { DEFAULT_LANGUAGE, tx } from "../../core/i18n";

/**
 * Standart (boshlang'ich) kategoriyalar. Kalitlar ilgarigi enum qiymatlari
 * bilan bir xil — shu sababli eski zayavkalar (category = "electrical" ...)
 * yorliqlari to'g'ri ko'rinadi.
 *
 * Har bir kategoriyaning ikkita nomi bor: `label` (o'zbekcha) va `labelRu`
 * (ruscha). Foydalanuvchi tanlagan tilga qarab mos nomi ko'rsatiladi.
 */
const DEFAULT_CATEGORIES: { key: string; label: string; labelRu: string }[] = [
  { key: "electrical", label: "Elektr ishlari", labelRu: "Электрика" },
  { key: "plumbing", label: "Santexnika", labelRu: "Сантехника" },
  { key: "ac", label: "Konditsioner", labelRu: "Кондиционер" },
  { key: "kitchen_equipment", label: "Oshxona uskunalari", labelRu: "Кухонное оборудование" },
  { key: "it_equipment", label: "IT uskunalari", labelRu: "IT-оборудование" },
  { key: "furniture", label: "Mebel", labelRu: "Мебель" },
  { key: "other", label: "Boshqa", labelRu: "Другое" },
];

/** Yorliqlarni har bir bildirishnomada bazadan olmaslik uchun kichik in-memory kesh. */
interface CachedRow {
  key: string;
  label: string;
  labelRu: string | null;
}
let labelCache: { rows: CachedRow[]; at: number } | null = null;
const LABEL_TTL_MS = 60_000;

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9Ѐ-ӿ]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return base || `cat_${Date.now()}`;
}

/** Kategoriya nomini tanlangan tilda beradi (ruscha bo'sh bo'lsa — o'zbekchasi). */
export function pickCategoryLabel(
  row: { label: string; labelRu?: string | null },
  lang: Language = DEFAULT_LANGUAGE
): string {
  if (lang === Language.RU) return row.labelRu?.trim() || row.label;
  return row.label;
}

export const categoriesService = {
  /** Jadval bo'sh bo'lsa standart kategoriyalarni yaratadi (deploy'dan keyin avtomatik). */
  async ensureDefaults() {
    const count = await prisma.taskCategory.count();
    if (count === 0) {
      await prisma.taskCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })),
        skipDuplicates: true,
      });
      labelCache = null;
      return;
    }

    // Eski o'rnatishlarda ruscha nomlar yo'q edi — standart kategoriyalarga
    // ularni bir marta to'ldiramiz (foydalanuvchi o'zgartirgan bo'lsa tegmaymiz).
    for (const c of DEFAULT_CATEGORIES) {
      await prisma.taskCategory.updateMany({
        where: { key: c.key, OR: [{ labelRu: null }, { labelRu: "" }] },
        data: { labelRu: c.labelRu },
      });
    }
    labelCache = null;
  },

  listActive() {
    return prisma.taskCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
  },

  listAll() {
    return prisma.taskCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
  },

  async create(
    data: { label: string; labelRu?: string; key?: string; sortOrder?: number },
    actorId: string
  ) {
    const label = data.label.trim();
    if (label.length < 2) {
      throw AppError.validation(
        tx("Kategoriya nomi juda qisqa", "Название категории слишком короткое")
      );
    }
    const labelRu = data.labelRu?.trim() || null;

    let key = (data.key && data.key.trim()) || slugify(label);
    const existing = await prisma.taskCategory.findUnique({ where: { key } });
    if (existing) key = `${key}_${Date.now().toString(36)}`;

    const max = await prisma.taskCategory.aggregate({ _max: { sortOrder: true } });
    const sortOrder = data.sortOrder ?? (max._max.sortOrder ?? 0) + 1;

    const category = await prisma.taskCategory.create({
      data: { key, label, labelRu, sortOrder },
    });
    labelCache = null;
    await auditLogService.log({
      entityType: "category",
      entityId: category.id,
      action: "created",
      performedById: actorId,
      metadata: { key, label, labelRu },
    });
    return category;
  },

  async update(
    id: string,
    data: { label?: string; labelRu?: string | null; isActive?: boolean; sortOrder?: number },
    actorId: string
  ) {
    const category = await prisma.taskCategory.findUnique({ where: { id } });
    if (!category) {
      throw AppError.notFound(tx("Kategoriya topilmadi", "Категория не найдена"));
    }

    const patch: {
      label?: string;
      labelRu?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    } = {};
    if (data.label !== undefined) {
      const label = data.label.trim();
      if (label.length < 2) {
        throw AppError.validation(
          tx("Kategoriya nomi juda qisqa", "Название категории слишком короткое")
        );
      }
      patch.label = label;
    }
    if (data.labelRu !== undefined) {
      patch.labelRu = data.labelRu === null ? null : data.labelRu.trim() || null;
    }
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;

    const updated = await prisma.taskCategory.update({ where: { id }, data: patch });
    labelCache = null;
    await auditLogService.log({
      entityType: "category",
      entityId: id,
      action: "updated",
      performedById: actorId,
      metadata: patch,
    });
    return updated;
  },

  async remove(id: string, actorId: string) {
    const category = await prisma.taskCategory.findUnique({ where: { id } });
    if (!category) {
      throw AppError.notFound(tx("Kategoriya topilmadi", "Категория не найдена"));
    }

    const inUse = await prisma.request.count({ where: { category: category.key } });
    if (inUse > 0) {
      throw AppError.validation(
        tx(
          `Bu kategoriya ${inUse} ta zayavkada ishlatilgan. O'chirish o'rniga uni faolsizlantiring.`,
          `Эта категория используется в ${inUse} заявках. Вместо удаления деактивируйте её.`
        )
      );
    }

    await prisma.taskCategory.delete({ where: { id } });
    labelCache = null;
    await auditLogService.log({
      entityType: "category",
      entityId: id,
      action: "deleted",
      performedById: actorId,
      metadata: { key: category.key, label: category.label },
    });
    return { success: true };
  },

  /** Kategoriyalarning ikkala tildagi nomlari (keshlangan). */
  async getRows(): Promise<CachedRow[]> {
    const now = Date.now();
    if (labelCache && now - labelCache.at < LABEL_TTL_MS) return labelCache.rows;
    const rows = await prisma.taskCategory.findMany({
      select: { key: true, label: true, labelRu: true },
    });
    labelCache = { rows, at: now };
    return rows;
  },

  /** key -> label xaritasi tanlangan tilda (keshlangan). */
  async getLabelMap(lang: Language = DEFAULT_LANGUAGE): Promise<Record<string, string>> {
    const rows = await this.getRows();
    const map: Record<string, string> = {};
    for (const c of rows) map[c.key] = pickCategoryLabel(c, lang);
    return map;
  },

  async getLabel(key: string, lang: Language = DEFAULT_LANGUAGE): Promise<string> {
    const map = await this.getLabelMap(lang);
    return map[key] ?? key;
  },
};
