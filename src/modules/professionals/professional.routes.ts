import { Router } from "express";
import type { ProfessionalController } from "./professional.controller";
import { validate, sensitiveLimiter } from "../../middlewares";
import { checkRole } from "../../middlewares/rbac.middleware";
import { idParamSchema, createProfessionalSchema, updateProfessionalSchema } from "./professional.schema";

export function createProfessionalRoutes(ctrl: ProfessionalController): Router {
  const router = Router();

  router.get("/", ctrl.list);
  router.get("/active", ctrl.listActive);
  router.get("/:id", validate({ params: idParamSchema }), ctrl.findById);
  router.post("/", checkRole("admin"), sensitiveLimiter, validate({ body: createProfessionalSchema }), ctrl.create);
  router.patch("/:id", checkRole("admin"), sensitiveLimiter, validate({ params: idParamSchema, body: updateProfessionalSchema }), ctrl.update);
  router.delete("/:id", checkRole("admin"), sensitiveLimiter, validate({ params: idParamSchema }), ctrl.delete);

  return router;
}
