import type { AnalyzedInventoryItem } from "./inventory";
import type { WarehouseCycleCountData, WarehouseCycleCountRecord } from "./warehouse";

export type CountFrequency = 1 | 2;

export type CycleCountPlan = {
  clientName: string;
  year: number;
  frequency: CountFrequency;
  firstDate: string;
  secondDate: string;
  graceCount: boolean;
  graceDate: string;
  tolerancePct: number;
};

export type CountCampaign = {
  id: string;
  number: number;
  label: string;
  date: string;
};

export type CountResultRow = {
  item: AnalyzedInventoryItem;
  physicalCount: number | null;
  difference: number | null;
  differencePct: number | null;
  hasDiscrepancy: boolean;
};

export type CountMetrics = {
  rows: CountResultRow[];
  counted: number;
  pending: number;
  progressPct: number;
  discrepancies: number;
  exactMatches: number;
  accuracyPct: number;
  valueDifference: number;
};

export type LocationCountProgressStatus = "complete" | "on-track" | "urgent" | "overdue" | "no-deadline";

export type LocationCountProgress = {
  campaign: string;
  deadline: string;
  targetDate: string;
  workdaysPerWeek: 5 | 6 | 7;
  total: number;
  counted: number;
  pending: number;
  excluded: number;
  progressPct: number;
  remainingWorkdays: number;
  dailyTarget: number;
  status: LocationCountProgressStatus;
  pendingRecords: WarehouseCycleCountRecord[];
};

const parseDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function subtractOneMonth(dateValue: string) {
  const date = parseDate(dateValue);
  if (!date) return "";
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return isoDate(date);
}

export function countOperationalDays(startValue: string, endValue: string, workdaysPerWeek: 5 | 6 | 7) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end || start > end) return 0;
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getDay();
    const operational = workdaysPerWeek === 7
      || (workdaysPerWeek === 6 && weekday !== 0)
      || (workdaysPerWeek === 5 && weekday !== 0 && weekday !== 6);
    if (operational) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function calculateLocationCountProgress(
  data: WarehouseCycleCountData | undefined,
  todayValue = new Date().toISOString().slice(0, 10),
): LocationCountProgress | null {
  if (!data?.records.length) return null;
  const eligible = data.records.filter((record) => record.status !== "excluded");
  const counted = eligible.filter((record) => record.status === "counted").length;
  const pendingRecords = eligible
    .filter((record) => record.status === "pending")
    .sort((left, right) => Number(right.zone === "APQ") - Number(left.zone === "APQ")
      || right.pendingPicking - left.pendingPicking
      || Number(right.level === 1) - Number(left.level === 1)
      || left.aisle - right.aisle
      || left.bay - right.bay
      || left.level - right.level);
  const pending = pendingRecords.length;
  const targetDate = subtractOneMonth(data.deadline);
  const remainingWorkdays = targetDate
    ? countOperationalDays(todayValue, targetDate, data.workdaysPerWeek)
    : 0;
  const dailyTarget = pending === 0 || !targetDate
    ? 0
    : Math.ceil(pending / Math.max(1, remainingWorkdays));
  const today = parseDate(todayValue);
  const target = parseDate(targetDate);
  const status: LocationCountProgressStatus = pending === 0
    ? "complete"
    : !target
      ? "no-deadline"
      : today && today > target
        ? "overdue"
        : remainingWorkdays <= 5
          ? "urgent"
          : "on-track";

  return {
    campaign: data.campaign,
    deadline: data.deadline,
    targetDate,
    workdaysPerWeek: data.workdaysPerWeek,
    total: eligible.length,
    counted,
    pending,
    excluded: data.records.length - eligible.length,
    progressPct: eligible.length ? counted / eligible.length * 100 : 0,
    remainingWorkdays,
    dailyTarget,
    status,
    pendingRecords,
  };
}

export function exportPendingLocationsCsv(progress: LocationCountProgress) {
  const headers = [
    "campana", "fecha_final", "objetivo_anticipado", "ritmo_diario", "ubicacion", "zona", "familia",
    "pasillo", "modulo", "altura", "sku", "producto", "stock_sistema", "picking_pendiente", "estado",
  ];
  const rows = progress.pendingRecords.map((record) => [
    progress.campaign,
    progress.deadline,
    progress.targetDate,
    progress.dailyTarget,
    record.sourceLocationCode || record.locationCode,
    record.zone,
    record.family,
    record.aisle,
    record.bay,
    record.level,
    record.skus.join(" | "),
    record.products.join(" | "),
    record.systemQuantity,
    record.pendingPicking,
    "Pendiente",
  ]);
  return [headers, ...rows].map((row) => row.map(quoteCsv).join(";")).join("\n");
}

