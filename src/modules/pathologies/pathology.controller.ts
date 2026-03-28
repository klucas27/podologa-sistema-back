import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createPathologyService } from "./pathology.service";

type PathologyService = ReturnType<typeof createPathologyService>;

export function createPathologyController(service: PathologyService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const pathology = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(pathology) });
      } catch (err) { next(err); }
    },

    async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const pathologies = await service.list();
        res.status(200).json({ status: "ok", data: sanitizeOutput(pathologies) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const pathology = await service.create(req.body);
        res.status(201).json({ status: "ok", data: sanitizeOutput(pathology) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const pathology = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(pathology) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Patologia removida com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type PathologyController = ReturnType<typeof createPathologyController>;
