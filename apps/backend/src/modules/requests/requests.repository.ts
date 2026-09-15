import { Prisma, RequestStatus as PrismaRequestStatus } from "@prisma/client";
import { prisma } from "../../core/database/prisma";

export interface RequestFilters {
  /** Bitta filial bo'yicha filtr (foydalanuvchi tanlagan). */
  branchId?: string;
  /** Ruxsat etilgan filiallar ro'yxati (scope). Bo'sh massiv — hech narsa. */
  branchIds?: string[];
  status?: PrismaRequestStatus;
  priority?: string;
  category?: string;
  technicianId?: string;
  chiefTechnicianId?: string;
  /** Zayavkani kim ochgani bo'yicha filtr (Rahbar uchun: "by direktor"). */
  createdById?: string;
  /** Zayavkani ochgan xodimning lavozimi bo'yicha filtr ("by other positions"). */
  createdByRole?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

const baseRelations = {
  branch: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true, role: true } },
  chiefTechnician: { select: { id: true, fullName: true } },
  technician: { select: { id: true, fullName: true } },
} satisfies Prisma.RequestInclude;

/**
 * To'liq ma'lumot — bitta zayavka sahifasi va PDF/Excel eksport uchun
 * (izohlar matni va mualliflari bilan).
 */
const includeRelations = {
  ...baseRelations,
  comments: {
    include: { author: { select: { id: true, fullName: true, role: true } } },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.RequestInclude;

/**
 * RO'YXAT uchun yengil variant. Kartada izohlardan faqat "bloker izoh
 * bormi?" degan belgi kerak — matni ham, muallifi ham ko'rsatilmaydi.
 *
 * Ilgari ro'yxat har bir zayavkaning BARCHA izohlarini mualliflari bilan
 * birga tortardi: 100 ta zayavkali sahifada bu ortiqcha JOIN'lar va bir
 * necha yuz kilobayt keraksiz JSON degani edi (Railway'da CPU + trafik).
 */
const listRelations = {
  ...baseRelations,
  comments: {
    where: { isBlocker: true },
    select: { id: true, isBlocker: true },
    take: 1,
  },
} satisfies Prisma.RequestInclude;

function buildWhere(filters: RequestFilters): Prisma.RequestWhereInput {
  // branchIds (scope) va branchId (foydalanuvchi filtri) birga kelsa,
  // service qatlami ularni allaqachon kesishmaga keltirgan bo'ladi.
  const branchWhere: Prisma.RequestWhereInput = filters.branchIds
    ? { branchId: { in: filters.branchIds } }
    : filters.branchId
      ? { branchId: filters.branchId }
      : {};

  return {
    ...branchWhere,
    status: filters.status,
    priority: filters.priority as any,
    category: filters.category as any,
    technicianId: filters.technicianId,
    chiefTechnicianId: filters.chiefTechnicianId,
    createdById: filters.createdById,
    ...(filters.createdByRole ? { createdBy: { role: filters.createdByRole as any } } : {}),
    createdAt:
      filters.dateFrom || filters.dateTo
        ? { gte: filters.dateFrom, lte: filters.dateTo }
        : undefined,
  };
}

/**
 * `opts.fullComments = true` — izohlar matni bilan (eksport/hisobot uchun).
 * Standart holatda ro'yxat uchun yengil variant ishlatiladi.
 *
 * Ikkita overload: `fullComments: true` chaqiruvchilar uchun to'liq
 * (author bilan) `comments` tipini qaytaradi, aks holda yengil variantni.
 * (Obyekt literal ichida method overload sintaksisi ishlamaydi, shuning
 * uchun bu funksiya alohida e'lon qilinib, keyin repository obyektiga
 * qo'shiladi.) Shu overload'lar bo'lmasa, TypeScript ikkala shoxobchani
 * birlashtirib (union) qaytaradi va `RequestWithRelations[]` kutgan
 * joylarda (masalan eksport) tip xatosi beradi.
 */
function findMany(
  filters: RequestFilters,
  skip: number,
  take: number,
  opts: { fullComments: true }
): Promise<[Prisma.RequestGetPayload<{ include: typeof includeRelations }>[], number]>;
function findMany(
  filters: RequestFilters,
  skip: number,
  take: number,
  opts?: { fullComments?: false }
): Promise<[Prisma.RequestGetPayload<{ include: typeof listRelations }>[], number]>;
function findMany(
  filters: RequestFilters,
  skip: number,
  take: number,
  opts: { fullComments?: boolean } = {}
) {
  const where = buildWhere(filters);

  return prisma.$transaction([
    prisma.request.findMany({
      where,
      include: opts.fullComments ? includeRelations : listRelations,
      // Avval Bosh texnik belgilagan ish ketma-ketligi (sortOrder), so'ngra
      // eng yangi zayavkalar. Yangi zayavkalar sortOrder=0 bilan tepada turadi.
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.request.count({ where }),
  ]);
}

export const requestsRepository = {
  create(data: Prisma.RequestUncheckedCreateInput) {
    return prisma.request.create({ data, include: includeRelations });
  },

  findById(id: string) {
    return prisma.request.findUnique({ where: { id }, include: includeRelations });
  },

  findMany,

  updateStatus(id: string, status: PrismaRequestStatus, extra: Prisma.RequestUpdateInput = {}) {
    return prisma.request.update({
      where: { id },
      data: { status, ...extra },
      include: includeRelations,
    });
  },

  updatePriority(id: string, priority: string) {
    return prisma.request.update({
      where: { id },
      data: { priority: priority as any },
      include: includeRelations,
    });
  },

  clearMedia(id: string) {
    return prisma.request.update({
      where: { id },
      data: { beforePhotoUrl: null, afterPhotoUrl: null },
      include: includeRelations,
    });
  },

  /**
   * Texnikni biriktiradi. `chiefTechnicianId` berilsa, zayavkaning mas'ul
   * bosh texnigi ham shu bilan belgilanadi (zayavka hali hech kimga
   * biriktirilmagan bo'lsa — kim birinchi texnik tayinlasa, o'sha mas'ul).
   */
  assignTechnician(id: string, technicianId: string, chiefTechnicianId?: string) {
    return prisma.request.update({
      where: { id },
      data: {
        technicianId,
        ...(chiefTechnicianId ? { chiefTechnicianId } : {}),
      },
      include: includeRelations,
    });
  },

  addStatusHistory(requestId: string, fromStatus: PrismaRequestStatus | null, toStatus: PrismaRequestStatus, changedById: string) {
    return prisma.requestStatusHistory.create({
      data: { requestId, fromStatus, toStatus, changedById },
    });
  },

  addComment(requestId: string, authorId: string, text: string, isBlocker: boolean) {
    return prisma.requestComment.create({
      data: { requestId, authorId, text, isBlocker },
      include: { author: { select: { id: true, fullName: true, role: true } } },
    });
  },

  listComments(requestId: string) {
    return prisma.requestComment.findMany({
      where: { requestId },
      include: { author: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  remove(id: string) {
    return prisma.request.delete({ where: { id } });
  },
};
