import { Router } from "express";
import type { AppointmentController } from "./appointment.controller";

export function createAppointmentRoutes(ctrl: AppointmentController): Router {
  const router = Router();

  router.get("/", ctrl.list);
  router.get("/patient/:patientId", ctrl.listByPatient);
  router.get("/:id", ctrl.findById);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.delete("/:id", ctrl.delete);

  return router;
}
