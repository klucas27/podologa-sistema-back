import { Router } from "express";
import type { AnamnesisController } from "./anamnesis.controller";

export function createAnamnesisRoutes(ctrl: AnamnesisController): Router {
  const router = Router();

  router.get("/patient/:patientId", ctrl.listByPatient);
  router.get("/:id", ctrl.findById);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  return router;
}
