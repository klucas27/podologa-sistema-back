import type { Request, Response } from "express";
import { getDashboardData } from "../services/dashboard.service";
import type { KpiType, PeriodType } from "../services/dashboard.service";

const VALID_KPIS: KpiType[] = ["appointments", "patients", "revenue", "alerts"];
const VALID_PERIODS: PeriodType[] = ["daily", "weekly", "monthly", "annual"];

const getDashboardController = async (req: Request, res: Response): Promise<void> => {
  const kpiParam = String(req.query.kpi ?? "appointments");
  const periodParam = String(req.query.period ?? "weekly");

  const kpi: KpiType = VALID_KPIS.includes(kpiParam as KpiType)
    ? (kpiParam as KpiType)
    : "appointments";

  const period: PeriodType = VALID_PERIODS.includes(periodParam as PeriodType)
    ? (periodParam as PeriodType)
    : "weekly";

  const data = await getDashboardData(kpi, period);
  res.status(200).json({ status: "ok", data });
};

export { getDashboardController };
