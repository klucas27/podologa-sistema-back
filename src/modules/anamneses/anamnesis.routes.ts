import { Router } from "express";
import type { AnamnesisController } from "./anamnesis.controller";
import { validate } from "../../middlewares";
import { idParamSchema, patientIdParamSchema, createAnamnesisSchema, updateAnamnesisSchema } from "./anamnesis.schema";

export function createAnamnesisRoutes(ctrl: AnamnesisController): Router {
  const router = Router();

  router.get("/patient/:patientId", validate({ params: patientIdParamSchema }), ctrl.listByPatient);
  router.get("/:id", validate({ params: idParamSchema }), ctrl.findById);
  router.post("/", validate({ body: createAnamnesisSchema }), ctrl.create);
  router.patch("/:id", validate({ params: idParamSchema, body: updateAnamnesisSchema }), ctrl.update);
  router.delete("/:id", validate({ params: idParamSchema }), ctrl.delete);

  return router;
}
