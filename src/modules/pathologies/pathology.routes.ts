import { Router } from "express";
import type { PathologyController } from "./pathology.controller";

export function createPathologyRoutes(ctrl: PathologyController): Router {
  const router = Router();

  router.get("/", ctrl.list);
  router.get("/:id", ctrl.findById);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  return router;
}
