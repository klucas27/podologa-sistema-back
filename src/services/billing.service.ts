import crypto from "crypto";
import { prisma } from "../lib";
import type { Billing, PaymentMethod, BillingStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface CreateBillingInput {
  appointmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status?: BillingStatus;
  paidAt?: string | null;
}

interface UpdateBillingInput {
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: BillingStatus;
  paidAt?: string | null;
}

const getBillingById = async (id: string): Promise<Billing | null> => {
  return prisma.billing.findFirst({
    where: { id, deletedAt: null },
    include: { appointment: true },
  });
};

const listBillingsByAppointment = async (
  appointmentId: string,
): Promise<Billing[]> => {
  return prisma.billing.findMany({
    where: { appointmentId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
};

const createBilling = async (data: CreateBillingInput): Promise<Billing> => {
  return prisma.billing.create({
    data: {
      id: crypto.randomUUID(),
      appointmentId: data.appointmentId,
      amount: new Decimal(data.amount),
      paymentMethod: data.paymentMethod,
      status: data.status ?? "pending",
      paidAt: data.paidAt ? new Date(data.paidAt) : null,
    },
  });
};

const updateBilling = async (
  id: string,
  data: UpdateBillingInput,
): Promise<Billing | null> => {
  const existing = await prisma.billing.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return null;

  return prisma.billing.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && { amount: new Decimal(data.amount) }),
      ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
      ...(data.status && { status: data.status }),
      ...(data.paidAt !== undefined && {
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
      }),
    },
  });
};

const deleteBilling = async (id: string): Promise<boolean> => {
  const existing = await prisma.billing.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return false;

  await prisma.billing.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export {
  getBillingById,
  listBillingsByAppointment,
  createBilling,
  updateBilling,
  deleteBilling,
};
export type { CreateBillingInput, UpdateBillingInput };
