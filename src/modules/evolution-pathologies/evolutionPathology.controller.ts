import type { Request, Response, NextFunction } from "express";
import type { BodyPart } from "../../types/models";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import type { createEvolutionPathologyService } from "./evolutionPathology.service";

type EvolutionPathologyService = ReturnType<typeof createEvolutionPathologyService>;

export function createEvolutionPathologyController(service: EvolutionPathologyService) {
  return {
    async findByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const evolutionId = req.params["evolutionId"] as string;
        const pathologyId = req.params["pathologyId"] as string;
        const bodyPart = req.params["bodyPart"] as BodyPart;
        const record = await service.getByKey({ evolutionId, pathologyId, bodyPart }, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(record) });
      } catch (err) { next(err); }
    },

    async listByEvolution(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const evolutionId = req.params["evolutionId"] as string;
        const records = await service.listByEvolution(evolutionId, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(records) });
      } catch (err) { next(err); }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const record = await service.create(req.body, req.user!);
        res.status(201).json({ status: "ok", data: sanitizeOutput(record) });
      } catch (err) { next(err); }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const evolutionId = req.params["evolutionId"] as string;
        const pathologyId = req.params["pathologyId"] as string;
        const bodyPart = req.params["bodyPart"] as BodyPart;
        const record = await service.update({ evolutionId, pathologyId, bodyPart }, req.body, req.user!);
        res.status(200).json({ status: "ok", data: sanitizeOutput(record) });
      } catch (err) { next(err); }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const evolutionId = req.params["evolutionId"] as string;
        const pathologyId = req.params["pathologyId"] as string;
        const bodyPart = req.params["bodyPart"] as BodyPart;
        await service.delete({ evolutionId, pathologyId, bodyPart }, req.user!);
        res.status(200).json({ status: "ok", message: "Registro removido com sucesso" });
      } catch (err) { next(err); }
    },
  };
}

export type EvolutionPathologyController = ReturnType<typeof createEvolutionPathologyController>;
