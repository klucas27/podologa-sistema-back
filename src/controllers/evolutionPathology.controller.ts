import type { Request, Response } from "express";
import {
  getEvolutionPathology,
  listByEvolution,
  createEvolutionPathology,
  updateEvolutionPathology,
  deleteEvolutionPathology,
} from "../services/evolutionPathology.service";
import type {
  CreateEvolutionPathologyInput,
  UpdateEvolutionPathologyInput,
} from "../services/evolutionPathology.service";
import type { BodyPart } from "@prisma/client";

const findEvolutionPathology = async (req: Request, res: Response): Promise<void> => {
  const evolutionId = req.params["evolutionId"] as string;
  const pathologyId = req.params["pathologyId"] as string;
  const bodyPart = req.params["bodyPart"] as BodyPart;

  const record = await getEvolutionPathology({ evolutionId, pathologyId, bodyPart });

  if (!record) {
    res.status(404).json({ status: "error", message: "Registro não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: record });
};

const listEvolutionPathologiesByEvolution = async (req: Request, res: Response): Promise<void> => {
  const evolutionId = req.params["evolutionId"] as string;
  const records = await listByEvolution(evolutionId);
  res.status(200).json({ status: "ok", data: records });
};

const createEvolutionPathologyController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateEvolutionPathologyInput | undefined;

  if (!body?.evolutionId || !body?.pathologyId || !body?.bodyPart) {
    res.status(400).json({
      status: "error",
      message: "ID da evolução, ID da patologia e parte do corpo são obrigatórios",
    });
    return;
  }

  const record = await createEvolutionPathology(body);
  res.status(201).json({ status: "ok", data: record });
};

const updateEvolutionPathologyController = async (req: Request, res: Response): Promise<void> => {
  const evolutionId = req.params["evolutionId"] as string;
  const pathologyId = req.params["pathologyId"] as string;
  const bodyPart = req.params["bodyPart"] as BodyPart;

  const body = req.body as UpdateEvolutionPathologyInput | undefined;

  if (!body || Object.keys(body).length === 0) {
    res.status(400).json({ status: "error", message: "Nenhum dado para atualizar" });
    return;
  }

  const record = await updateEvolutionPathology(
    { evolutionId, pathologyId, bodyPart },
    body,
  );

  if (!record) {
    res.status(404).json({ status: "error", message: "Registro não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", data: record });
};

const deleteEvolutionPathologyController = async (req: Request, res: Response): Promise<void> => {
  const evolutionId = req.params["evolutionId"] as string;
  const pathologyId = req.params["pathologyId"] as string;
  const bodyPart = req.params["bodyPart"] as BodyPart;

  const deleted = await deleteEvolutionPathology({ evolutionId, pathologyId, bodyPart });

  if (!deleted) {
    res.status(404).json({ status: "error", message: "Registro não encontrado" });
    return;
  }

  res.status(200).json({ status: "ok", message: "Registro removido com sucesso" });
};

export {
  findEvolutionPathology,
  listEvolutionPathologiesByEvolution,
  createEvolutionPathologyController,
  updateEvolutionPathologyController,
  deleteEvolutionPathologyController,
};
