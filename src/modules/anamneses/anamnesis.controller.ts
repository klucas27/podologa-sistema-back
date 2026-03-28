import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createAnamnesisService } from "./anamnesis.service";

type AnamnesisService = ReturnType<typeof createAnamnesisService>;

export function createAnamnesisController(service: AnamnesisService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const anamnesis = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(anamnesis) });
      } catch (err) { next(err); }
    },

    async listByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patientId = req.params["patientId"] as string;
        const anamneses = await service.listByPatient(patientId);
        res.status(200).json({ status: "ok", data: sanitizeOutput(anamneses) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const anamnesis = await service.create(req.body);
        res.status(201).json({ status: "ok", data: sanitizeOutput(anamnesis) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const anamnesis = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(anamnesis) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Anamnese removida com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type AnamnesisController = ReturnType<typeof createAnamnesisController>;
