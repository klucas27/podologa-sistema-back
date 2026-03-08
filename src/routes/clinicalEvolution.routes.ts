import { Router } from "express";
import {
  findClinicalEvolutionById,
  listClinicalEvolutionsByAppointmentController,
  createClinicalEvolutionController,
  updateClinicalEvolutionController,
  deleteClinicalEvolutionController,
} from "../controllers/clinicalEvolution.controller";

const clinicalEvolutionRouter = Router();

/**
 * GET /api/clinical-evolutions/appointment/:appointmentId
 * Lista evoluções clínicas de um agendamento.
 */
clinicalEvolutionRouter.get("/appointment/:appointmentId", listClinicalEvolutionsByAppointmentController);

/**
 * GET /api/clinical-evolutions/:id
 * Retorna uma evolução clínica pelo ID.
 */
clinicalEvolutionRouter.get("/:id", findClinicalEvolutionById);

/**
 * POST /api/clinical-evolutions
 * Cadastra uma nova evolução clínica.
 */
clinicalEvolutionRouter.post("/", createClinicalEvolutionController);

/**
 * PATCH /api/clinical-evolutions/:id
 * Atualiza uma evolução clínica existente.
 */
clinicalEvolutionRouter.patch("/:id", updateClinicalEvolutionController);

/**
 * DELETE /api/clinical-evolutions/:id
 * Remove (soft delete) uma evolução clínica.
 */
clinicalEvolutionRouter.delete("/:id", deleteClinicalEvolutionController);

export { clinicalEvolutionRouter };
