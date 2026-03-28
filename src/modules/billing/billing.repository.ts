import type { PrismaClient, Billing, Prisma } from "@prisma/client";

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

    findAll(): Promise<Billing[]> {
      return prisma.billing.findMany({
        where: { deletedAt: null },
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
        data: { deletedAt: new Date() },
      });
    },
  };
}

export type BillingRepository = ReturnType<typeof createBillingRepository>;
