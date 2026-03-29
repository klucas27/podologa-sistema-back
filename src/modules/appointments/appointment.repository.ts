import type { PrismaClient, Appointment, Prisma } from "@prisma/client";

export function createAppointmentRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<Appointment | null> {
      return prisma.appointment.findFirst({
        where: { id, deletedAt: null },
        include: { patient: true, user: true, professional: true },
      });
    },

    findByIdRaw(id: string): Promise<Appointment | null> {
      return prisma.appointment.findFirst({
        where: { id, deletedAt: null },
      });
    },

    findConflicting(start: Date, end: Date, excludeId?: string) {
      return prisma.appointment.findFirst({
        where: {
          deletedAt: null,
          status: { notIn: ["cancelled"] },
          ...(excludeId ? { id: { not: excludeId } } : {}),
          scheduledStart: { lt: end },
          scheduledEnd: { gt: start },
        },
        include: { patient: true },
      });
    },

    findMany(filters?: { adminId?: string; professionalId?: string }): Promise<Appointment[]> {
      const where: Prisma.AppointmentWhereInput = { deletedAt: null };

      if (filters?.professionalId) {
        where.professionalId = filters.professionalId;
      } else if (filters?.adminId) {
        where.user = { OR: [{ id: filters.adminId }, { adminId: filters.adminId }] };
      }

      return prisma.appointment.findMany({
        where,
        include: {
          patient: {
            include: {
              _count: { select: { anamneses: true } },
              anamneses: { where: { deletedAt: null }, take: 1, orderBy: { createdAt: "desc" } },
            },
          },
          user: true,
          professional: true,
        },
        orderBy: { scheduledDate: "desc" },
      });
    },

    findByPatient(patientId: string): Promise<Appointment[]> {
      return prisma.appointment.findMany({
        where: { patientId, deletedAt: null },
        include: {
          patient: true,
          user: true,
          professional: true,
          clinicalEvolutions: {
            where: { deletedAt: null },
            include: { evolutionPathologies: { include: { pathology: true } } },
          },
        },
        orderBy: { scheduledDate: "desc" },
      });
    },

    create(data: Prisma.AppointmentUncheckedCreateInput): Promise<Appointment> {
      return prisma.appointment.create({ data });
    },

    update(id: string, data: Prisma.AppointmentUncheckedUpdateInput): Promise<Appointment> {
      return prisma.appointment.update({
        where: { id },
        data,
        include: { patient: true, user: true, professional: true },
      });
    },

    softDelete(id: string): Promise<Appointment> {
      return prisma.appointment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    },
  };
}

export type AppointmentRepository = ReturnType<typeof createAppointmentRepository>;