export function addSixMonths(dateValue: string) {
  const date = parseDate(dateValue);
  if (!date) return dateValue;
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 6);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return date.toISOString().slice(0, 10);
}

export function createCountCampaigns(plan: CycleCountPlan): CountCampaign[] {
  const campaigns: CountCampaign[] = [{
    id: `${plan.year}-1`,
    number: 1,
    label: plan.frequency === 1 ? "Conteo anual" : "Primer conteo",
    date: plan.firstDate,
  }];

  if (plan.frequency === 2) {
    campaigns.push({
      id: `${plan.year}-2`,
      number: 2,
      label: "Segundo conteo",
      date: plan.secondDate || addSixMonths(plan.firstDate),
    });
  }

  if (plan.graceCount) {
    campaigns.push({
      id: `${plan.year}-gracia`,
      number: campaigns.length + 1,
      label: "Conteo de gracia",
      date: plan.graceDate || plan.secondDate || addSixMonths(plan.firstDate),
    });
  }

  return campaigns;
}

export function calculateCountMetrics(
  items: AnalyzedInventoryItem[],
  entries: Record<string, string>,
  tolerancePct: number,
): CountMetrics {
  const rows = items.map((item) => {
    const rawValue = entries[item.sku];
    const parsed = rawValue === undefined || rawValue === "" ? null : Number(rawValue);
    const physicalCount = parsed !== null && Number.isFinite(parsed) ? Math.max(0, parsed) : null;
    const difference = physicalCount === null ? null : physicalCount - item.currentStock;
    const differencePct = difference === null
      ? null
      : item.currentStock === 0
        ? Math.abs(difference) > 0 ? 100 : 0
        : Math.abs(difference) / item.currentStock * 100;

    return {
      item,
      physicalCount,
      difference,
      differencePct,
      hasDiscrepancy: differencePct !== null && differencePct > tolerancePct,
    };
  });

  const countedRows = rows.filter((row) => row.physicalCount !== null);
  const systemUnits = countedRows.reduce((sum, row) => sum + row.item.currentStock, 0);
  const absoluteDifference = countedRows.reduce((sum, row) => sum + Math.abs(row.difference ?? 0), 0);
  const accuracyPct = countedRows.length
    ? Math.max(0, 100 - (systemUnits > 0 ? absoluteDifference / systemUnits * 100 : 0))
    : 0;

  return {
    rows,
    counted: countedRows.length,
    pending: rows.length - countedRows.length,
    progressPct: rows.length ? countedRows.length / rows.length * 100 : 0,
    discrepancies: countedRows.filter((row) => row.hasDiscrepancy).length,
    exactMatches: countedRows.filter((row) => row.difference === 0).length,
    accuracyPct,
    valueDifference: countedRows.reduce((sum, row) => sum + (row.difference ?? 0) * row.item.unitCost, 0),
  };
}

const quoteCsv = (value: string | number) => {
  const text = String(value).replace(/"/g, '""');
  return /[;"\n]/.test(text) ? `"${text}"` : text;
};

export function exportCountCsv(
  plan: CycleCountPlan,
  campaign: CountCampaign,
  metrics: CountMetrics,
) {
  const headers = [
    "cliente",
    "campana",
    "fecha",
    "sku",
    "producto",
    "clase_abc",
    "stock_sistema",
    "conteo_fisico",
    "diferencia",
    "diferencia_pct",
    "fuera_tolerancia",
  ];
  const rows = metrics.rows.map((row) => [
    plan.clientName,
    campaign.label,
    campaign.date,
    row.item.sku,
    row.item.product,
    row.item.abcAvailable ? row.item.abcClass : "No disponible",
    row.item.currentStock,
    row.physicalCount ?? "Pendiente",
    row.difference ?? "",
    row.differencePct === null ? "" : row.differencePct.toFixed(2),
    row.hasDiscrepancy ? "Sí" : "No",
  ]);
  return [headers, ...rows].map((row) => row.map(quoteCsv).join(";")).join("\n");
}
