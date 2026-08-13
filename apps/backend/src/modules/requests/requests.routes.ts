import { Router } from "express";
import { z } from "zod";
import { Priority, RequestStatus, Role } from "@app/shared-types";
import { asyncHandler } from "../../core/errors/errorHandler";
import { requireAuth, requireRole } from "../../core/middlewares/requireAuth";
import { requestsService } from "./requests.service";
import { auditLogService } from "../audit-log/audit-log.service";

export const requestsRouter = Router();

requestsRouter.use(requireAuth);

const createSchema = z.object({
  // Direktor uchun filial serverda o'zining profilidan olinadi; Superadmin
  // boshqa filial nomidan ochsa, branchId yuborishi mumkin.
  branchId: z.string().uuid().optional(),
  category: z.string().min(1).max(60),
  description: z.string().min(3).max(2000),
  priority: z.nativeEnum(Priority),
  beforePhotoUrl: z.string().url(),
});

requestsRouter.post(
  "/",
  requireRole(Role.DIRECTOR, Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const request = await requestsService.create(input, req.auth!);
    res.status(201).json(request);
  })
);

const listQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  status: z.nativeEnum(RequestStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  category: z.string().min(1).max(60).optional(),
  technicianId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

requestsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, ...filters } = listQuerySchema.parse(req.query);
    const result = await requestsService.list(filters as any, page, pageSize, req.auth!);
    res.json(result);
  })
);

// Tarixni PDF/XLSX faylga eksport qilib, foydalanuvchining bot chatiga yuborish.
// DIQQAT: "/:id" dan OLDIN ro'yxatga olinishi shart.
const exportQuerySchema = listQuerySchema.extend({
  format: z.enum(["pdf", "xlsx"]),
});

requestsRouter.get(
  "/export",
  asyncHandler(async (req, res) => {
    const { format, page: _p, pageSize: _ps, ...filters } = exportQuerySchema.parse(req.query);
    const result = await requestsService.exportHistory(filters as any, format, req.auth!);
    res.json(result);
  })
);

requestsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const request = await requestsService.getById(req.params.id, req.auth!);
    res.json(request);
  })
);

requestsRouter.get(
  "/:id/history",
  asyncHandler(async (req, res) => {
    await requestsService.getById(req.params.id, req.auth!); // access check
    const history = await auditLogService.listByEntity("request", req.params.id);
    res.json(history);
  })
);

const assignSchema = z.object({ technicianId: z.string().uuid() });

requestsRouter.patch(
  "/:id/assign",
  requireRole(Role.CHIEF_TECHNICIAN, Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const { technicianId } = assignSchema.parse(req.body);
    const updated = await requestsService.assignTechnician(req.params.id, technicianId, req.auth!);
    res.json(updated);
  })
);

const statusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  afterPhotoUrl: z.string().url().optional(),
  // Bosh texnik ishni yakunlashda kiritadigan harajat summasi (so'm, 0 mumkin).
  expenseAmount: z.number().min(0).optional(),
});

requestsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status, afterPhotoUrl, expenseAmount } = statusSchema.parse(req.body);
    const updated = await requestsService.changeStatus(
      req.params.id,
      status,
      req.auth!,
      afterPhotoUrl,
      expenseAmount
    );
    res.json(updated);
  })
);

// Bosh texnik zayavkalar ketma-ketligini drag-and-drop orqali tartiblaydi.
const reorderSchema = z.object({ orderedIds: z.array(z.string().uuid()).min(1).max(500) });

requestsRouter.patch(
  "/reorder",
  requireRole(Role.CHIEF_TECHNICIAN, Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    const { orderedIds } = reorderSchema.parse(req.body);
    res.json(await requestsService.reorder(orderedIds, req.auth!));
  })
);

// Zayavka (tarix yozuvi) ni o'chirish — faqat Superadmin.
requestsRouter.delete(
  "/:id",
  requireRole(Role.SUPERADMIN),
  asyncHandler(async (req, res) => {
    res.json(await requestsService.remove(req.params.id, req.auth!));
  })
);
