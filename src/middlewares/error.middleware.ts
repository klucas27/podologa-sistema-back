import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors";
import { logger } from "../infra";
import { env } from "../config";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const correlationId = req.correlationId;

  // ── AppError (operational errors) ─────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, correlationId }, err.message);
    } else {
      logger.warn({ statusCode: err.statusCode, correlationId }, err.message);
    }

    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── Zod validation errors ─────────────────────
  if (err instanceof ZodError) {
    res.status(400).json({
      status: "error",
      message: "Dados inválidos",
      issues: err.issues,
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── mysql2: unique constraint violation (ER_DUP_ENTRY) ───
  if ((err as NodeJS.ErrnoException).code === "ER_DUP_ENTRY") {
    res.status(409).json({
      status: "error",
      message: "Registro já existe (violação de unicidade)",
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── mysql2: FK restrict (ER_ROW_IS_REFERENCED_2 / ER_NO_REFERENCED_ROW_2) ──
  if (
    (err as NodeJS.ErrnoException).code === "ER_ROW_IS_REFERENCED_2" ||
    (err as NodeJS.ErrnoException).code === "ER_NO_REFERENCED_ROW_2"
  ) {
    res.status(409).json({
      status: "error",
      message: "Operação bloqueada por referência existente",
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── CSRF token errors (csrf-csrf library) ───────
  if (err.message === "invalid csrf token" || err.message === "misconfigured csrf") {
    logger.warn({ correlationId, path: req.path }, `CSRF error: ${err.message}`);
    res.status(403).json({
      status: "error",
      message: "Token CSRF inválido. Recarregue a página e tente novamente.",
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── Erro genérico (não-operacional) ────────────
  logger.error({ err, correlationId, path: req.path }, "Unhandled error");

  res.status(500).json({
    status: "error",
    message: env.isProd ? "Erro interno do servidor" : err.message,
    ...(correlationId ? { correlationId } : {}),
  });
};
