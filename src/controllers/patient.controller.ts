import type { Request, Response } from "express";
import {
  getPatientById,
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  forceDeletePatient,
} from "../services/patient.service";
import type { CreatePatientInput, UpdatePatientInput } from "../services/patient.service";

const findPatientById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const patient = await getPatientById(id);

  if (!patient) {
    res.status(404).json({
      status: "error",
      message: "Paciente não encontrado",
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    data: patient,
  });
};

const listAllPatients = async (req: Request, res: Response): Promise<void> => {
  const search = (req.query["search"] as string) || undefined;
  const patients = await listPatients(search);
  res.status(200).json({ status: "ok", data: patients });
};

const createPatientController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const body = req.body as CreatePatientInput | undefined;

  if (!body?.fullName || !body?.cpf) {
    res.status(400).json({
      status: "error",
      message: "Nome completo e CPF são obrigatórios",
    });
    return;
  }

  const patient = await createPatient(body);

  res.status(201).json({
    status: "ok",
    data: patient,
  });
};

const updatePatientController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdatePatientInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const patient = await updatePatient(id, body);

  if (!patient) {
    res.status(404).json({ status: "error", message: "Paciente não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: patient });
};

const deletePatientController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deletePatient(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Paciente não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Paciente removido com sucesso" });
};

const forceDeletePatientController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await forceDeletePatient(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Paciente não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Paciente e todos os registros vinculados removidos com sucesso" });
};

export {
  findPatientById,
  listAllPatients,
  createPatientController,
  updatePatientController,
  deletePatientController,
  forceDeletePatientController,
};
