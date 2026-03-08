import { Router } from "express";
import {
  findPathologyById,
  listAllPathologies,
  createPathologyController,
  updatePathologyController,
  deletePathologyController,
} from "../controllers/pathology.controller";

const pathologyRouter = Router();

/**
 * GET /api/pathologies
 * Lista todas as patologias.
 */
pathologyRouter.get("/", listAllPathologies);

/**
 * GET /api/pathologies/:id
 * Retorna uma patologia pelo ID.
 */
pathologyRouter.get("/:id", findPathologyById);

/**
 * POST /api/pathologies
 * Cadastra uma nova patologia.
 */
pathologyRouter.post("/", createPathologyController);

/**
 * PATCH /api/pathologies/:id
 * Atualiza uma patologia existente.
 */
pathologyRouter.patch("/:id", updatePathologyController);

/**
 * DELETE /api/pathologies/:id
 * Remove (hard delete) uma patologia.
 */
pathologyRouter.delete("/:id", deletePathologyController);

export { pathologyRouter };
