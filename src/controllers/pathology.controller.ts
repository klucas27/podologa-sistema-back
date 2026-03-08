import type { Request, Response } from "express";
import {
  getPathologyById,
  listPathologies,
  createPathology,
  updatePathology,
  deletePathology,
} from "../services/pathology.service";
import type { CreatePathologyInput, UpdatePathologyInput } from "../services/pathology.service";

const findPathologyById = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const pathology = await getPathologyById(id);

  if (!pathology) {
    res.status(404).json({ status: "error", message: "Patologia não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: pathology });
};

const listAllPathologies = async (_req: Request, res: Response): Promise<void> => {
  const pathologies = await listPathologies();
  res.status(200).json({ status: "ok", data: pathologies });
};

const createPathologyController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreatePathologyInput | undefined;

  if (!body?.name) {
    res.status(400).json({
      status: "error",
      message: "Nome da patologia é obrigatório",
    });
    return;
  }

  const pathology = await createPathology(body);
  res.status(201).json({ status: "ok", data: pathology });
};

const updatePathologyController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const body = req.body as UpdatePathologyInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const pathology = await updatePathology(id, body);

  if (!pathology) {
    res.status(404).json({ status: "error", message: "Patologia não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", data: pathology });
};

const deletePathologyController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const deleted = await deletePathology(id);

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Patologia não encontrada" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Patologia removida com sucesso" });
};

export {
  findPathologyById,
  listAllPathologies,
  createPathologyController,
  updatePathologyController,
  deletePathologyController,
};
