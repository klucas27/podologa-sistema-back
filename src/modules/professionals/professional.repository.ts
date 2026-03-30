import type { PrismaClient, Professional, Prisma } from "@prisma/client";
import { nowSP } from "../../shared/utils/date";

export function createProfessionalRepository(prisma: PrismaClient) {
  return {
    findById(id: string, adminId: string): Promise<Professional | null> {
      return prisma.professional.findFirst({ where: { id, adminId, deletedAt: null } });
    },

    findUserByUsername(username: string) {
      return prisma.user.findUnique({ where: { username } });
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

    createWithUser(
      profData: Prisma.ProfessionalUncheckedCreateInput,
      userData: { id: string; username: string; passwordHash: string; professionalName: string | null },
    ): Promise<Professional> {
      return prisma.$transaction(async (tx) => {
        const professional = await tx.professional.create({ data: profData });
        await tx.user.create({
          data: {
            ...userData,
            role: "professional",
            professionalId: professional.id,
          },
        });
        return professional;
      });
    },

    update(id: string, data: Prisma.ProfessionalUncheckedUpdateInput): Promise<Professional> {
      return prisma.professional.update({ where: { id }, data });
    },

    softDelete(id: string): Promise<Professional> {
      return prisma.professional.update({
        where: { id },
        data: { deletedAt: nowSP() },
      });
    },
  };
}

export type ProfessionalRepository = ReturnType<typeof createProfessionalRepository>;
