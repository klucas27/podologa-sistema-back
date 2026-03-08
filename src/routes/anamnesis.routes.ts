import { Router } from "express";
import {
  findAnamnesisById,
  listAnamnesesByPatientController,
  createAnamnesisController,
  updateAnamnesisController,
  deleteAnamnesisController,
} from "../controllers/anamnesis.controller";

const anamnesisRouter = Router();

/**
 * GET /api/anamneses/patient/:patientId
 * Lista anamneses de um paciente.
 */
anamnesisRouter.get("/patient/:patientId", listAnamnesesByPatientController);

/**
 * GET /api/anamneses/:id
 * Retorna uma anamnese pelo ID.
 */
anamnesisRouter.get("/:id", findAnamnesisById);

/**
 * POST /api/anamneses
 * Cadastra uma nova anamnese.
 */
anamnesisRouter.post("/", createAnamnesisController);

/**
 * PATCH /api/anamneses/:id
 * Atualiza uma anamnese existente.
 */
anamnesisRouter.patch("/:id", updateAnamnesisController);

/**
 * DELETE /api/anamneses/:id
 * Remove (soft delete) uma anamnese.
 */
anamnesisRouter.delete("/:id", deleteAnamnesisController);

export { anamnesisRouter };
