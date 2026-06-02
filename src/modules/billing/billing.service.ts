import crypto from "crypto";
import type { Billing, PaymentMethod, BillingStatus } from "../../types/models";
import type { BillingRepository } from "./billing.repository";
import { NotFoundError, ForbiddenError } from "../../shared/errors";
import type { PaginationInput } from "../../shared/utils/pagination";

interface UserContext {
  role: "admin" | "professional";
  professionalId: string | null;
  adminId: string;
}
import { nowSP, toDate } from "../../shared/utils/date";

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
    async getById(id: string, ctx: UserContext): Promise<Billing> {
      const billing = await repo.findById(id, ctx.adminId);
      if (!billing) throw new NotFoundError("Cobrança não encontrada");
      return billing;
    },

    listByAppointment(appointmentId: string, ctx: UserContext): Promise<Billing[]> {
      return repo.findByAppointment(appointmentId, ctx.adminId);
    },

    listAll(ctx: UserContext, pg: PaginationInput) {
      if (ctx.role === "professional" && ctx.professionalId) {
        return repo.findAllForProfessional(ctx.professionalId, pg);
      }
      return repo.findAll(ctx.adminId, pg);
    },

    async create(data: CreateBillingInput, ctx: UserContext): Promise<Billing> {
      const ok = await repo.existsAppointmentForAdmin(data.appointmentId, ctx.adminId);
      if (!ok) throw new ForbiddenError("Acesso negado ao agendamento");

      const status = data.status ?? "pending";
      const paidAt = data.paidAt
        ? toDate(data.paidAt)
        : status === "paid"
          ? nowSP()
          : null;

      return repo.create({
        id: crypto.randomUUID(),
        appointmentId: data.appointmentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status,
        paidAt,
        deletedAt: null,
      });
    },

    async update(id: string, data: UpdateBillingInput, ctx: UserContext): Promise<Billing> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Cobrança não encontrada");

      const updateData: Record<string, unknown> = {};
      if (data.amount !== undefined) updateData["amount"] = data.amount;
      if (data.paymentMethod) updateData["paymentMethod"] = data.paymentMethod;
      if (data.status) updateData["status"] = data.status;
      if (data.paidAt !== undefined) {
        updateData["paidAt"] = data.paidAt ? toDate(data.paidAt) : null;
      } else if (data.status === "paid" && !existing.paidAt) {
        updateData["paidAt"] = nowSP();
      }

      return repo.update(id, updateData);
    },

    async delete(id: string, ctx: UserContext): Promise<void> {
      const existing = await repo.findById(id, ctx.adminId);
      if (!existing) throw new NotFoundError("Cobrança não encontrada");
      await repo.softDelete(id);
    },
  };
}

export type BillingService = ReturnType<typeof createBillingService>;
