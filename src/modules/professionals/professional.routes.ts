import { Router } from "express";
import type { ProfessionalController } from "./professional.controller";

export function createProfessionalRoutes(ctrl: ProfessionalController): Router {
  const router = Router();

  router.get("/", ctrl.list);
  router.get("/active", ctrl.listActive);
  router.get("/:id", ctrl.findById);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  return router;
}
