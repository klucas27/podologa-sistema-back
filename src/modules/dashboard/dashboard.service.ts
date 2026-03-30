import { prisma } from "../../infra";
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

const buildAppointmentsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const appointments = await prisma.appointment.findMany({
    where: { deletedAt: null, scheduledDate: { gte: start, lte: end }, status: { not: "cancelled" }, patient: { adminId } },
    select: { scheduledDate: true, scheduledStart: true },
  });
  return aggregateByPeriod(appointments, period, (a) => period === "daily" ? a.scheduledStart : a.scheduledDate);
};

const buildPatientsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const patients = await prisma.patient.findMany({
    where: { adminId, createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });
  return aggregateByPeriod(patients, period, (p) => p.createdAt);
};

const buildRevenueChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const billings = await prisma.billing.findMany({
    where: { deletedAt: null, status: "paid", paidAt: { not: null, gte: start, lte: end }, appointment: { patient: { adminId } } },
    select: { paidAt: true, amount: true },
  });
  return aggregateByPeriod(billings, period, (b) => b.paidAt!, (b) => b.amount.toNumber());
};

const buildAlertsChart = async (period: PeriodType, adminId: string): Promise<ChartDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const evolutions = await prisma.clinicalEvolution.findMany({
    where: { deletedAt: null, recommendedReturnDays: { not: null }, appointment: { deletedAt: null, status: "completed", patient: { adminId } } },
    select: { recommendedReturnDays: true, createdAt: true },
  });
  const alertsInPeriod = evolutions.filter((evo) => {
    if (evo.recommendedReturnDays === null) return false;
    const returnDate = new Date(evo.createdAt);
    returnDate.setDate(returnDate.getDate() + evo.recommendedReturnDays);
    return returnDate >= start && returnDate <= end;
  });
  const records = alertsInPeriod.map((evo) => {
    const returnDate = new Date(evo.createdAt);
    returnDate.setDate(returnDate.getDate() + evo.recommendedReturnDays!);
    return { date: returnDate };
  });
  return aggregateByPeriod(records, period, (r) => r.date);
};

