import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
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

  // ── Prisma: registro não encontrado ────────────
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({
      status: "error",
      message: "Registro não encontrado",
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── Prisma: violação de constraint unique ──────
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    res.status(409).json({
      status: "error",
      message: "Registro já existe (violação de unicidade)",
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── Prisma: violação de FK / restrict ──────────
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2003"
  ) {
    res.status(409).json({
      status: "error",
      message: "Operação bloqueada por referência existente",
      ...(correlationId ? { correlationId } : {}),
    });
    return;
  }

  // ── Prisma: erro de validação ──────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: "error",
      message: "Dados inválidos na requisição",
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
