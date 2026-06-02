import { Router } from "express";
import type { PatientController } from "./patient.controller";
import { validate, sensitiveLimiter } from "../../middlewares";
import { checkRole } from "../../middlewares/rbac.middleware";
import { idParamSchema, createPatientSchema, updatePatientSchema } from "./patient.schema";

export function createPatientRoutes(ctrl: PatientController): Router {
  const router = Router();

  router.get("/", ctrl.list);
  router.get("/:id", validate({ params: idParamSchema }), ctrl.findById);
  router.post("/", sensitiveLimiter, validate({ body: createPatientSchema }), ctrl.create);
  router.patch("/:id", sensitiveLimiter, validate({ params: idParamSchema, body: updatePatientSchema }), ctrl.update);
  router.delete("/:id", sensitiveLimiter, validate({ params: idParamSchema }), ctrl.delete);
  router.delete("/:id/force", checkRole("admin"), sensitiveLimiter, validate({ params: idParamSchema }), ctrl.forceDelete);

  return router;
}
