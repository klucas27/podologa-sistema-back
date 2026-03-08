import type { Request, Response } from "express";
import { getPatientById } from "../services";

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

export { findPatientById };
