import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createBillingService } from "./billing.service";

type BillingService = ReturnType<typeof createBillingService>;

export function createBillingController(service: BillingService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const billing = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billing) });
      } catch (err) { next(err); }
    },

    async listByAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointmentId = req.params["appointmentId"] as string;
        const billings = await service.listByAppointment(appointmentId);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billings) });
      } catch (err) { next(err); }
    },

    async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const filters: { adminId?: string; professionalId?: string } = {};
        if (req.user!.role === "professional" && req.user!.professionalId) {
          filters.professionalId = req.user!.professionalId;
        } else {
          filters.adminId = req.user!.adminId;
        }
        const billings = await service.listAll(filters);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billings) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const billing = await service.create(req.body);
        res.status(201).json({ status: "ok", data: sanitizeOutput(billing) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const { appointmentId: _, ...updateData } = req.body;
        const billing = await service.update(id, updateData);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billing) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Cobrança removida com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type BillingController = ReturnType<typeof createBillingController>;
