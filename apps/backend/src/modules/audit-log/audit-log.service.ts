import { prisma } from "../../core/database/prisma";

interface LogInput {
  entityType: string;
  entityId: string;
  action: string;
  performedById: string;
  metadata?: Record<string, unknown>;
}

export const auditLogService = {
  async log(input: LogInput) {
    return prisma.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        performedById: input.performedById,
        metadata: input.metadata as any,
      },
    });
  },

  async listByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: { performedBy: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async listAll(params: { skip?: number; take?: number }) {
    return prisma.auditLog.findMany({
      include: { performedBy: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    });
  },
};
