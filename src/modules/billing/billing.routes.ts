import { Router } from "express";
import type { BillingController } from "./billing.controller";

export function createBillingRoutes(ctrl: BillingController): Router {
  const router = Router();

  router.get("/", ctrl.listAll);
  router.get("/appointment/:appointmentId", ctrl.listByAppointment);
  router.get("/:id", ctrl.findById);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  return router;
}
