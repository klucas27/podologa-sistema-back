import { Router } from "express";
import {
  findAppointmentById,
  listAllAppointments,
  listAppointmentsByPatientController,
  createAppointmentController,
  updateAppointmentController,
  deleteAppointmentController,
} from "../controllers/appointment.controller";

const appointmentRouter = Router();

/**
 * GET /api/appointments
 * Lista todos os agendamentos.
 */
appointmentRouter.get("/", listAllAppointments);

/**
 * GET /api/appointments/patient/:patientId
 * Lista agendamentos de um paciente.
 */
appointmentRouter.get("/patient/:patientId", listAppointmentsByPatientController);

/**
 * GET /api/appointments/:id
 * Retorna um agendamento pelo ID.
 */
appointmentRouter.get("/:id", findAppointmentById);

/**
 * POST /api/appointments
 * Cadastra um novo agendamento.
 */
appointmentRouter.post("/", createAppointmentController);

/**
 * PATCH /api/appointments/:id
 * Atualiza um agendamento existente.
 */
appointmentRouter.patch("/:id", updateAppointmentController);

/**
 * DELETE /api/appointments/:id
 * Remove (soft delete) um agendamento.
 */
appointmentRouter.delete("/:id", deleteAppointmentController);

export { appointmentRouter };
