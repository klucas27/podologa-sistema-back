import type { PrismaClient, ClinicalEvolution, Prisma } from "@prisma/client";

export function createClinicalEvolutionRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<ClinicalEvolution | null> {
      return prisma.clinicalEvolution.findFirst({
        where: { id, deletedAt: null },
        include: { evolutionPathologies: true },
      });
    },

    findByAppointment(appointmentId: string): Promise<ClinicalEvolution[]> {
      return prisma.clinicalEvolution.findMany({
        where: { appointmentId, deletedAt: null },
        include: { evolutionPathologies: true },
        orderBy: { createdAt: "desc" },
      });
    },

    create(data: Prisma.ClinicalEvolutionUncheckedCreateInput): Promise<ClinicalEvolution> {
      return prisma.clinicalEvolution.create({ data });
    },

    update(id: string, data: Prisma.ClinicalEvolutionUncheckedUpdateInput): Promise<ClinicalEvolution> {
      return prisma.clinicalEvolution.update({ where: { id }, data });
    },

    softDelete(id: string): Promise<ClinicalEvolution> {
      return prisma.clinicalEvolution.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    },
  };
}

export type ClinicalEvolutionRepository = ReturnType<typeof createClinicalEvolutionRepository>;
