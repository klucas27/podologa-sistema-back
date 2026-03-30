import type { Request, Response, NextFunction } from "express";
import type { PatientProfessionalService } from "./patientProfessional.service";

export function createPatientProfessionalController(service: PatientProfessionalService) {
  return {
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const links = await service.listByPatient(req.params.patientId as string);
        res.json(links);
      } catch (err) {
        next(err);
      }
    },

    async link(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await service.link(req.params.patientId as string, req.body.professionalId);
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    async unlink(req: Request, res: Response, next: NextFunction) {
      try {
        await service.unlink(req.params.patientId as string, req.params.professionalId as string);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    async replaceAll(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await service.replaceAll(req.params.patientId as string, req.body.professionalIds);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}
