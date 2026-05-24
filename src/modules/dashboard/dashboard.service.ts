import type { RowDataPacket } from "mysql2";
import { pool } from "../../infra";
import {
  nowSP,
  startOfDaySP,
  endOfDaySP,
  startOfWeekSP,
  startOfMonthSP,
  startOfYearSP,
  formatTimeSP,
  getHourInSP,
  getDayOfWeekInSP,
  getDayInSP,
  getMonthInSP,
} from "../../shared/utils/date";

export type KpiType = "appointments" | "patients" | "revenue" | "alerts";
export type PeriodType = "daily" | "weekly" | "monthly" | "annual";

export interface DashboardMetrics {
  appointments: number;
  appointmentsPrevious: number;
  newPatients: number;
  newPatientsPrevious: number;
  revenue: number;
  revenuePrevious: number;
  returnAlerts: { total: number; urgent: number };
}

export interface DashboardAppointment {
  id: string;
  patient: string;
  time: string;
  procedure: string | null;
  status: string;
}

export interface FlowDataPoint {
  day: string;
  pacientes: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ReturnAlertItem {
  id: string;
  patient: string;
  dueDate: string;
  daysOverdue: number;
  urgent: boolean;
}

export interface WaterfallDataPoint {
  label: string;
  value: number;
  type: "positive" | "negative" | "total";
}

export interface HeatmapDataPoint {
  x: string;
  y: string;
  value: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  todayAppointments: DashboardAppointment[];
  chartData: ChartDataPoint[];
  movingAverage: ChartDataPoint[];
  previousPeriodData: ChartDataPoint[];
  waterfallData: WaterfallDataPoint[];
  heatmapData: HeatmapDataPoint[];
  returnAlerts: ReturnAlertItem[];
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface PeriodRange { start: Date; end: Date; }

const getPeriodRange = (period: PeriodType): PeriodRange => {
  const now = nowSP();
  switch (period) {
    case "daily": return { start: startOfDaySP(now), end: endOfDaySP(now) };
    case "weekly": return { start: startOfWeekSP(now), end: endOfDaySP(now) };
    case "monthly": return { start: startOfMonthSP(now), end: endOfDaySP(now) };
    case "annual": return { start: startOfYearSP(now), end: endOfDaySP(now) };
  }
};

const getPreviousPeriodRange = (period: PeriodType): PeriodRange => {
  const current = getPeriodRange(period);
  switch (period) {
    case "daily": { const s = new Date(current.start.getTime() - 24 * 60 * 60 * 1000); return { start: startOfDaySP(s), end: endOfDaySP(s) }; }
    case "weekly": { const s = new Date(current.start.getTime() - 7 * 24 * 60 * 60 * 1000); const e = new Date(current.start.getTime() - 1); return { start: startOfDaySP(s), end: e }; }
    case "monthly": { const s = new Date(current.start); s.setMonth(s.getMonth() - 1); const e = new Date(current.start.getTime() - 1); return { start: startOfMonthSP(s), end: e }; }
    case "annual": { const s = new Date(current.start); s.setFullYear(s.getFullYear() - 1); const e = new Date(current.start.getTime() - 1); return { start: startOfYearSP(s), end: e }; }
  }
};

function aggregateByPeriod<T>(
  items: T[],
  period: PeriodType,
  getDate: (item: T) => Date,
  getValue?: (item: T) => number,
): ChartDataPoint[] {
  const { start, end } = getPeriodRange(period);
  const buckets = new Map<string, number>();

  if (period === "daily") {
    for (let h = 7; h <= 19; h++) buckets.set(`${String(h).padStart(2, "0")}h`, 0);
    for (const item of items) {
      const d = getDate(item);
      const hour = getHourInSP(d);
      if (hour < 7 || hour > 19) continue;
      const key = `${String(hour).padStart(2, "0")}h`;
      buckets.set(key, (buckets.get(key) ?? 0) + (getValue?.(item) ?? 1));
    }
  } else if (period === "weekly") {
    const cursor = new Date(start);
    while (cursor <= end) { buckets.set(DAY_LABELS[getDayOfWeekInSP(cursor)] ?? "", 0); cursor.setDate(cursor.getDate() + 1); }
    for (const item of items) { const d = getDate(item); const key = DAY_LABELS[getDayOfWeekInSP(d)] ?? ""; buckets.set(key, (buckets.get(key) ?? 0) + (getValue?.(item) ?? 1)); }
  } else if (period === "monthly") {
    const tempDate = new Date(start);
    tempDate.setMonth(tempDate.getMonth() + 1);
    tempDate.setDate(0);
    const daysInMonth = tempDate.getDate();
    for (let d = 1; d <= daysInMonth; d++) buckets.set(String(d), 0);
    for (const item of items) { const d = getDate(item); const key = String(getDayInSP(d)); buckets.set(key, (buckets.get(key) ?? 0) + (getValue?.(item) ?? 1)); }
  } else {
    for (let m = 0; m < 12; m++) buckets.set(MONTH_LABELS[m]!, 0);
    for (const item of items) { const d = getDate(item); const key = MONTH_LABELS[getMonthInSP(d)]!; buckets.set(key, (buckets.get(key) ?? 0) + (getValue?.(item) ?? 1)); }
  }

  return Array.from(buckets, ([label, value]) => ({ label, value }));
}

const EVOLUTIONS_FOR_ALERTS_SQL = `
  SELECT ce.id, ce.recommended_return_days, ce.created_at, p.full_name AS patient_name
  FROM clinical_evolutions ce
  JOIN appointments a ON a.id = ce.appointment_id
  JOIN patient p ON p.id = a.patient_id
  WHERE ce.deleted_at IS NULL AND ce.recommended_return_days IS NOT NULL
    AND a.deleted_at IS NULL AND a.status = 'completed'
    AND p.admin_id = ?`;

const buildAppointmentsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT scheduled_date, scheduled_start
     FROM appointments a
     JOIN patient p ON p.id = a.patient_id
     WHERE a.deleted_at IS NULL AND a.scheduled_date >= ? AND a.scheduled_date <= ?
       AND a.status != 'cancelled' AND p.admin_id = ?`,
    [start, end, adminId],
  );
  return aggregateByPeriod(rows, period, (r) =>
    period === "daily" ? r["scheduled_start"] as Date : r["scheduled_date"] as Date,
  );
};

const buildPatientsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT created_at FROM patient WHERE admin_id = ? AND created_at >= ? AND created_at <= ?",
    [adminId, start, end],
  );
  return aggregateByPeriod(rows, period, (r) => r["created_at"] as Date);
};

const buildRevenueChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT b.paid_at, b.amount
     FROM billings b
     JOIN appointments a ON a.id = b.appointment_id
     JOIN patient p ON p.id = a.patient_id
     WHERE b.deleted_at IS NULL AND b.status = 'paid'
       AND b.paid_at IS NOT NULL AND b.paid_at >= ? AND b.paid_at <= ?
       AND p.admin_id = ?`,
    [start, end, adminId],
  );
  return aggregateByPeriod(rows, period, (r) => r["paid_at"] as Date, (r) => r["amount"] as number);
};

const buildAlertsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const [rows] = await pool.execute<RowDataPacket[]>(EVOLUTIONS_FOR_ALERTS_SQL, [adminId]);
  const alertsInPeriod = (rows as Array<{ recommended_return_days: number; created_at: Date }>).filter((r) => {
    const returnDate = new Date(r.created_at);
    returnDate.setDate(returnDate.getDate() + r.recommended_return_days);
    return returnDate >= start && returnDate <= end;
  });
  const records = alertsInPeriod.map((r) => {
    const returnDate = new Date(r.created_at);
    returnDate.setDate(returnDate.getDate() + r.recommended_return_days);
    return { date: returnDate };
  });
  return aggregateByPeriod(records, period, (r) => r.date);
};

const getReturnAlertsList = async (adminId: string): Promise<ReturnAlertItem[]> => {
  const now = nowSP();
  const todayEnd = endOfDaySP(now);
  const [rows] = await pool.execute<RowDataPacket[]>(EVOLUTIONS_FOR_ALERTS_SQL, [adminId]);
  const alerts: ReturnAlertItem[] = [];
  for (const r of rows) {
    const returnDate = new Date(r["created_at"] as Date);
    returnDate.setDate(returnDate.getDate() + (r["recommended_return_days"] as number));
    if (returnDate <= todayEnd) {
      const daysOverdue = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: r["id"] as string,
        patient: r["patient_name"] as string,
        dueDate: returnDate.toISOString().slice(0, 10),
        daysOverdue,
        urgent: daysOverdue >= 7,
      });
    }
  }
  alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
  return alerts;
};

