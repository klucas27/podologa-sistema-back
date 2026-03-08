import type { Request, Response } from "express";
import {
  getClinicalEvolutionById,
  listClinicalEvolutionsByAppointment,
  createClinicalEvolution,
  updateClinicalEvolution,
  deleteClinicalEvolution,
} from "../services/clinicalEvolution.service";
import type { CreateClinicalEvolutionInput, UpdateClinicalEvolutionInput } from "../services/clinicalEvolution.service";

const findClinicalEvolutionById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const evolution = await getClinicalEvolutionById(id);

  if (!evolution) {
    res.status(404).json({ status: "error", message: "Evolução clínica não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: evolution });
};

const listClinicalEvolutionsByAppointmentController = async (req: Request, res: Response): Promise<void> => {
  const appointmentId = req.params["appointmentId"] as string;
  const evolutions = await listClinicalEvolutionsByAppointment(appointmentId);
  res.status(200).json({ status: "ok", data: evolutions });
};

const createClinicalEvolutionController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateClinicalEvolutionInput | undefined;

  if (!body?.appointmentId) {
    res.status(400).json({
      status: "error",
      message: "ID do agendamento é obrigatório",
    });
    return;
  }

  const evolution = await createClinicalEvolution(body);
  res.status(201).json({ status: "ok", data: evolution });
};

const updateClinicalEvolutionController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdateClinicalEvolutionInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const evolution = await updateClinicalEvolution(id, body);

  if (!evolution) {
    res.status(404).json({ status: "error", message: "Evolução clínica não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: evolution });
};

const deleteClinicalEvolutionController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deleteClinicalEvolution(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Evolução clínica não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Evolução clínica removida com sucesso" });
};

export {
  findClinicalEvolutionById,
  listClinicalEvolutionsByAppointmentController,
  createClinicalEvolutionController,
  updateClinicalEvolutionController,
  deleteClinicalEvolutionController,
};
