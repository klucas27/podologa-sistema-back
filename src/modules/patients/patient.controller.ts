import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createPatientService } from "./patient.service";

type PatientService = ReturnType<typeof createPatientService>;

export function createPatientController(service: PatientService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const patient = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(patient) });
      } catch (err) { next(err); }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const search = (req.query["search"] as string) || undefined;
        const patients = await service.list(search);
        res.status(200).json({ status: "ok", data: sanitizeOutput(patients) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patient = await service.create(req.body);
        res.status(201).json({ status: "ok", data: sanitizeOutput(patient) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const patient = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(patient) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Paciente removido com sucesso" });
      } catch (err) { next(err); }
    },

    async forceDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.forceDelete(id);
        res.status(200).json({ status: "ok", message: "Paciente e todos os registros vinculados removidos com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type PatientController = ReturnType<typeof createPatientController>;
