import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../configs";

/**
 * Middleware global de tratamento de erros.
 *
 * - Trata erros conhecidos do Prisma.
 * - Oculta detalhes internos em produção.
 * - Retorna resposta JSON estruturada.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(`[ERROR] ${err.message}`);

  if (env.isDev) {
    console.error(err.stack);
  }

  // ── Prisma: registro não encontrado ────────────
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res.status(404).json({
      status: "error",
      message: "Registro não encontrado",
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
    });
    return;
  }

  // ── Prisma: erro de validação ──────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: "error",
      message: "Dados inválidos na requisição",
    });
    return;
  }

  // ── Erro genérico ─────────────────────────────
  const statusCode = (err as { statusCode?: number }).statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    message: env.isProd ? "Erro interno do servidor" : err.message,
  });
};
