import type { Request, Response } from "express";
import {
  getAppointmentById,
  listAppointments,
  listAppointmentsByPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../services/appointment.service";
import type { CreateAppointmentInput, UpdateAppointmentInput } from "../services/appointment.service";

const findAppointmentById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const appointment = await getAppointmentById(id);

  if (!appointment) {
    res.status(404).json({ status: "error", message: "Agendamento não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: appointment });
};

const listAllAppointments = async (_req: Request, res: Response): Promise<void> => {
  const appointments = await listAppointments();
  res.status(200).json({ status: "ok", data: appointments });
};

const listAppointmentsByPatientController = async (req: Request, res: Response): Promise<void> => {
  const patientId = req.params["patientId"] as string;
  const appointments = await listAppointmentsByPatient(patientId);
  res.status(200).json({ status: "ok", data: appointments });
};

const createAppointmentController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateAppointmentInput | undefined;

  if (!body?.patientId || !body?.userId || !body?.scheduledStart || !body?.scheduledEnd || !body?.scheduledDate) {
    res.status(400).json({
      status: "error",
      message: "Paciente, profissional, data e horários são obrigatórios",
    });
    return;
  }

  const appointment = await createAppointment(body);
  res.status(201).json({ status: "ok", data: appointment });
};

const updateAppointmentController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdateAppointmentInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const appointment = await updateAppointment(id, body);

  if (!appointment) {
    res.status(404).json({ status: "error", message: "Agendamento não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: appointment });
};

const deleteAppointmentController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deleteAppointment(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Agendamento não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Agendamento removido com sucesso" });
};

export {
  findAppointmentById,
  listAllAppointments,
  listAppointmentsByPatientController,
  createAppointmentController,
  updateAppointmentController,
  deleteAppointmentController,
};