const getReturnAlertsList = async (adminId: string): Promise<ReturnAlertItem[]> => {
  const now = nowSP();
  const todayEnd = endOfDaySP(now);
  const evolutions = await prisma.clinicalEvolution.findMany({
    where: { deletedAt: null, recommendedReturnDays: { not: null }, appointment: { deletedAt: null, status: "completed", patient: { adminId, fullName: { not: undefined } } } },
    select: { id: true, recommendedReturnDays: true, createdAt: true, appointment: { select: { patient: { select: { fullName: true } } } } },
  });
  const alerts: ReturnAlertItem[] = [];
  for (const evo of evolutions) {
    if (evo.recommendedReturnDays === null) continue;
    const returnDate = new Date(evo.createdAt);
    returnDate.setDate(returnDate.getDate() + evo.recommendedReturnDays);
    if (returnDate <= todayEnd) {
      const daysOverdue = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({ id: evo.id, patient: evo.appointment.patient.fullName, dueDate: returnDate.toISOString().slice(0, 10), daysOverdue, urgent: daysOverdue >= 7 });
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
  const patients = await prisma.patient.findMany({ where: { adminId, createdAt: { gte: start, lte: end } }, select: { createdAt: true } });
  return aggregateByPeriod(patients, period, (p) => p.createdAt);
};

const buildWaterfallData = async (period: PeriodType, adminId: string): Promise<WaterfallDataPoint[]> => {
  const { start, end } = getPeriodRange(period);
  const billingWhere = { deletedAt: null, createdAt: { gte: start, lte: end }, appointment: { patient: { adminId } } };
  const [totalAgg, paidAgg, cancelledAgg, refundedAgg, pendingAgg] = await Promise.all([
    prisma.billing.aggregate({ where: billingWhere, _sum: { amount: true } }),
    prisma.billing.aggregate({ where: { ...billingWhere, status: "paid" }, _sum: { amount: true } }),
    prisma.billing.aggregate({ where: { ...billingWhere, status: "cancelled" }, _sum: { amount: true } }),
    prisma.billing.aggregate({ where: { ...billingWhere, status: "refunded" }, _sum: { amount: true } }),
    prisma.billing.aggregate({ where: { ...billingWhere, status: "pending" }, _sum: { amount: true } }),
  ]);
  const total = totalAgg._sum.amount?.toNumber() ?? 0;
  const paid = paidAgg._sum.amount?.toNumber() ?? 0;
  const cancelled = cancelledAgg._sum.amount?.toNumber() ?? 0;
  const refunded = refundedAgg._sum.amount?.toNumber() ?? 0;
  const pending = pendingAgg._sum.amount?.toNumber() ?? 0;
  return [
    { label: "Receita Bruta", value: total, type: "positive" },
    { label: "Cancelados", value: -cancelled, type: "negative" },
    { label: "Reembolsados", value: -refunded, type: "negative" },
    { label: "Pendentes", value: -pending, type: "negative" },
    { label: "Recebido", value: paid, type: "total" },
  ];
};

const OVERDUE_CATEGORIES = [
  { key: "1-3d", min: 1, max: 3 },
  { key: "4-7d", min: 4, max: 7 },
  { key: "8-14d", min: 8, max: 14 },
  { key: "15-30d", min: 15, max: 30 },
  { key: "30+d", min: 31, max: Infinity },
];

const buildHeatmapData = async (adminId: string): Promise<HeatmapDataPoint[]> => {
  const now = nowSP();
  const evolutions = await prisma.clinicalEvolution.findMany({
    where: { deletedAt: null, recommendedReturnDays: { not: null }, appointment: { deletedAt: null, status: "completed", patient: { adminId } } },
    select: { recommendedReturnDays: true, createdAt: true },
  });
  const buckets = new Map<string, number>();
  for (const evo of evolutions) {
    if (evo.recommendedReturnDays === null) continue;
    const returnDate = new Date(evo.createdAt);
    returnDate.setDate(returnDate.getDate() + evo.recommendedReturnDays);
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
      const key = `${day}|${cat.key}`;
      heatmap.push({ x: day, y: cat.key, value: buckets.get(key) ?? 0 });
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
    patients: () => buildPatientsChart(period, adminId),
    revenue: () => buildRevenueChart(period, adminId),
    alerts: () => buildAlertsChart(period, adminId),
  };

  const [
    appointmentsCount, appointmentsPrevCount,
    newPatientsCount, newPatientsPrevCount,
    revenueAgg, revenuePrevAgg,
    returnAlertEvolutions, todayAppointmentsList,
    chartData, returnAlerts,
  ] = await Promise.all([
    prisma.appointment.count({ where: { deletedAt: null, scheduledDate: { gte: currentStart, lte: currentEnd }, status: { not: "cancelled" }, patient: { adminId } } }),
    prisma.appointment.count({ where: { deletedAt: null, scheduledDate: { gte: prevStart, lte: prevEnd }, status: { not: "cancelled" }, patient: { adminId } } }),
    prisma.patient.count({ where: { adminId, createdAt: { gte: currentStart, lte: currentEnd } } }),
    prisma.patient.count({ where: { adminId, createdAt: { gte: prevStart, lte: prevEnd } } }),
    prisma.billing.aggregate({ where: { deletedAt: null, status: "paid", paidAt: { gte: currentStart, lte: currentEnd }, appointment: { patient: { adminId } } }, _sum: { amount: true } }),
    prisma.billing.aggregate({ where: { deletedAt: null, status: "paid", paidAt: { gte: prevStart, lte: prevEnd }, appointment: { patient: { adminId } } }, _sum: { amount: true } }),
    prisma.clinicalEvolution.findMany({ where: { deletedAt: null, recommendedReturnDays: { not: null }, appointment: { deletedAt: null, status: "completed", patient: { adminId } } }, select: { recommendedReturnDays: true, createdAt: true } }),
    prisma.appointment.findMany({ where: { deletedAt: null, scheduledDate: { gte: todayStart, lte: todayEnd }, status: { not: "cancelled" }, patient: { adminId } }, include: { patient: { select: { fullName: true } } }, orderBy: { scheduledStart: "asc" } }),
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
  for (const evo of returnAlertEvolutions) {
    if (evo.recommendedReturnDays === null) continue;
    const returnDate = new Date(evo.createdAt);
    returnDate.setDate(returnDate.getDate() + evo.recommendedReturnDays);
    if (returnDate <= todayEnd) {
      totalAlerts++;
      const daysOverdue = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue >= 7) urgentCount++;
    }
  }

  const todayAppointments: DashboardAppointment[] = todayAppointmentsList.map((apt) => ({
    id: apt.id,
    patient: apt.patient.fullName,
    time: formatTimeSP(apt.scheduledStart),
    procedure: apt.notes,
    status: apt.status,
  }));

  const revenue = revenueAgg._sum.amount?.toNumber() ?? 0;
  const revenuePrevious = revenuePrevAgg._sum.amount?.toNumber() ?? 0;

  return {
    metrics: {
      appointments: appointmentsCount,
      appointmentsPrevious: appointmentsPrevCount,
      newPatients: newPatientsCount,
      newPatientsPrevious: newPatientsPrevCount,
      revenue,
      revenuePrevious,
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
