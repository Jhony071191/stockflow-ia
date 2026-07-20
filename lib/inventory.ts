export type RawInventoryItem = {
  sku: string;
  product: string;
  category: string;
  currentStock: number;
  unitCost: number;
  leadTimeDays: number;
  safetyStock: number;
  salesM1: number;
  salesM2: number;
  salesM3: number;
  expiryDate?: string;
  dataQuality?: {
    productAvailable?: boolean;
    familyAvailable?: boolean;
    unitCostAvailable?: boolean;
    demandAvailable?: boolean;
  };
};

export type StockStatus = "critical" | "attention" | "stable";
export type AbcClass = "A" | "B" | "C";

export type AnalyzedInventoryItem = RawInventoryItem & {
  demandAvailable: boolean;
  unitCostAvailable: boolean;
  abcAvailable: boolean;
  averageMonthlyDemand: number;
  demandVariability: number;
  consumptionValue: number;
  abcClass: AbcClass;
  coverageDays: number;
  reorderPoint: number;
  suggestedOrder: number;
  stockValue: number;
  rotationMonthly: number;
  status: StockStatus;
  statusLabel: "Crítico" | "Atención" | "Estable";
  situation: string;
  recommendation: string;
  priorityScore: number;
  expiryDays: number | null;
  isOverstock: boolean;
};

export type InventorySummary = {
  totalStockValue: number;
  riskCount: number;
  overstockCount: number;
  averageCoverage: number;
  immobilizedValue: number;
  actionTodayCount: number;
  totalSuggestedOrder: number;
  suggestedOrderCost: number;
};

export type InventoryAnalysis = {
  items: AnalyzedInventoryItem[];
  summary: InventorySummary;
};

export type CsvParseResult = {
  items: RawInventoryItem[];
  errors: string[];
};

