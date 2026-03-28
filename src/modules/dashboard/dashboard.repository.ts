import type { PrismaClient } from "@prisma/client";

export function createDashboardRepository(prisma: PrismaClient) {
  return {
    countAppointments(where: Record<string, unknown>) {
      return prisma.appointment.count({ where });
    },

    countPatients(where: Record<string, unknown>) {
      return prisma.patient.count({ where });
    },

    aggregateBillings(where: Record<string, unknown>) {
      return prisma.billing.aggregate({ where, _sum: { amount: true } });
    },

    findAppointments(options: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) {
      return prisma.appointment.findMany(options as Parameters<typeof prisma.appointment.findMany>[0]);
    },

    findPatients(options: {
      where: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) {
      return prisma.patient.findMany(options as Parameters<typeof prisma.patient.findMany>[0]);
    },

    findBillings(options: {
      where: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) {
      return prisma.billing.findMany(options as Parameters<typeof prisma.billing.findMany>[0]);
    },

    findClinicalEvolutions(options: {
      where: Record<string, unknown>;
      select?: Record<string, unknown>;
    }) {
      return prisma.clinicalEvolution.findMany(options as Parameters<typeof prisma.clinicalEvolution.findMany>[0]);
    },
  };
}

export type DashboardRepository = ReturnType<typeof createDashboardRepository>;
