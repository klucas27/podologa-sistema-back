import type { Request, Response } from "express";

/**
 * Middleware para rotas não encontradas (404).
 */
export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({
    status: "error",
    message: "Rota não encontrada",
  });
};