export const SAMPLE_INVENTORY: RawInventoryItem[] = [
  { sku: "SKU-1042", product: "Aceite de oliva 1 L", category: "Alimentación", currentStock: 18, unitCost: 6.8, leadTimeDays: 12, safetyStock: 28, salesM1: 214, salesM2: 198, salesM3: 221, expiryDate: "2026-11-30" },
  { sku: "SKU-0981", product: "Leche UHT caja", category: "Alimentación", currentStock: 24, unitCost: 14.2, leadTimeDays: 8, safetyStock: 36, salesM1: 182, salesM2: 196, salesM3: 177, expiryDate: "2026-08-18" },
  { sku: "SKU-2087", product: "Café premium 500 g", category: "Alimentación", currentStock: 196, unitCost: 9.5, leadTimeDays: 10, safetyStock: 18, salesM1: 47, salesM2: 52, salesM3: 50, expiryDate: "2026-09-10" },
  { sku: "SKU-3124", product: "Guantes nitrilo M", category: "Higiene", currentStock: 260, unitCost: 12.3, leadTimeDays: 18, safetyStock: 95, salesM1: 195, salesM2: 214, salesM3: 202 },
  { sku: "SKU-4410", product: "Detergente 3 L", category: "Limpieza", currentStock: 94, unitCost: 7.1, leadTimeDays: 9, safetyStock: 20, salesM1: 42, salesM2: 48, salesM3: 43 },
  { sku: "SKU-1880", product: "Arroz largo 1 kg", category: "Alimentación", currentStock: 340, unitCost: 1.2, leadTimeDays: 7, safetyStock: 90, salesM1: 271, salesM2: 263, salesM3: 276, expiryDate: "2027-01-12" },
  { sku: "SKU-5201", product: "Cajas automontables M", category: "Embalaje", currentStock: 4200, unitCost: 1.15, leadTimeDays: 21, safetyStock: 1000, salesM1: 1600, salesM2: 1880, salesM3: 1720 },
  { sku: "SKU-6318", product: "Film estirable industrial", category: "Embalaje", currentStock: 88, unitCost: 38.5, leadTimeDays: 16, safetyStock: 24, salesM1: 71, salesM2: 65, salesM3: 78 },
  { sku: "SKU-7450", product: "Lector de código de barras", category: "Tecnología", currentStock: 14, unitCost: 175, leadTimeDays: 28, safetyStock: 8, salesM1: 12, salesM2: 17, salesM3: 14 },
  { sku: "SKU-7722", product: "Sensor industrial IP67", category: "Mantenimiento", currentStock: 110, unitCost: 210, leadTimeDays: 35, safetyStock: 30, salesM1: 46, salesM2: 41, salesM3: 55 },
  { sku: "SKU-8105", product: "Motor eléctrico 2,2 kW", category: "Mantenimiento", currentStock: 44, unitCost: 720, leadTimeDays: 45, safetyStock: 12, salesM1: 20, salesM2: 24, salesM3: 22 },
  { sku: "SKU-8520", product: "Calzado de seguridad", category: "Protección", currentStock: 85, unitCost: 42, leadTimeDays: 24, safetyStock: 26, salesM1: 58, salesM2: 64, salesM3: 61 },
  { sku: "SKU-8892", product: "Tóner láser negro", category: "Oficina", currentStock: 76, unitCost: 52, leadTimeDays: 14, safetyStock: 18, salesM1: 29, salesM2: 34, salesM3: 31 },
  { sku: "SKU-9104", product: "Palé europeo homologado", category: "Logística", currentStock: 650, unitCost: 13, leadTimeDays: 12, safetyStock: 180, salesM1: 510, salesM2: 555, salesM3: 492 },
  { sku: "SKU-9338", product: "Etiquetas térmicas 100×150", category: "Embalaje", currentStock: 310, unitCost: 16.4, leadTimeDays: 11, safetyStock: 95, salesM1: 245, salesM2: 232, salesM3: 260 },
  { sku: "SKU-9511", product: "Lubricante industrial 20 L", category: "Mantenimiento", currentStock: 60, unitCost: 68, leadTimeDays: 19, safetyStock: 22, salesM1: 16, salesM2: 15, salesM3: 17 },
  { sku: "SKU-9740", product: "Mascarilla FFP2 caja", category: "Protección", currentStock: 410, unitCost: 18.5, leadTimeDays: 15, safetyStock: 120, salesM1: 330, salesM2: 305, salesM3: 348, expiryDate: "2026-12-20" },
  { sku: "SKU-9908", product: "Cable USB-C reforzado", category: "Tecnología", currentStock: 520, unitCost: 8.9, leadTimeDays: 22, safetyStock: 110, salesM1: 92, salesM2: 105, salesM3: 88 },
];

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const standardDeviation = (values: number[], mean: number) => {
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const daysUntil = (date?: string): number | null => {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((parsed.getTime() - today.getTime()) / 86_400_000);
};

export function analyzeInventory(rawItems: RawInventoryItem[]): InventoryAnalysis {
  const baseItems = rawItems.map((item) => {
    const demandAvailable = item.dataQuality?.demandAvailable !== false;
    const unitCostAvailable = item.dataQuality?.unitCostAvailable !== false;
    const sales = [item.salesM1, item.salesM2, item.salesM3];
    const averageMonthlyDemand = Math.max(0, average(sales));
    const variability = averageMonthlyDemand > 0
      ? standardDeviation(sales, averageMonthlyDemand) / averageMonthlyDemand
      : 0;

    return {
      ...item,
      demandAvailable,
      unitCostAvailable,
      averageMonthlyDemand,
      demandVariability: variability,
      consumptionValue: demandAvailable && unitCostAvailable ? averageMonthlyDemand * item.unitCost : 0,
    };
  });

  const totalConsumptionValue = baseItems.reduce((sum, item) => sum + item.consumptionValue, 0);
  let cumulativeValue = 0;
  const abcBySku = new Map<string, AbcClass>();

  [...baseItems]
    .sort((a, b) => b.consumptionValue - a.consumptionValue)
    .forEach((item) => {
      const ratioBeforeItem = totalConsumptionValue > 0 ? cumulativeValue / totalConsumptionValue : 1;
      const abcClass: AbcClass = ratioBeforeItem < 0.8 ? "A" : ratioBeforeItem < 0.95 ? "B" : "C";
      abcBySku.set(item.sku, abcClass);
      cumulativeValue += item.consumptionValue;
    });

  const items: AnalyzedInventoryItem[] = baseItems.map((item) => {
    const abcAvailable = item.demandAvailable && item.unitCostAvailable && totalConsumptionValue > 0;
    const averageDailyDemand = item.averageMonthlyDemand / 30;
    const coverageDays = averageDailyDemand > 0 ? item.currentStock / averageDailyDemand : 999;
    const reorderPoint = Math.ceil(averageDailyDemand * item.leadTimeDays + item.safetyStock);
    const targetDays = Math.max(45, item.leadTimeDays + 30);
    const suggestedOrder = Math.ceil(Math.max(0, averageDailyDemand * targetDays + item.safetyStock - item.currentStock));
    const expiryDays = daysUntil(item.expiryDate);
    const isExpiringSoon = expiryDays !== null && expiryDays <= 30;
    const isNoRotation = item.demandAvailable && item.averageMonthlyDemand === 0 && item.currentStock > 0;
    const isStockoutRisk = item.demandAvailable && (item.currentStock <= reorderPoint || coverageDays < item.leadTimeDays + 7);
    const isOverstock = item.demandAvailable && (coverageDays > 90 || isNoRotation);

    let status: StockStatus = "stable";
    let situation = "Stock equilibrado";
    let recommendation = "Mantener política actual";

    if (isExpiringSoon) {
      status = "critical";
      situation = expiryDays !== null && expiryDays < 0 ? "Producto caducado" : "Caducidad próxima";
      recommendation = "Priorizar salida y revisar lote";
    } else if (!item.demandAvailable) {
      status = "attention";
      situation = "Demanda no disponible";
      recommendation = "Añadir ventas, consumo o pedidos para calcular cobertura y sobrestock";
    } else if (isNoRotation) {
      status = "attention";
      situation = "Sin rotación";
      recommendation = "Bloquear compra y revisar demanda";
    } else if (isStockoutRisk) {
      status = "critical";
      situation = "Riesgo de rotura";
      recommendation = suggestedOrder > 0 ? `Reponer ${suggestedOrder} ud.` : "Revisar stock de seguridad";
    } else if (isOverstock) {
      status = "attention";
      situation = "Sobrestock";
      recommendation = "Mantener 1 mes en suelo y subir el excedente a altura";
    } else if (coverageDays < 30) {
      status = "attention";
      situation = "Cobertura ajustada";
      recommendation = suggestedOrder > 0 ? `Planificar ${suggestedOrder} ud.` : "Revisar próxima compra";
    }

    const statusLabel: AnalyzedInventoryItem["statusLabel"] = status === "critical" ? "Crítico" : status === "attention" ? "Atención" : "Estable";
    const coveragePenalty = !item.demandAvailable ? 0 : coverageDays < 30 ? 30 - coverageDays : coverageDays > 90 ? Math.min(30, (coverageDays - 90) / 3) : 0;
    const classBoost = abcBySku.get(item.sku) === "A" ? 12 : abcBySku.get(item.sku) === "B" ? 6 : 0;
    const priorityScore = Math.round((status === "critical" ? 70 : status === "attention" ? 35 : 5) + coveragePenalty + classBoost);

    return {
      ...item,
      abcAvailable,
      abcClass: abcBySku.get(item.sku) ?? "C",
      coverageDays,
      reorderPoint,
      suggestedOrder,
      stockValue: item.currentStock * item.unitCost,
      rotationMonthly: item.currentStock > 0 ? item.averageMonthlyDemand / item.currentStock : 0,
      status,
      statusLabel,
      situation,
      recommendation,
      priorityScore,
      expiryDays,
      isOverstock,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore || b.consumptionValue - a.consumptionValue);

  const finiteCoverage = items.filter((item) => item.coverageDays < 999);
  const overstockItems = items.filter((item) => item.isOverstock);

  return {
    items,
    summary: {
      totalStockValue: items.reduce((sum, item) => sum + item.stockValue, 0),
      riskCount: items.filter((item) => item.status === "critical").length,
      overstockCount: overstockItems.length,
      averageCoverage: finiteCoverage.length
        ? finiteCoverage.reduce((sum, item) => sum + item.coverageDays, 0) / finiteCoverage.length
        : 0,
      immobilizedValue: overstockItems.reduce((sum, item) => sum + item.stockValue, 0),
      actionTodayCount: items.filter((item) => item.status === "critical" && item.abcAvailable && item.abcClass === "A").length,
      totalSuggestedOrder: items.reduce((sum, item) => sum + item.suggestedOrder, 0),
      suggestedOrderCost: items.reduce((sum, item) => sum + item.suggestedOrder * item.unitCost, 0),
    },
  };
}

export function simulateInventory(rawItems: RawInventoryItem[], demandChangePct: number, delayDays: number) {
  const demandFactor = 1 + demandChangePct / 100;
  return analyzeInventory(rawItems.map((item) => ({
    ...item,
    leadTimeDays: item.leadTimeDays + delayDays,
    salesM1: item.salesM1 * demandFactor,
    salesM2: item.salesM2 * demandFactor,
    salesM3: item.salesM3 * demandFactor,
  })));
}

const normalizeHeader = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_|_$/g, "");

const parseCsvLine = (line: string, delimiter: string) => {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

const parseNumber = (value: string | undefined, fallback = 0) => {
  if (!value?.trim()) return fallback;
  let normalized = value.trim().replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : Number.NaN;
};

export function parseInventoryCsv(text: string): CsvParseResult {
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return { items: [], errors: ["El archivo está vacío."] };

  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { items: [], errors: ["El archivo debe incluir encabezados y al menos un producto."] };

  const delimiter = (lines[0].match(/;/g) ?? []).length >= (lines[0].match(/,/g) ?? []).length ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
  const column = (...aliases: string[]) => {
    const normalizedAliases = aliases.map(normalizeHeader);
    return headers.findIndex((header) => normalizedAliases.includes(header));
  };

  const indexes = {
    sku: column("sku", "codigo", "referencia", "id_producto"),
    product: column("producto", "nombre", "descripcion", "articulo"),
    category: column("categoria", "familia", "grupo"),
    stock: column("stock_actual", "stock", "existencias", "cantidad"),
    unitCost: column("coste_unitario", "costo_unitario", "coste", "costo", "precio_compra"),
    leadTime: column("lead_time_dias", "plazo_entrega_dias", "lead_time", "plazo_entrega"),
    safetyStock: column("stock_seguridad", "seguridad", "stock_minimo"),
    demand: column("demanda_mensual", "ventas_mensuales", "consumo_mensual"),
    salesM1: column("ventas_mes_1", "ventas_m1", "mes_1"),
    salesM2: column("ventas_mes_2", "ventas_m2", "mes_2"),
    salesM3: column("ventas_mes_3", "ventas_m3", "mes_3"),
    expiry: column("fecha_caducidad", "caducidad", "vencimiento"),
  };

  const missing = [
    [indexes.sku, "SKU"],
    [indexes.product, "producto"],
    [indexes.stock, "stock_actual"],
    [indexes.unitCost, "coste_unitario"],
  ].filter(([index]) => index === -1).map(([, label]) => label);

  if (indexes.demand === -1 && indexes.salesM1 === -1 && indexes.salesM2 === -1 && indexes.salesM3 === -1) {
    missing.push("demanda_mensual o ventas_mes_1/2/3");
  }

  if (missing.length) {
    return { items: [], errors: [`Faltan columnas obligatorias: ${missing.join(", ")}.`] };
  }

  const errors: string[] = [];
  const items: RawInventoryItem[] = [];

  lines.slice(1).forEach((line, lineIndex) => {
    const cells = parseCsvLine(line, delimiter);
    const rowNumber = lineIndex + 2;
    const read = (index: number) => index >= 0 ? cells[index]?.trim() ?? "" : "";
    const demand = parseNumber(read(indexes.demand), 0);
    const salesM1 = indexes.salesM1 >= 0 ? parseNumber(read(indexes.salesM1), demand) : demand;
    const salesM2 = indexes.salesM2 >= 0 ? parseNumber(read(indexes.salesM2), salesM1) : salesM1;
    const salesM3 = indexes.salesM3 >= 0 ? parseNumber(read(indexes.salesM3), salesM2) : salesM2;
    const currentStock = parseNumber(read(indexes.stock));
    const unitCost = parseNumber(read(indexes.unitCost));
    const sku = read(indexes.sku);
    const product = read(indexes.product);

    if (!sku || !product) {
      errors.push(`Fila ${rowNumber}: SKU y producto son obligatorios.`);
      return;
    }

    if ([currentStock, unitCost, salesM1, salesM2, salesM3].some(Number.isNaN)) {
      errors.push(`Fila ${rowNumber}: revisa los campos numéricos.`);
      return;
    }

    items.push({
      sku,
      product,
      category: read(indexes.category) || "Sin categoría",
      currentStock,
      unitCost,
      leadTimeDays: parseNumber(read(indexes.leadTime), 7),
      safetyStock: parseNumber(read(indexes.safetyStock), 0),
      salesM1,
      salesM2,
      salesM3,
      expiryDate: read(indexes.expiry) || undefined,
    });
  });

  return { items, errors: errors.slice(0, 8) };
}

const quoteCsv = (value: string | number) => {
  const text = String(value).replace(/"/g, '""');
  return /[;"\n]/.test(text) ? `"${text}"` : text;
};

export function createTemplateCsv() {
  const headers = ["sku", "producto", "categoria", "stock_actual", "coste_unitario", "lead_time_dias", "stock_seguridad", "ventas_mes_1", "ventas_mes_2", "ventas_mes_3", "fecha_caducidad"];
  const rows = SAMPLE_INVENTORY.slice(0, 6).map((item) => [item.sku, item.product, item.category, item.currentStock, item.unitCost, item.leadTimeDays, item.safetyStock, item.salesM1, item.salesM2, item.salesM3, item.expiryDate ?? ""]);
  return [headers, ...rows].map((row) => row.map(quoteCsv).join(";")).join("\n");
}

export function exportAnalysisCsv(items: AnalyzedInventoryItem[]) {
  const headers = ["sku", "producto", "categoria", "clase_abc", "stock_actual", "demanda_media", "cobertura_dias", "punto_pedido", "pedido_sugerido", "estado", "situacion", "accion_recomendada", "valor_stock"];
  const rows = items.map((item) => [
    item.sku,
    item.product,
    item.category,
    item.abcAvailable ? item.abcClass : "No disponible",
    item.currentStock,
    item.demandAvailable ? item.averageMonthlyDemand.toFixed(2) : "No disponible",
    item.demandAvailable ? (item.coverageDays >= 999 ? "Sin consumo" : item.coverageDays.toFixed(1)) : "No disponible",
    item.demandAvailable ? item.reorderPoint : "No disponible",
    item.demandAvailable ? item.suggestedOrder : "No disponible",
    item.statusLabel,
    item.situation,
    item.recommendation,
    item.unitCostAvailable ? item.stockValue.toFixed(2) : "No disponible",
  ]);
  return [headers, ...rows].map((row) => row.map(quoteCsv).join(";")).join("\n");
}
