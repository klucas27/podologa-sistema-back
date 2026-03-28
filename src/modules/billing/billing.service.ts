import crypto from "crypto";
import type { Billing, PaymentMethod, BillingStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import type { BillingRepository } from "./billing.repository";
import { NotFoundError } from "../../shared/errors";

export interface CreateBillingInput {
  appointmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status?: BillingStatus;
  paidAt?: string | null;
}

export interface UpdateBillingInput {
  amount?: number;
  paymentMethod?: PaymentMethod;
  status?: BillingStatus;
  paidAt?: string | null;
}

export function createBillingService(repo: BillingRepository) {
  return {
    async getById(id: string): Promise<Billing> {
      const billing = await repo.findById(id);
      if (!billing) throw new NotFoundError("Cobrança não encontrada");
      return billing;
    },

    listByAppointment(appointmentId: string): Promise<Billing[]> {
      return repo.findByAppointment(appointmentId);
    },

    listAll(): Promise<Billing[]> {
      return repo.findAll();
    },

    create(data: CreateBillingInput): Promise<Billing> {
      return repo.create({
        id: crypto.randomUUID(),
        appointmentId: data.appointmentId,
        amount: new Decimal(data.amount),
        paymentMethod: data.paymentMethod,
        status: data.status ?? "pending",
        paidAt: data.paidAt ? new Date(data.paidAt) : null,
      });
    },

    async update(id: string, data: UpdateBillingInput): Promise<Billing> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Cobrança não encontrada");

      const updateData: Record<string, unknown> = {};
      if (data.amount !== undefined) updateData["amount"] = new Decimal(data.amount);
      if (data.paymentMethod) updateData["paymentMethod"] = data.paymentMethod;
      if (data.status) updateData["status"] = data.status;
      if (data.paidAt !== undefined) updateData["paidAt"] = data.paidAt ? new Date(data.paidAt) : null;

      return repo.update(id, updateData);
    },

    async delete(id: string): Promise<void> {
      const existing = await repo.findById(id);
      if (!existing) throw new NotFoundError("Cobrança não encontrada");
      await repo.softDelete(id);
    },
  };
}

export type BillingService = ReturnType<typeof createBillingService>;
