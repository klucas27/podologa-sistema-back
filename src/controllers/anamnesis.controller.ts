import type { Request, Response } from "express";
import {
  getAnamnesisById,
  listAnamnesesByPatient,
  createAnamnesis,
  updateAnamnesis,
  deleteAnamnesis,
} from "../services/anamnesis.service";
import type { CreateAnamnesisInput, UpdateAnamnesisInput } from "../services/anamnesis.service";

const findAnamnesisById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const anamnesis = await getAnamnesisById(id);

  if (!anamnesis) {
    res.status(404).json({ status: "error", message: "Anamnese não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: anamnesis });
};

const listAnamnesesByPatientController = async (req: Request, res: Response): Promise<void> => {
  const patientId = req.params["patientId"] as string;
  const anamneses = await listAnamnesesByPatient(patientId);
  res.status(200).json({ status: "ok", data: anamneses });
};

const createAnamnesisController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateAnamnesisInput | undefined;

  if (!body?.patientId) {
    res.status(400).json({
      status: "error",
      message: "ID do paciente é obrigatório",
    });
    return;
  }

  const anamnesis = await createAnamnesis(body);
  res.status(201).json({ status: "ok", data: anamnesis });
};

const updateAnamnesisController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdateAnamnesisInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const anamnesis = await updateAnamnesis(id, body);

  if (!anamnesis) {
    res.status(404).json({ status: "error", message: "Anamnese não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: anamnesis });
};

const deleteAnamnesisController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deleteAnamnesis(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Anamnese não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Anamnese removida com sucesso" });
};

export {
  findAnamnesisById,
  listAnamnesesByPatientController,
  createAnamnesisController,
  updateAnamnesisController,
  deleteAnamnesisController,
};