const computeMovingAverage = (data: ChartDataPoint[], window: number): ChartDataPoint[] => {
  return data.map((point, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = data.slice(start, index + 1);
    const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
    return { label: point.label, value: Math.round(avg * 100) / 100 };
  });
};

const buildPreviousPeriodPatientsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPreviousPeriodRange(period);
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT created_at FROM patient WHERE admin_id = ? AND created_at >= ? AND created_at <= ?",
    [adminId, start, end],
  );
  return aggregateByPeriod(rows, period, (r) => r["created_at"] as Date);
};

const buildWaterfallData = async (period: PeriodType, adminId: string): Promise<WaterfallDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT b.status, COALESCE(SUM(b.amount), 0) AS total
     FROM billings b
     JOIN appointments a ON a.id = b.appointment_id
     JOIN patient p ON p.id = a.patient_id
     WHERE b.deleted_at IS NULL AND b.created_at >= ? AND b.created_at <= ? AND p.admin_id = ?
     GROUP BY b.status`,
    [start, end, adminId],
  );
  const byStatus = new Map<string, number>();
  let grandTotal = 0;
  for (const r of rows) {
    const s = r["status"] as string;
    const t = r["total"] as number;
    byStatus.set(s, t);
    grandTotal += t;
  }
  return [
    { label: "Receita Bruta",  value: grandTotal,                       type: "positive" },
    { label: "Cancelados",     value: -(byStatus.get("cancelled") ?? 0), type: "negative" },
    { label: "Reembolsados",   value: -(byStatus.get("refunded") ?? 0),  type: "negative" },
    { label: "Pendentes",      value: -(byStatus.get("pending") ?? 0),   type: "negative" },
    { label: "Recebido",       value: byStatus.get("paid") ?? 0,         type: "total"    },
  ];
};

const OVERDUE_CATEGORIES = [
  { key: "1-3d",  min: 1,  max: 3  },
  { key: "4-7d",  min: 4,  max: 7  },
  { key: "8-14d", min: 8,  max: 14 },
  { key: "15-30d",min: 15, max: 30 },
  { key: "30+d",  min: 31, max: Infinity },
];

const buildHeatmapData = async (adminId: string): Promise<HeatmapDataPoint[]> => {
  const now = nowSP();
  const [rows] = await pool.execute<RowDataPacket[]>(EVOLUTIONS_FOR_ALERTS_SQL, [adminId]);
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const returnDate = new Date(r["created_at"] as Date);
    returnDate.setDate(returnDate.getDate() + (r["recommended_return_days"] as number));
    if (returnDate > now) continue;
    const daysOverdue = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue < 1) continue;
    const dayOfWeek = DAY_LABELS[getDayOfWeekInSP(returnDate)] ?? "";
    const category = OVERDUE_CATEGORIES.find((c) => daysOverdue >= c.min && daysOverdue <= c.max);
    if (!category) continue;
    const key = `${dayOfWeek}|${category.key}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const heatmap: HeatmapDataPoint[] = [];
  for (const day of DAY_LABELS) {
    for (const cat of OVERDUE_CATEGORIES) {
      heatmap.push({ x: day, y: cat.key, value: buckets.get(`${day}|${cat.key}`) ?? 0 });
    }
  }
  return heatmap;
};

