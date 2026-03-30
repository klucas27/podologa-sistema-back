import type { Request, Response, NextFunction } from "express";
import { sanitizeOutput } from "../../shared/utils/sanitize";
import { getDashboardData } from "./dashboard.service";
import type { KpiType, PeriodType } from "./dashboard.service";

const VALID_KPIS: KpiType[] = ["appointments", "patients", "revenue", "alerts"];
const VALID_PERIODS: PeriodType[] = ["daily", "weekly", "monthly", "annual"];

export function createDashboardController() {
  return {
    async getData(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const kpiParam = String(req.query["kpi"] ?? "appointments");
        const periodParam = String(req.query["period"] ?? "weekly");

        const kpi: KpiType = VALID_KPIS.includes(kpiParam as KpiType)
          ? (kpiParam as KpiType)
          : "appointments";

        const period: PeriodType = VALID_PERIODS.includes(periodParam as PeriodType)
          ? (periodParam as PeriodType)
          : "weekly";

        const data = await getDashboardData(kpi, period, req.user!.adminId);
        res.status(200).json({ status: "ok", data: sanitizeOutput(data) });
      } catch (err) { next(err); }
    },
  };
}

export type DashboardController = ReturnType<typeof createDashboardController>;
