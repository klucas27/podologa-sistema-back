import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createProfessionalService } from "./professional.service";

type ProfessionalService = ReturnType<typeof createProfessionalService>;

function getTenantContext(req: Request) {
  return {
    userId: req.user!.userId,
    adminId: req.user!.adminId,
    role: req.user!.role,
  };
}

export function createProfessionalController(service: ProfessionalService) {
  return {
    async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const professional = await service.getById(id, getTenantContext(req));
        res.status(200).json({ status: "ok", data: sanitizeOutput(professional) });
      } catch (err) { next(err); }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const search = (req.query["search"] as string) || undefined;
        const professionals = await service.list(getTenantContext(req), search);
        res.status(200).json({ status: "ok", data: sanitizeOutput(professionals) });
      } catch (err) { next(err); }
    },

    async listActive(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const professionals = await service.listActive(getTenantContext(req));
        res.status(200).json({ status: "ok", data: sanitizeOutput(professionals) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const professional = await service.create(req.body, getTenantContext(req));
        res.status(201).json({ status: "ok", data: sanitizeOutput(professional) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        const professional = await service.update(id, req.body, getTenantContext(req));
        res.status(200).json({ status: "ok", data: sanitizeOutput(professional) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = req.params["id"] as string;
        await service.delete(id, getTenantContext(req));
        res.status(200).json({ status: "ok", message: "Profissional removido com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type ProfessionalController = ReturnType<typeof createProfessionalController>;
