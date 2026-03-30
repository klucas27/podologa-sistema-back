import type { PrismaClient, PatientProfessional } from "@prisma/client";

export function createPatientProfessionalRepository(prisma: PrismaClient) {
  return {
    findByPatient(patientId: string) {
      return prisma.patientProfessional.findMany({
        where: { patientId },
        include: { professional: { select: { id: true, fullName: true, specialty: true } } },
      });
    },

    link(patientId: string, professionalId: string): Promise<PatientProfessional> {
      return prisma.patientProfessional.upsert({
        where: { patientId_professionalId: { patientId, professionalId } },
        update: {},
        create: { patientId, professionalId },
      });
    },

    unlink(patientId: string, professionalId: string) {
      return prisma.patientProfessional.delete({
        where: { patientId_professionalId: { patientId, professionalId } },
      });
    },

    replaceAll(patientId: string, professionalIds: string[]) {
      return prisma.$transaction(async (tx) => {
        await tx.patientProfessional.deleteMany({ where: { patientId } });
        if (professionalIds.length > 0) {
          await tx.patientProfessional.createMany({
            data: professionalIds.map((professionalId) => ({ patientId, professionalId })),
          });
        }
        return tx.patientProfessional.findMany({
          where: { patientId },
          include: { professional: { select: { id: true, fullName: true, specialty: true } } },
        });
      });
    },
  };
}

export type PatientProfessionalRepository = ReturnType<typeof createPatientProfessionalRepository>;
