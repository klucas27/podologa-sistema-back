import { Router } from "express";
import type { ClinicalEvolutionController } from "./clinicalEvolution.controller";

export function createClinicalEvolutionRoutes(ctrl: ClinicalEvolutionController): Router {
  const router = Router();

  router.get("/appointment/:appointmentId", ctrl.listByAppointment);
  router.get("/:id", ctrl.findById);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  return router;
}
