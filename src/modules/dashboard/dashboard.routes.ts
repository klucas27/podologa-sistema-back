import { Router } from "express";
import type { DashboardController } from "./dashboard.controller";

export function createDashboardRoutes(ctrl: DashboardController): Router {
  const router = Router();
  router.get("/", ctrl.getData);
  return router;
}
