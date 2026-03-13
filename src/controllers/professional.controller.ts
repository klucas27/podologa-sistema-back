import type { Request, Response } from "express";
import {
  getProfessionalById,
  listProfessionals,
  listActiveProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
} from "../services/professional.service";
import type { CreateProfessionalInput, UpdateProfessionalInput } from "../services/professional.service";

const findProfessionalById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const professional = await getProfessionalById(id);

  if (!professional) {
    res.status(404).json({ status: "error", message: "Profissional não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: professional });
};

const listAllProfessionals = async (req: Request, res: Response): Promise<void> => {
  const search = (req.query["search"] as string) || undefined;
  const professionals = await listProfessionals(search);
  res.status(200).json({ status: "ok", data: professionals });
};

const listActiveProfessionalsController = async (_req: Request, res: Response): Promise<void> => {
  const professionals = await listActiveProfessionals();
  res.status(200).json({ status: "ok", data: professionals });
};

const createProfessionalController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateProfessionalInput | undefined;

  if (!body?.fullName) {
    res.status(400).json({
      status: "error",
      message: "Nome completo é obrigatório",
    });
    return;
  }

  const professional = await createProfessional(body);
  res.status(201).json({ status: "ok", data: professional });
};

const updateProfessionalController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdateProfessionalInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const professional = await updateProfessional(id, body);

  if (!professional) {
    res.status(404).json({ status: "error", message: "Profissional não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: professional });
};

const deleteProfessionalController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deleteProfessional(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Profissional não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Profissional removido com sucesso" });
};

export {
  findProfessionalById,
  listAllProfessionals,
  listActiveProfessionalsController,
  createProfessionalController,
  updateProfessionalController,
  deleteProfessionalController,
};
