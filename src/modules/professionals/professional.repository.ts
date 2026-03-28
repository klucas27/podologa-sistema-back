import type { PrismaClient, Professional, Prisma } from "@prisma/client";

export function createProfessionalRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<Professional | null> {
      return prisma.professional.findFirst({ where: { id, deletedAt: null } });
    },

    findMany(search?: string): Promise<Professional[]> {
      const where: Prisma.ProfessionalWhereInput = { deletedAt: null };

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

    findActive(): Promise<Professional[]> {
      return prisma.professional.findMany({
        where: { deletedAt: null, isActive: true },
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
  };
}

export type ProfessionalRepository = ReturnType<typeof createProfessionalRepository>;
