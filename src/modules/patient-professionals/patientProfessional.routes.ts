import { Router } from "express";
import type { PatientProfessionalService } from "./patientProfessional.service";
import { createPatientProfessionalController } from "./patientProfessional.controller";

export function createPatientProfessionalRoutes(service: PatientProfessionalService) {
  const router = Router({ mergeParams: true });
  const ctrl = createPatientProfessionalController(service);

  router.get("/", ctrl.list);
  router.post("/", ctrl.link);
  router.put("/", ctrl.replaceAll);
  router.delete("/:professionalId", ctrl.unlink);

  return router;
}
