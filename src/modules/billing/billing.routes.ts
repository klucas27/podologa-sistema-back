import { Router } from "express";
import type { BillingController } from "./billing.controller";
import { validate } from "../../middlewares";
import { idParamSchema, appointmentIdParamSchema, createBillingSchema, updateBillingSchema } from "./billing.schema";

export function createBillingRoutes(ctrl: BillingController): Router {
  const router = Router();

  router.get("/", ctrl.listAll);
  router.get("/appointment/:appointmentId", validate({ params: appointmentIdParamSchema }), ctrl.listByAppointment);
  router.get("/:id", validate({ params: idParamSchema }), ctrl.findById);
  router.post("/", validate({ body: createBillingSchema }), ctrl.create);
  router.patch("/:id", validate({ params: idParamSchema, body: updateBillingSchema }), ctrl.update);
  router.delete("/:id", validate({ params: idParamSchema }), ctrl.delete);

  return router;
}
