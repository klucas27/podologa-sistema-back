import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createClinicalEvolutionService } from "./clinicalEvolution.service";

type ClinicalEvolutionService = ReturnType<typeof createClinicalEvolutionService>;

export function createClinicalEvolutionController(service: ClinicalEvolutionService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const evolution = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(evolution) });
      } catch (err) { next(err); }
    },

    async listByAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const appointmentId = req.params["appointmentId"] as string;
        const evolutions = await service.listByAppointment(appointmentId);
        res.status(200).json({ status: "ok", data: sanitizeOutput(evolutions) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const evolution = await service.create(req.body);
        res.status(201).json({ status: "ok", data: sanitizeOutput(evolution) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const evolution = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(evolution) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Evolução clínica removida com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type ClinicalEvolutionController = ReturnType<typeof createClinicalEvolutionController>;
