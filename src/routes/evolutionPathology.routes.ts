import { Router } from "express";
import {
  findEvolutionPathology,
  listEvolutionPathologiesByEvolution,
  createEvolutionPathologyController,
  updateEvolutionPathologyController,
  deleteEvolutionPathologyController,
} from "../controllers/evolutionPathology.controller";

const evolutionPathologyRouter = Router();

/**
 * GET /api/evolution-pathologies/evolution/:evolutionId
 * Lista patologias de uma evolução clínica.
 */
evolutionPathologyRouter.get("/evolution/:evolutionId", listEvolutionPathologiesByEvolution);

/**
 * GET /api/evolution-pathologies/:evolutionId/:pathologyId/:bodyPart
 * Retorna um registro específico pela chave composta.
 */
evolutionPathologyRouter.get("/:evolutionId/:pathologyId/:bodyPart", findEvolutionPathology);

/**
 * POST /api/evolution-pathologies
 * Cadastra uma nova patologia em uma evolução.
 */
evolutionPathologyRouter.post("/", createEvolutionPathologyController);

/**
 * PATCH /api/evolution-pathologies/:evolutionId/:pathologyId/:bodyPart
 * Atualiza um registro existente.
 */
evolutionPathologyRouter.patch("/:evolutionId/:pathologyId/:bodyPart", updateEvolutionPathologyController);

/**
 * DELETE /api/evolution-pathologies/:evolutionId/:pathologyId/:bodyPart
 * Remove (hard delete) um registro.
 */
evolutionPathologyRouter.delete("/:evolutionId/:pathologyId/:bodyPart", deleteEvolutionPathologyController);

export { evolutionPathologyRouter };