export async function getDashboardData(
  kpi: KpiType = "appointments",
  period: PeriodType = "weekly",
  adminId: string,
): Promise<DashboardData> {
  const now = nowSP();
  const todayStart = startOfDaySP(now);
  const todayEnd = endOfDaySP(now);
  const { start: currentStart, end: currentEnd } = getPeriodRange(period);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period);

  const chartBuilders: Record<KpiType, () => Promise<ChartDataPoint[]>> = {
    appointments: () => buildAppointmentsChart(period, adminId),
    patients:     () => buildPatientsChart(period, adminId),
    revenue:      () => buildRevenueChart(period, adminId),
    alerts:       () => buildAlertsChart(period, adminId),
  };

  const APT_COUNT_SQL = `
    SELECT COUNT(*) AS cnt
    FROM appointments a JOIN patient p ON p.id = a.patient_id
    WHERE a.deleted_at IS NULL AND a.scheduled_date >= ? AND a.scheduled_date <= ?
      AND a.status != 'cancelled' AND p.admin_id = ?`;

  const PAT_COUNT_SQL = `SELECT COUNT(*) AS cnt FROM patient WHERE admin_id = ? AND created_at >= ? AND created_at <= ?`;

  const REV_SUM_SQL = `
    SELECT COALESCE(SUM(b.amount), 0) AS total
    FROM billings b JOIN appointments a ON a.id = b.appointment_id JOIN patient p ON p.id = a.patient_id
    WHERE b.deleted_at IS NULL AND b.status = 'paid'
      AND b.paid_at >= ? AND b.paid_at <= ? AND p.admin_id = ?`;

  const [
    [aptCurRows], [aptPrevRows],
    [patCurRows], [patPrevRows],
    [revCurRows], [revPrevRows],
    [alertRows], [todayAptRows],
    chartData, returnAlerts,
  ] = await Promise.all([
    pool.execute<RowDataPacket[]>(APT_COUNT_SQL, [currentStart, currentEnd, adminId]),
    pool.execute<RowDataPacket[]>(APT_COUNT_SQL, [prevStart, prevEnd, adminId]),
    pool.execute<RowDataPacket[]>(PAT_COUNT_SQL, [adminId, currentStart, currentEnd]),
    pool.execute<RowDataPacket[]>(PAT_COUNT_SQL, [adminId, prevStart, prevEnd]),
    pool.execute<RowDataPacket[]>(REV_SUM_SQL, [currentStart, currentEnd, adminId]),
    pool.execute<RowDataPacket[]>(REV_SUM_SQL, [prevStart, prevEnd, adminId]),
    pool.execute<RowDataPacket[]>(EVOLUTIONS_FOR_ALERTS_SQL, [adminId]),
    pool.execute<RowDataPacket[]>(
      `SELECT a.id, a.scheduled_start, a.notes, a.status, p.full_name AS patient_full_name
       FROM appointments a JOIN patient p ON p.id = a.patient_id
       WHERE a.deleted_at IS NULL AND a.scheduled_date >= ? AND a.scheduled_date <= ?
         AND a.status != 'cancelled' AND p.admin_id = ?
       ORDER BY a.scheduled_start ASC`,
      [todayStart, todayEnd, adminId],
    ),
    chartBuilders[kpi](),
    getReturnAlertsList(adminId),
  ]);

  const movingAverageWindow = period === "daily" ? 3 : period === "monthly" ? 7 : 3;
  const movingAverage = kpi === "appointments" ? computeMovingAverage(chartData, movingAverageWindow) : [];
  const previousPeriodData = kpi === "patients" ? await buildPreviousPeriodPatientsChart(period, adminId) : [];
  const waterfallData = kpi === "revenue" ? await buildWaterfallData(period, adminId) : [];
  const heatmapData = kpi === "alerts" ? await buildHeatmapData(adminId) : [];

  let urgentCount = 0;
  let totalAlerts = 0;
  for (const r of alertRows) {
    const returnDate = new Date(r["created_at"] as Date);
    returnDate.setDate(returnDate.getDate() + (r["recommended_return_days"] as number));
    if (returnDate <= todayEnd) {
      totalAlerts++;
      const daysOverdue = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue >= 7) urgentCount++;
    }
  }

  const todayAppointments: DashboardAppointment[] = todayAptRows.map((r) => ({
    id:        r["id"] as string,
    patient:   r["patient_full_name"] as string,
    time:      formatTimeSP(r["scheduled_start"] as Date),
    procedure: r["notes"] as string | null,
    status:    r["status"] as string,
  }));

  return {
    metrics: {
      appointments:         aptCurRows[0]!["cnt"] as number,
      appointmentsPrevious: aptPrevRows[0]!["cnt"] as number,
      newPatients:          patCurRows[0]!["cnt"] as number,
      newPatientsPrevious:  patPrevRows[0]!["cnt"] as number,
      revenue:              revCurRows[0]!["total"] as number,
      revenuePrevious:      revPrevRows[0]!["total"] as number,
      returnAlerts: { total: totalAlerts, urgent: urgentCount },
    },
    todayAppointments,
    chartData,
    movingAverage,
    previousPeriodData,
    waterfallData,
    heatmapData,
    returnAlerts,
  };
}
