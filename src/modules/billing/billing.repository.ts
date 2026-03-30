import type { PrismaClient, Billing, Prisma } from "@prisma/client";
import { nowSP } from "../../shared/utils/date";

export function createBillingRepository(prisma: PrismaClient) {
  return {
    findById(id: string): Promise<Billing | null> {
      return prisma.billing.findFirst({
        where: { id, deletedAt: null },
        include: { appointment: true },
      });
    },

    findByAppointment(appointmentId: string): Promise<Billing[]> {
      return prisma.billing.findMany({
        where: { appointmentId, deletedAt: null },
        orderBy: { createdAt: "desc" },
      });
    },

    findAll(adminId: string): Promise<Billing[]> {
      return prisma.billing.findMany({
        where: {
          deletedAt: null,
          appointment: { deletedAt: null, patient: { adminId } },
        },
        include: {
          appointment: {
            include: { patient: true, professional: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    findAllForProfessional(professionalId: string): Promise<Billing[]> {
      return prisma.billing.findMany({
        where: {
          deletedAt: null,
          appointment: { deletedAt: null, professionalId },
        },
        include: {
          appointment: {
            include: { patient: true, professional: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    create(data: Prisma.BillingUncheckedCreateInput): Promise<Billing> {
      return prisma.billing.create({ data });
    },

    update(id: string, data: Prisma.BillingUncheckedUpdateInput): Promise<Billing> {
      return prisma.billing.update({ where: { id }, data });
    },

    softDelete(id: string): Promise<Billing> {
      return prisma.billing.update({
        where: { id },
        data: { deletedAt: nowSP() },
      });
    },
  };
}

export type BillingRepository = ReturnType<typeof createBillingRepository>;
