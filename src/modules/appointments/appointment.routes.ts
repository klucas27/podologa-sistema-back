import { Router } from "express";
import type { AppointmentController } from "./appointment.controller";
import { validate } from "../../middlewares";
import { idParamSchema, createAppointmentSchema, updateAppointmentSchema } from "./appointment.schema";

export function createAppointmentRoutes(ctrl: AppointmentController): Router {
  const router = Router();

  router.get("/", ctrl.list);
  router.get("/patient/:patientId", ctrl.listByPatient);
  router.get("/:id", validate({ params: idParamSchema }), ctrl.findById);
  router.post("/", validate({ body: createAppointmentSchema }), ctrl.create);
  router.patch("/:id", validate({ params: idParamSchema, body: updateAppointmentSchema }), ctrl.update);
  router.delete("/:id", validate({ params: idParamSchema }), ctrl.delete);

  return router;
}
