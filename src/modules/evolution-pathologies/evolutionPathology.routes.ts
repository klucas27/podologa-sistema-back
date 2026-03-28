import { Router } from "express";
import type { EvolutionPathologyController } from "./evolutionPathology.controller";

export function createEvolutionPathologyRoutes(ctrl: EvolutionPathologyController): Router {
  const router = Router();

  router.get("/evolution/:evolutionId", ctrl.listByEvolution);
  router.get("/:evolutionId/:pathologyId/:bodyPart", ctrl.findByKey);
  router.post("/", ctrl.create);
  router.patch("/:evolutionId/:pathologyId/:bodyPart", ctrl.update);
  router.delete("/:evolutionId/:pathologyId/:bodyPart", ctrl.delete);

  return router;
}
