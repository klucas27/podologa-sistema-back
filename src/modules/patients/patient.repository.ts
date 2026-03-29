import type { PrismaClient, Patient, Prisma } from "@prisma/client";

export function createPatientRepository(prisma: PrismaClient) {
  return {
    findById(id: string, adminId: string): Promise<Patient | null> {
      return prisma.patient.findFirst({ where: { id, adminId } });
    },

    findMany(adminId: string, search?: string): Promise<Patient[]> {
      const where: Prisma.PatientWhereInput = { adminId };

      if (search) {
        where.OR = [
          { fullName: { contains: search } },
          { phoneNumber: { contains: search } },
        ];
      }

      return prisma.patient.findMany({
        where,
        orderBy: { fullName: "asc" },
        include: {
          _count: { select: { anamneses: true } },
          anamneses: {
            where: { deletedAt: null },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          patientProfessionals: {
            include: { professional: { select: { id: true, fullName: true } } },
          },
        },
      });
    },

    findManyByProfessional(professionalId: string): Promise<Patient[]> {
      return prisma.patient.findMany({
        where: {
          patientProfessionals: {
            some: { professionalId },
          },
        },
        orderBy: { fullName: "asc" },
        include: {
          _count: { select: { anamneses: true } },
          anamneses: {
            where: { deletedAt: null },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          patientProfessionals: {
            include: { professional: { select: { id: true, fullName: true } } },
          },
        },
      });
    },

    create(data: Prisma.PatientUncheckedCreateInput): Promise<Patient> {
      return prisma.patient.create({ data });
    },

    update(id: string, data: Prisma.PatientUncheckedUpdateInput): Promise<Patient> {
      return prisma.patient.update({ where: { id }, data });
    },

    delete(id: string): Promise<Patient> {
      return prisma.patient.delete({ where: { id } });
    },

    async setPatientProfessionals(patientId: string, professionalIds: string[]): Promise<void> {
      await prisma.$transaction(async (tx) => {
        await tx.patientProfessional.deleteMany({ where: { patientId } });
        if (professionalIds.length > 0) {
          await tx.patientProfessional.createMany({
            data: professionalIds.map((professionalId) => ({
              patientId,
              professionalId,
            })),
          });
        }
      });
    },

    async forceDeleteCascade(id: string): Promise<void> {
      await prisma.$transaction(async (tx) => {
        const appointments = await tx.appointment.findMany({
          where: { patientId: id },
          select: { id: true },
        });
        const appointmentIds = appointments.map((a) => a.id);

        if (appointmentIds.length > 0) {
          const evolutions = await tx.clinicalEvolution.findMany({
            where: { appointmentId: { in: appointmentIds } },
            select: { id: true },
          });
          const evolutionIds = evolutions.map((e) => e.id);

          if (evolutionIds.length > 0) {
            await tx.evolutionPathology.deleteMany({
              where: { evolutionId: { in: evolutionIds } },
            });
          }

          await tx.clinicalEvolution.deleteMany({
            where: { appointmentId: { in: appointmentIds } },
          });

          await tx.billing.deleteMany({
            where: { appointmentId: { in: appointmentIds } },
          });

          await tx.appointment.deleteMany({
            where: { patientId: id },
          });
        }

        await tx.patientProfessional.deleteMany({ where: { patientId: id } });
        await tx.anamnesis.deleteMany({ where: { patientId: id } });
        await tx.patient.delete({ where: { id } });
      });
    },
  };
}

export type PatientRepository = ReturnType<typeof createPatientRepository>;
