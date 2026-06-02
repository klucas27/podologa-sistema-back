import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import { paginationSchema } from "../../shared/utils/pagination";
import type { createBillingService } from "./billing.service";

type BillingService = ReturnType<typeof createBillingService>;

export function createBillingController(service: BillingService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const billing = await service.getById(id, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billing) });
      } catch (err) { next(err); }
    },

    async listByAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointmentId = req.params["appointmentId"] as string;
        const billings = await service.listByAppointment(appointmentId, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billings) });
      } catch (err) { next(err); }
    },

    async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const pg = paginationSchema.parse(req.query);
        const result = await service.listAll(req.user!, pg);
        res.status(200).json({ status: "ok", ...sanitizeOutput(result) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const billing = await service.create(req.body, req.user!);
        res.status(201).json({ status: "ok", data: sanitizeOutput(billing) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const billing = await service.update(id, req.body, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(billing) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id, req.user!);
        res.status(200).json({ status: "ok", message: "Cobrança removida com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type BillingController = ReturnType<typeof createBillingController>;
