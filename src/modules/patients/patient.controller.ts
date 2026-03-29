import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createPatientService } from "./patient.service";

type PatientService = ReturnType<typeof createPatientService>;

function getTenantContext(req: Request) {
  return {
    userId: req.user!.userId,
    adminId: req.user!.adminId,
    role: req.user!.role,
    professionalId: req.user!.professionalId,
  };
}

export function createPatientController(service: PatientService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const patient = await service.getById(id, getTenantContext(req));
        res.status(200).json({ status: "ok", data: sanitizeOutput(patient) });
      } catch (err) { next(err); }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const search = (req.query["search"] as string) || undefined;
        const patients = await service.list(getTenantContext(req), search);
        res.status(200).json({ status: "ok", data: sanitizeOutput(patients) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const patient = await service.create(req.body, getTenantContext(req));
        res.status(201).json({ status: "ok", data: sanitizeOutput(patient) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const patient = await service.update(id, req.body, getTenantContext(req));
        res.status(200).json({ status: "ok", data: sanitizeOutput(patient) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id, getTenantContext(req));
        res.status(200).json({ status: "ok", message: "Paciente removido com sucesso" });
      } catch (err) { next(err); }
    },

    async forceDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.forceDelete(id, getTenantContext(req));
        res.status(200).json({ status: "ok", message: "Paciente e todos os registros vinculados removidos com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type PatientController = ReturnType<typeof createPatientController>;
