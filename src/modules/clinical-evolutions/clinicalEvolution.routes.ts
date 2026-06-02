import { Router } from "express";
import type { ClinicalEvolutionController } from "./clinicalEvolution.controller";
import { validate } from "../../middlewares";
import { idParamSchema, appointmentIdParamSchema, createClinicalEvolutionSchema, updateClinicalEvolutionSchema } from "./clinicalEvolution.schema";

export function createClinicalEvolutionRoutes(ctrl: ClinicalEvolutionController): Router {
  const router = Router();

  router.get("/appointment/:appointmentId", validate({ params: appointmentIdParamSchema }), ctrl.listByAppointment);
  router.get("/:id", validate({ params: idParamSchema }), ctrl.findById);
  router.post("/", validate({ body: createClinicalEvolutionSchema }), ctrl.create);
  router.patch("/:id", validate({ params: idParamSchema, body: updateClinicalEvolutionSchema }), ctrl.update);
  router.delete("/:id", validate({ params: idParamSchema }), ctrl.delete);

  return router;
}
