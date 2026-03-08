import { Router } from "express";
import { findPatientById } from "../controllers";

const patientRouter = Router();

/**
 * GET /api/patients/:id
 * Retorna um paciente pelo ID.
 */
patientRouter.get("/:id", findPatientById);

export { patientRouter };
