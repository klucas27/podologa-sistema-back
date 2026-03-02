import type { Request, Response, NextFunction } from "express";

/**
 * Middleware global de tratamento de erros.
 * Captura qualquer erro não tratado nas rotas/middlewares.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(`[ERROR] ${err.message}`);

  if (process.env["NODE_ENV"] === "development") {
    console.error(err.stack);
  }

  res.status(500).json({
    status: "error",
    message:
      process.env["NODE_ENV"] === "production"
        ? "Erro interno do servidor"
        : err.message,
  });
};
