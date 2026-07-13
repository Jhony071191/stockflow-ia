import type { AnalyzedInventoryItem } from "./inventory";

export type CountFrequency = 1 | 2;

export type CycleCountPlan = {
  clientName: string;
  year: number;
  frequency: CountFrequency;
  firstDate: string;
  secondDate: string;
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

const parseDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

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
    row.item.abcClass,
    row.item.currentStock,
    row.physicalCount ?? "Pendiente",
    row.difference ?? "",
    row.differencePct === null ? "" : row.differencePct.toFixed(2),
    row.hasDiscrepancy ? "Sí" : "No",
  ]);
  return [headers, ...rows].map((row) => row.map(quoteCsv).join(";")).join("\n");
}
