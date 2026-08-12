import { prisma } from "../../core/database/prisma";
import { AppError } from "../../core/errors/AppError";
import { auditLogService } from "../audit-log/audit-log.service";

/**
 * Standart (boshlang'ich) kategoriyalar. Kalitlar ilgarigi enum qiymatlari
 * bilan bir xil — shu sababli eski zayavkalar (category = "electrical" ...)
 * yorliqlari to'g'ri ko'rinadi.
 */
const DEFAULT_CATEGORIES: { key: string; label: string }[] = [
  { key: "electrical", label: "Elektr ishlari" },
  { key: "plumbing", label: "Santexnika" },
  { key: "ac", label: "Konditsioner" },
  { key: "kitchen_equipment", label: "Oshxona uskunalari" },
  { key: "it_equipment", label: "IT uskunalari" },
  { key: "furniture", label: "Mebel" },
  { key: "other", label: "Boshqa" },
];

// Yorliqlarni har bir bildirishnomada bazadan olmaslik uchun kichik in-memory kesh.
let labelCache: { map: Record<string, string>; at: number } | null = null;
const LABEL_TTL_MS = 60_000;

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9Ѐ-ӿ]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return base || `cat_${Date.now()}`;
}

export const categoriesService = {
  /** Jadval bo'sh bo'lsa standart kategoriyalarni yaratadi (deploy'dan keyin avtomatik). */
  async ensureDefaults() {
    const count = await prisma.taskCategory.count();
    if (count > 0) return;
    await prisma.taskCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })),
      skipDuplicates: true,
    });
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

  async create(data: { label: string; key?: string; sortOrder?: number }, actorId: string) {
    const label = data.label.trim();
    if (label.length < 2) throw AppError.validation("Kategoriya nomi juda qisqa");

    let key = (data.key && data.key.trim()) || slugify(label);
    const existing = await prisma.taskCategory.findUnique({ where: { key } });
    if (existing) key = `${key}_${Date.now().toString(36)}`;

    const max = await prisma.taskCategory.aggregate({ _max: { sortOrder: true } });
    const sortOrder = data.sortOrder ?? (max._max.sortOrder ?? 0) + 1;

    const category = await prisma.taskCategory.create({ data: { key, label, sortOrder } });
    labelCache = null;
    await auditLogService.log({
      entityType: "category",
      entityId: category.id,
      action: "created",
      performedById: actorId,
      metadata: { key, label },
    });
    return category;
  },

  async update(
    id: string,
    data: { label?: string; isActive?: boolean; sortOrder?: number },
    actorId: string
  ) {
    const category = await prisma.taskCategory.findUnique({ where: { id } });
    if (!category) throw AppError.notFound("Kategoriya topilmadi");

    const patch: { label?: string; isActive?: boolean; sortOrder?: number } = {};
    if (data.label !== undefined) {
      const label = data.label.trim();
      if (label.length < 2) throw AppError.validation("Kategoriya nomi juda qisqa");
      patch.label = label;
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
    if (!category) throw AppError.notFound("Kategoriya topilmadi");

    const inUse = await prisma.request.count({ where: { category: category.key } });
    if (inUse > 0) {
      throw AppError.validation(
        `Bu kategoriya ${inUse} ta zayavkada ishlatilgan. O'chirish o'rniga uni faolsizlantiring.`
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

  /** key -> label xaritasi (keshlangan). */
  async getLabelMap(): Promise<Record<string, string>> {
    const now = Date.now();
    if (labelCache && now - labelCache.at < LABEL_TTL_MS) return labelCache.map;
    const all = await prisma.taskCategory.findMany({ select: { key: true, label: true } });
    const map: Record<string, string> = {};
    for (const c of all) map[c.key] = c.label;
    labelCache = { map, at: now };
    return map;
  },

  async getLabel(key: string): Promise<string> {
    const map = await this.getLabelMap();
    return map[key] ?? key;
  },
};
