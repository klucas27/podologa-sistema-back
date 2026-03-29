import type { PrismaClient, Professional, Prisma } from "@prisma/client";

export function createProfessionalRepository(prisma: PrismaClient) {
  return {
    findById(id: string, adminId: string): Promise<Professional | null> {
      return prisma.professional.findFirst({ where: { id, adminId, deletedAt: null } });
    },

    findByUserId(userId: string): Promise<Professional | null> {
      return prisma.professional.findFirst({ where: { userId, deletedAt: null } });
    },

    findMany(adminId: string, search?: string): Promise<Professional[]> {
      const where: Prisma.ProfessionalWhereInput = { adminId, deletedAt: null };

      if (search) {
        where.OR = [
          { fullName: { contains: search } },
          { phoneNumber: { contains: search } },
        ];
      }

      return prisma.professional.findMany({
        where,
        orderBy: { fullName: "asc" },
      });
    },

    findActive(adminId: string): Promise<Professional[]> {
      return prisma.professional.findMany({
        where: { adminId, deletedAt: null, isActive: true },
        orderBy: { fullName: "asc" },
      });
    },

    create(data: Prisma.ProfessionalUncheckedCreateInput): Promise<Professional> {
      return prisma.professional.create({ data });
    },

    update(id: string, data: Prisma.ProfessionalUncheckedUpdateInput): Promise<Professional> {
      return prisma.professional.update({ where: { id }, data });
    },

    softDelete(id: string): Promise<Professional> {
      return prisma.professional.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    },

    getPrisma(): PrismaClient {
      return prisma;
    },
  };
}

export type ProfessionalRepository = ReturnType<typeof createProfessionalRepository>;
