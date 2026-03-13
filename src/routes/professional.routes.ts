import { Router } from "express";
import {
  findProfessionalById,
  listAllProfessionals,
  listActiveProfessionalsController,
  createProfessionalController,
  updateProfessionalController,
  deleteProfessionalController,
} from "../controllers/professional.controller";

const professionalRouter = Router();

/**
 * GET /api/professionals
 * Lista todos os profissionais. Query ?search= filtra por nome ou telefone.
 */
professionalRouter.get("/", listAllProfessionals);

/**
 * GET /api/professionals/active
 * Lista apenas profissionais ativos (para selects/dropdowns).
 */
professionalRouter.get("/active", listActiveProfessionalsController);

/**
 * GET /api/professionals/:id
 * Retorna um profissional pelo ID.
 */
professionalRouter.get("/:id", findProfessionalById);

/**
 * POST /api/professionals
 * Cadastra um novo profissional.
 */
professionalRouter.post("/", createProfessionalController);

/**
 * PATCH /api/professionals/:id
 * Atualiza um profissional existente.
 */
professionalRouter.patch("/:id", updateProfessionalController);

/**
 * DELETE /api/professionals/:id
 * Remove (soft delete) um profissional.
 */
professionalRouter.delete("/:id", deleteProfessionalController);

export { professionalRouter };
