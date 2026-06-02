import { Router } from "express";
import type { EvolutionPathologyController } from "./evolutionPathology.controller";
import { validate } from "../../middlewares";
import { evolutionPathologyParamSchema, createEvolutionPathologySchema } from "./evolutionPathology.schema";

export function createEvolutionPathologyRoutes(ctrl: EvolutionPathologyController): Router {
  const router = Router();

  router.get("/evolution/:evolutionId", ctrl.listByEvolution);
  router.get("/:evolutionId/:pathologyId/:bodyPart", validate({ params: evolutionPathologyParamSchema }), ctrl.findByKey);
  router.post("/", validate({ body: createEvolutionPathologySchema }), ctrl.create);
  router.patch("/:evolutionId/:pathologyId/:bodyPart", validate({ params: evolutionPathologyParamSchema }), ctrl.update);
  router.delete("/:evolutionId/:pathologyId/:bodyPart", validate({ params: evolutionPathologyParamSchema }), ctrl.delete);

  return router;
}
