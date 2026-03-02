import { Router } from "express";
import type { Request, Response } from "express";

const healthRouter = Router();

/**
 * GET /api/health
 * Retorna o status do servidor (útil para monitoramento).
 */
healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { healthRouter };
