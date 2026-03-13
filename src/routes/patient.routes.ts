import { Router } from "express";
import {
  findPatientById,
  listAllPatients,
  createPatientController,
  updatePatientController,
  deletePatientController,
  forceDeletePatientController,
} from "../controllers/patient.controller";

const patientRouter = Router();

/**
 * GET /api/patients
 * Lista pacientes. Query ?search= filtra por nome ou telefone.
 */
patientRouter.get("/", listAllPatients);

/**
 * GET /api/patients/:id
 * Retorna um paciente pelo ID.
 */
patientRouter.get("/:id", findPatientById);

/**
 * POST /api/patients
 * Cadastra um novo paciente.
 */
patientRouter.post("/", createPatientController);

/**
 * PATCH /api/patients/:id
 * Atualiza um paciente existente.
 */
patientRouter.patch("/:id", updatePatientController);

/**
 * DELETE /api/patients/:id
 * Remove um paciente.
 */
patientRouter.delete("/:id", deletePatientController);

/**
 * DELETE /api/patients/:id/force
 * Remove um paciente e todos os registros vinculados (cascata).
 */
patientRouter.delete("/:id/force", forceDeletePatientController);

export { patientRouter };
