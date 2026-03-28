import type { PrismaClient, Anamnesis, Prisma } from "@prisma/client";

export function createAnamnesisRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<Anamnesis | null> {
      return prisma.anamnesis.findFirst({ where: { id, deletedAt: null } });
    },

    findByPatient(patientId: string): Promise<Anamnesis[]> {
      return prisma.anamnesis.findMany({
        where: { patientId, deletedAt: null },
        orderBy: { createdAt: "desc" },
      });
    },

    create(data: Prisma.AnamnesisUncheckedCreateInput): Promise<Anamnesis> {
      return prisma.anamnesis.create({ data });
    },

    update(id: string, data: Prisma.AnamnesisUncheckedUpdateInput): Promise<Anamnesis> {
      return prisma.anamnesis.update({ where: { id }, data });
    },

    softDelete(id: string): Promise<Anamnesis> {
      return prisma.anamnesis.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    },
  };
}

export type AnamnesisRepository = ReturnType<typeof createAnamnesisRepository>;
