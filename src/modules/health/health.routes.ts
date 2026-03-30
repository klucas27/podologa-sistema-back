import { Router } from "express";
import type { Request, Response } from "express";
import { nowSP } from "../../shared/utils/date";

const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: nowSP().toISOString(),
    uptime: process.uptime(),
  });
});

export { healthRouter };
