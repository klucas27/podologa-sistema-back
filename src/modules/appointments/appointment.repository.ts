import type { PrismaClient, Appointment, Prisma } from "@prisma/client";
import { nowSP } from "../../shared/utils/date";

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

    findConflicting(start: Date, end: Date, excludeId?: string, professionalId?: string | null) {
      return prisma.appointment.findFirst({
        where: {
          deletedAt: null,
          status: { notIn: ["cancelled"] },
          ...(excludeId ? { id: { not: excludeId } } : {}),
          ...(professionalId ? { professionalId } : {}),
          scheduledStart: { lt: end },
          scheduledEnd: { gt: start },
        },
        include: { patient: true },
      });
    },

    findMany(adminId: string): Promise<Appointment[]> {
      return prisma.appointment.findMany({
        where: { deletedAt: null, patient: { adminId } },
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

    findManyForProfessional(professionalId: string): Promise<Appointment[]> {
      return prisma.appointment.findMany({
        where: { deletedAt: null, professionalId },
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
        data: { deletedAt: nowSP() },
      });
    },
  };
}

export type AppointmentRepository = ReturnType<typeof createAppointmentRepository>;
