import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createProfessionalService } from "./professional.service";

type ProfessionalService = ReturnType<typeof createProfessionalService>;

export function createProfessionalController(service: ProfessionalService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const professional = await service.getById(id);
        res.status(200).json({ status: "ok", data: sanitizeOutput(professional) });
      } catch (err) { next(err); }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const search = (req.query["search"] as string) || undefined;
        const professionals = await service.list(search);
        res.status(200).json({ status: "ok", data: sanitizeOutput(professionals) });
      } catch (err) { next(err); }
    },

    async listActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const professionals = await service.listActive();
        res.status(200).json({ status: "ok", data: sanitizeOutput(professionals) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const professional = await service.create(req.body);
        res.status(201).json({ status: "ok", data: sanitizeOutput(professional) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const professional = await service.update(id, req.body);
        res.status(200).json({ status: "ok", data: sanitizeOutput(professional) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id);
        res.status(200).json({ status: "ok", message: "Profissional removido com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type ProfessionalController = ReturnType<typeof createProfessionalController>;
