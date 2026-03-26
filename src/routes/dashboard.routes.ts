import { Router } from "express";
import { getDashboardController } from "../controllers/dashboard.controller";

const dashboardRouter = Router();

/**
 * GET /api/dashboard
 * Retorna métricas e dados do dashboard.
 */
dashboardRouter.get("/", getDashboardController);

export { dashboardRouter };
