import type { AnalyzedInventoryItem, RawInventoryItem } from "./inventory";

export type WarehouseZone = "PICKING" | "RESERVA" | "SUELO" | "CALIDAD" | "APQ";

export type WarehouseCapabilities = {
  product: boolean;
  family: boolean;
  unitCost: boolean;
  demand: boolean;
  location: boolean;
  completeLayout: boolean;
  hazardous: boolean;
  manufacturingDate: boolean;
  expiryDate: boolean;
  pendingPicking: boolean;
};

export type WarehouseConfig = {
  aisleCount: number;
  baysPerAisle: number;
  levelCount: number;
  defaultCapacity: number;
  apqAisles: number[];
};

export type WarehouseStock = {
  id: string;
  sku: string;
  product: string;
  family: string;
  quantity: number;
  unitCost: number;
  leadTimeDays: number;
  safetyStock: number;
  salesM1: number;
  salesM2: number;
  salesM3: number;
  aisle: number;
  bay: number;
  level: number;
  batch: string;
  manufacturingDate: string;
  expiryDate: string;
  hazardous: boolean;
  pendingPicking: number;
  capacity: number;
  sourceLocationCode?: string;
  sourceZone?: WarehouseZone;
  qualityGrade?: string;
  holdCode?: string;
  dataQuality?: {
    productAvailable: boolean;
    familyAvailable: boolean;
    unitCostAvailable: boolean;
    demandAvailable: boolean;
  };
};

export type WarehouseLocationOverride = {
  aisle: number;
  bay: number;
  level: number;
  family?: string;
  hazardous?: boolean;
  capacity?: number;
  sourceCode?: string;
  zone?: WarehouseZone;
};

export type WarehouseDataset = {
  config: WarehouseConfig;
  stocks: WarehouseStock[];
  locationOverrides: WarehouseLocationOverride[];
  aisleFamilies: Record<number, string>;
  warnings: string[];
  layoutMode?: "structured" | "source";
  capabilities?: WarehouseCapabilities;
  importSummary?: {
    sheetName: string;
    headerRow: number;
    dataRows: number;
    mappedFields: number;
    profileSignature: string;
  };
};

export type WarehouseLocation = {
  code: string;
  logicalCode?: string;
  sourceCode?: string;
  aisle: number;
  bay: number;
  level: number;
  zone: WarehouseZone;
  family: string;
  capacity: number;
  quantity: number;
  pendingPicking: number;
  contents: WarehouseStock[];
};

export type WarehouseMoveType = "consolidate" | "elevate" | "replenish" | "blocked";

export type WarehouseMove = {
  id: string;
  type: WarehouseMoveType;
  priority: "alta" | "media";
  sku: string;
  product: string;
  quantity: number;
  from: string;
  to?: string;
  title: string;
  reason: string;
  lotRule: string;
};

export type WarehouseParseResult = {
  dataset: WarehouseDataset | null;
  items: RawInventoryItem[];
  errors: string[];
  warnings: string[];
};

const DEFAULT_CONFIG: WarehouseConfig = {
  aisleCount: 6,
  baysPerAisle: 8,
  levelCount: 6,
  defaultCapacity: 500,
  apqAisles: [],
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

const normalizeHeader = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_|_$/g, "");

const parseNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  let normalized = String(value).trim().replace(/\s/g, "");
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

const parseBoolean = (value: unknown) => {
  const normalized = normalizeHeader(String(value ?? ""));
  return ["si", "s", "true", "1", "apq", "hazardous", "peligroso", "peligrosa"].includes(normalized);
};

const cleanDate = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const isoMatch = text.match(/^(\d{4})[-/]([01]?\d)[-/]([0-3]?\d)/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  const europeanMatch = text.match(/^([0-3]?\d)[-/]([01]?\d)[-/](\d{4})/);
  if (europeanMatch) return `${europeanMatch[3]}-${europeanMatch[2].padStart(2, "0")}-${europeanMatch[1].padStart(2, "0")}`;
  return text;
};

const parseLocationCode = (value: unknown) => {
  const numbers = String(value ?? "").match(/\d+/g)?.map(Number) ?? [];
  return numbers.length >= 3
    ? { aisle: numbers[0], bay: numbers[1], level: numbers[2] }
    : null;
};

const parseDelimitedLine = (line: string, delimiter: string) => {
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

export const formatLocationCode = (aisle: number, bay: number, level: number) =>
  `P${String(aisle).padStart(2, "0")}-M${String(bay).padStart(2, "0")}-A${String(level).padStart(2, "0")}`;

const exactLotMatch = (left: WarehouseStock, right: WarehouseStock) => Boolean(
  left.batch
  && left.manufacturingDate
  && left.expiryDate
  && left.batch === right.batch
  && left.manufacturingDate === right.manufacturingDate
  && left.expiryDate === right.expiryDate
  && left.sku === right.sku
  && left.hazardous === right.hazardous,
);

export function buildWarehouseLocations(dataset: WarehouseDataset): WarehouseLocation[] {
  if (dataset.layoutMode === "source") {
    const unlocatedPrefix = "__SIN_UBICACION__";
    const overrides = new Map(dataset.locationOverrides.map((item) => [
      item.sourceCode || formatLocationCode(item.aisle, item.bay, item.level),
      item,
    ]));
    const grouped = new Map<string, WarehouseStock[]>();
    dataset.stocks.forEach((stock) => {
      const key = stock.sourceLocationCode || `${unlocatedPrefix}${stock.id}`;
      grouped.set(key, [...(grouped.get(key) ?? []), stock]);
    });
    const sourceCodes = new Set([...grouped.keys(), ...overrides.keys()]);
    return [...sourceCodes].map((sourceKey) => {
      const contents = grouped.get(sourceKey) ?? [];
      const override = overrides.get(sourceKey);
      const first = contents[0];
      const aisle = first?.aisle ?? override?.aisle ?? 1;
      const bay = first?.bay ?? override?.bay ?? 1;
      const level = first?.level ?? override?.level ?? 1;
      const logicalCode = formatLocationCode(aisle, bay, level);
      const hazardous = Boolean(override?.hazardous) || contents.some((item) => item.hazardous);
      const zone = hazardous
        ? "APQ"
        : override?.zone || contents.find((item) => item.sourceZone)?.sourceZone || (level === 1 ? "PICKING" : "RESERVA");
      const family = override?.family || contents[0]?.family || "Sin asignar";
      const capacity = Math.max(override?.capacity ?? 0, ...contents.map((item) => item.capacity), dataset.config.defaultCapacity);
      const sourceCode = sourceKey.startsWith(unlocatedPrefix) ? undefined : sourceKey;
      return {
        code: sourceCode || `SIN-UBICACION-${first?.id || logicalCode}`,
        logicalCode,
        sourceCode,
        aisle,
        bay,
        level,
        zone,
        family,
        capacity,
        quantity: contents.reduce((sum, item) => sum + item.quantity, 0),
        pendingPicking: contents.reduce((sum, item) => sum + item.pendingPicking, 0),
        contents,
      };
    }).sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true }));
  }
  const overrides = new Map(dataset.locationOverrides.map((item) => [
    formatLocationCode(item.aisle, item.bay, item.level),
    item,
  ]));
  const contentsByCode = new Map<string, WarehouseStock[]>();
  dataset.stocks.forEach((stock) => {
    const code = formatLocationCode(stock.aisle, stock.bay, stock.level);
    contentsByCode.set(code, [...(contentsByCode.get(code) ?? []), stock]);
  });

  const locations: WarehouseLocation[] = [];
  for (let aisle = 1; aisle <= dataset.config.aisleCount; aisle += 1) {
    for (let bay = 1; bay <= dataset.config.baysPerAisle; bay += 1) {
      for (let level = 1; level <= dataset.config.levelCount; level += 1) {
        const code = formatLocationCode(aisle, bay, level);
        const contents = contentsByCode.get(code) ?? [];
        const override = overrides.get(code);
        const hazardous = Boolean(override?.hazardous)
          || contents.some((item) => item.hazardous)
          || dataset.config.apqAisles.includes(aisle);
        const zone: WarehouseZone = hazardous ? "APQ" : level === 1 ? "PICKING" : "RESERVA";
        const family = override?.family
          || (hazardous ? "APQ" : dataset.aisleFamilies[aisle])
          || contents[0]?.family
          || "Sin asignar";
        const capacity = Math.max(
          override?.capacity ?? 0,
          ...contents.map((item) => item.capacity),
          dataset.config.defaultCapacity,
        );
        locations.push({
          code,
          aisle,
          bay,
          level,
          zone,
          family,
          capacity,
          quantity: contents.reduce((sum, item) => sum + item.quantity, 0),
          pendingPicking: contents.reduce((sum, item) => sum + item.pendingPicking, 0),
          contents,
        });
      }
    }
  }
  return locations;
}

export function inventoryFromWarehouse(dataset: WarehouseDataset): RawInventoryItem[] {
  const grouped = new Map<string, WarehouseStock[]>();
  dataset.stocks.forEach((stock) => grouped.set(stock.sku, [...(grouped.get(stock.sku) ?? []), stock]));
  return [...grouped.values()].map((stocks) => {
    const first = stocks[0];
    const productSource = stocks.find((item) => item.dataQuality?.productAvailable) ?? first;
    const familySource = stocks.find((item) => item.dataQuality?.familyAvailable) ?? first;
    const costSource = stocks.find((item) => item.dataQuality?.unitCostAvailable) ?? first;
    const demandSource = stocks.find((item) => item.dataQuality?.demandAvailable) ?? first;
    const expiries = stocks.map((item) => item.expiryDate).filter(Boolean).sort();
    return {
      sku: first.sku,
      product: productSource.product,
      category: familySource.family,
      currentStock: stocks.reduce((sum, item) => sum + item.quantity, 0),
      unitCost: costSource.unitCost,
      leadTimeDays: demandSource.leadTimeDays,
      safetyStock: demandSource.safetyStock,
      salesM1: demandSource.salesM1,
      salesM2: demandSource.salesM2,
      salesM3: demandSource.salesM3,
      expiryDate: expiries[0] || undefined,
      dataQuality: {
        productAvailable: stocks.some((item) => item.dataQuality?.productAvailable ?? dataset.capabilities?.product ?? true),
        familyAvailable: stocks.some((item) => item.dataQuality?.familyAvailable ?? dataset.capabilities?.family ?? true),
        unitCostAvailable: stocks.some((item) => item.dataQuality?.unitCostAvailable ?? dataset.capabilities?.unitCost ?? true),
        demandAvailable: stocks.some((item) => item.dataQuality?.demandAvailable ?? dataset.capabilities?.demand ?? true),
      },
    };
  });
}

export function warehouseSummary(locations: WarehouseLocation[]) {
  return {
    total: locations.length,
    occupied: locations.filter((item) => item.contents.length > 0).length,
    empty: locations.filter((item) => item.contents.length === 0).length,
    apq: locations.filter((item) => item.zone === "APQ").length,
    pendingPicking: locations.reduce((sum, item) => sum + item.pendingPicking, 0),
  };
}

const pickTarget = (
  locations: WarehouseLocation[],
  source: WarehouseStock,
  targetLevel: "floor" | "height",
  reservedCapacity: Map<string, number>,
) => {
  const candidates = locations.filter((location) => {
    const isLevel = targetLevel === "floor" ? location.level === 1 : location.level > 1;
    const isZone = source.hazardous ? location.zone === "APQ" : location.zone !== "APQ";
    const freeCapacity = location.capacity - location.quantity - (reservedCapacity.get(location.code) ?? 0);
    return isLevel && isZone && freeCapacity > 0;
  });

  const compatible = candidates
    .filter((location) => location.contents.length > 0 && location.contents.every((item) => exactLotMatch(source, item)))
    .sort((left, right) => Number(right.aisle === source.aisle) - Number(left.aisle === source.aisle))[0];
  if (compatible) return { location: compatible, merge: true };

  const empty = candidates
    .filter((location) => location.contents.length === 0)
    .sort((left, right) => {
      const leftFamily = left.family === source.family || left.family === "Sin asignar" ? 1 : 0;
      const rightFamily = right.family === source.family || right.family === "Sin asignar" ? 1 : 0;
      const leftAisle = left.aisle === source.aisle ? 1 : 0;
      const rightAisle = right.aisle === source.aisle ? 1 : 0;
      return rightFamily - leftFamily || rightAisle - leftAisle || left.aisle - right.aisle || left.bay - right.bay || left.level - right.level;
    })[0];
  return empty ? { location: empty, merge: false } : null;
};

export function calculateWarehouseMoves(dataset: WarehouseDataset, items: AnalyzedInventoryItem[]): WarehouseMove[] {
  if (dataset.layoutMode === "source" || dataset.capabilities?.completeLayout === false || dataset.capabilities?.demand === false) return [];
  const locations = buildWarehouseLocations(dataset);
  const itemBySku = new Map(items.map((item) => [item.sku, item]));
  const stocksBySku = new Map<string, WarehouseStock[]>();
  dataset.stocks.forEach((stock) => stocksBySku.set(stock.sku, [...(stocksBySku.get(stock.sku) ?? []), stock]));
  const reservedCapacity = new Map<string, number>();
  const moves: WarehouseMove[] = [];

  stocksBySku.forEach((stocks, sku) => {
    const item = itemBySku.get(sku);
    if (!item || !item.demandAvailable) return;
    const floorStocks = stocks.filter((stock) => stock.level === 1);
    const heightStocks = stocks.filter((stock) => stock.level > 1);
    const floorQuantity = floorStocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const pendingPicking = stocks.reduce((sum, stock) => sum + stock.pendingPicking, 0);
    const availableAfterPicking = Math.max(0, floorQuantity - pendingPicking);
    const monthTarget = Math.ceil(item.averageMonthlyDemand);

    if (item.isOverstock && availableAfterPicking > monthTarget) {
      let excess = Math.floor(availableAfterPicking - monthTarget);
      const sources = [...floorStocks].sort((left, right) => right.expiryDate.localeCompare(left.expiryDate));
      for (const source of sources) {
        if (excess <= 0) break;
        let sourceRemaining = Math.min(source.quantity, excess);
        while (sourceRemaining > 0 && excess > 0) {
          const target = pickTarget(locations, source, "height", reservedCapacity);
          if (!target) {
            moves.push({
              id: `blocked-up-${source.id}-${moves.length}`,
              type: "blocked",
              priority: "alta",
              sku,
              product: source.product,
              quantity: sourceRemaining,
              from: formatLocationCode(source.aisle, source.bay, source.level),
              title: "Sin hueco compatible en altura",
              reason: `Mantener ${monthTarget} ud. disponibles tras ${pendingPicking} ud. de picking y crear espacio de reserva compatible.`,
              lotRule: "No fusionar: falta un hueco compatible o no están completos lote, fabricación y vencimiento.",
            });
            sourceRemaining = 0;
            excess = 0;
            break;
          }
          const freeCapacity = target.location.capacity - target.location.quantity - (reservedCapacity.get(target.location.code) ?? 0);
          const quantity = Math.max(0, Math.min(sourceRemaining, excess, freeCapacity));
          if (!quantity) break;
          reservedCapacity.set(target.location.code, (reservedCapacity.get(target.location.code) ?? 0) + quantity);
          moves.push({
            id: `up-${source.id}-${target.location.code}-${moves.length}`,
            type: target.merge ? "consolidate" : "elevate",
            priority: "alta",
            sku,
            product: source.product,
            quantity,
            from: formatLocationCode(source.aisle, source.bay, source.level),
            to: target.location.code,
            title: target.merge ? "Fusionar excedente en altura" : "Subir excedente a hueco libre",
            reason: `Después del picking quedan ${Math.floor(availableAfterPicking)} ud.; se conservan ${monthTarget} ud. para un mes en suelo.`,
            lotRule: target.merge
              ? `Fusión permitida: lote ${source.batch}, fabricación ${source.manufacturingDate} y vencimiento ${source.expiryDate} coinciden exactamente.`
              : "Ubicación vacía seleccionada porque no existe una fusión con lote y fechas idénticos.",
          });
          sourceRemaining -= quantity;
          excess -= quantity;
        }
      }
    }

    if (availableAfterPicking < monthTarget && heightStocks.length > 0) {
      let shortage = Math.ceil(monthTarget - availableAfterPicking);
      const sources = [...heightStocks].sort((left, right) => (left.expiryDate || "9999").localeCompare(right.expiryDate || "9999"));
      for (const source of sources) {
        if (shortage <= 0) break;
        let sourceRemaining = Math.min(source.quantity, shortage);
        while (sourceRemaining > 0 && shortage > 0) {
          const target = pickTarget(locations, source, "floor", reservedCapacity);
          if (!target) {
            moves.push({
              id: `blocked-down-${source.id}-${moves.length}`,
              type: "blocked",
              priority: "alta",
              sku,
              product: source.product,
              quantity: sourceRemaining,
              from: formatLocationCode(source.aisle, source.bay, source.level),
              title: "Sin hueco de picking compatible",
              reason: `Tras ${pendingPicking} ud. pendientes, faltan ${shortage} ud. para cubrir un mes en suelo.`,
              lotRule: "No mezclar lotes o fechas: habilitar un hueco de suelo compatible.",
            });
            sourceRemaining = 0;
            shortage = 0;
            break;
          }
          const freeCapacity = target.location.capacity - target.location.quantity - (reservedCapacity.get(target.location.code) ?? 0);
          const quantity = Math.max(0, Math.min(sourceRemaining, shortage, freeCapacity));
          if (!quantity) break;
          reservedCapacity.set(target.location.code, (reservedCapacity.get(target.location.code) ?? 0) + quantity);
          moves.push({
            id: `down-${source.id}-${target.location.code}-${moves.length}`,
            type: "replenish",
            priority: "alta",
            sku,
            product: source.product,
            quantity,
            from: formatLocationCode(source.aisle, source.bay, source.level),
            to: target.location.code,
            title: "Reponer ubicación de suelo",
            reason: `Tras ${pendingPicking} ud. pendientes quedarían ${Math.floor(availableAfterPicking)} ud.; el objetivo es ${monthTarget} ud. para un mes.`,
            lotRule: target.merge
              ? `Destino compatible: lote ${source.batch} y fechas de fabricación/vencimiento idénticas.`
              : "Destino de suelo vacío; aplicar FEFO y confirmar el lote antes del movimiento.",
          });
          sourceRemaining -= quantity;
          shortage -= quantity;
        }
      }
    }
  });

  const order: Record<WarehouseMoveType, number> = { blocked: 0, replenish: 1, consolidate: 2, elevate: 3 };
  return moves.sort((left, right) => order[left.type] - order[right.type] || right.quantity - left.quantity);
}

export function createDemoWarehouseDataset(items: RawInventoryItem[]): WarehouseDataset {
  const aisleFamilies: Record<number, string> = {
    1: "Alimentación",
    2: "Embalaje y logística",
    3: "Mantenimiento",
    4: "Tecnología y oficina",
    5: "Higiene y protección",
    6: "APQ",
  };
  const familyAisle = (item: RawInventoryItem) => {
    if (["SKU-9511", "SKU-4410"].includes(item.sku)) return 6;
    if (item.category === "Alimentación") return 1;
    if (["Embalaje", "Logística"].includes(item.category)) return 2;
    if (item.category === "Mantenimiento") return 3;
    if (["Tecnología", "Oficina"].includes(item.category)) return 4;
    return 5;
  };
  const counters = new Map<number, number>();
  const stocks: WarehouseStock[] = [];
  items.forEach((item, index) => {
    const aisle = familyAisle(item);
    const slot = counters.get(aisle) ?? 0;
    counters.set(aisle, slot + 1);
    const bay = (slot % 8) + 1;
    const demand = average([item.salesM1, item.salesM2, item.salesM3]);
    const pendingPicking = Math.min(item.currentStock, Math.max(0, Math.round(demand * 0.12)));
    const hasReserve = item.currentStock >= 12;
    const reserveQuantity = hasReserve
      ? Math.max(1, Math.floor(item.currentStock * (item.currentStock > demand * 1.7 ? 0.56 : 0.34)))
      : 0;
    const floorQuantity = item.currentStock - reserveQuantity;
    const hazardous = aisle === 6;
    const batch = `L-${item.sku.replace(/\D/g, "").slice(-4)}-A`;
    const manufacturingDate = `2026-${String((index % 5) + 1).padStart(2, "0")}-15`;
    const expiryDate = item.expiryDate ?? `2028-${String((index % 8) + 1).padStart(2, "0")}-28`;
    const capacity = Math.max(250, Math.ceil(item.currentStock * 0.9));
    stocks.push({
      id: `${item.sku}-floor`,
      sku: item.sku,
      product: item.product,
      family: hazardous ? `APQ · ${item.category}` : item.category,
      quantity: floorQuantity,
      unitCost: item.unitCost,
      leadTimeDays: item.leadTimeDays,
      safetyStock: item.safetyStock,
      salesM1: item.salesM1,
      salesM2: item.salesM2,
      salesM3: item.salesM3,
      aisle,
      bay,
      level: 1,
      batch,
      manufacturingDate,
      expiryDate,
      hazardous,
      pendingPicking,
      capacity,
    });
    if (reserveQuantity > 0) {
      const useDifferentLot = ["SKU-9908", "SKU-5201"].includes(item.sku);
      stocks.push({
        id: `${item.sku}-reserve`,
        sku: item.sku,
        product: item.product,
        family: hazardous ? `APQ · ${item.category}` : item.category,
        quantity: reserveQuantity,
        unitCost: item.unitCost,
        leadTimeDays: item.leadTimeDays,
        safetyStock: item.safetyStock,
        salesM1: item.salesM1,
        salesM2: item.salesM2,
        salesM3: item.salesM3,
        aisle,
        bay,
        level: 4 + (index % 2),
        batch: useDifferentLot ? `${batch.slice(0, -1)}B` : batch,
        manufacturingDate: useDifferentLot ? "2026-06-01" : manufacturingDate,
        expiryDate: useDifferentLot ? "2029-06-01" : expiryDate,
        hazardous,
        pendingPicking: 0,
        capacity,
      });
    }
  });
  return {
    config: { ...DEFAULT_CONFIG, apqAisles: [6] },
    stocks,
    locationOverrides: [],
    aisleFamilies,
    warnings: [],
  };
}

type ParsedRow = Omit<WarehouseStock, "id" | "aisle" | "bay" | "level"> & {
  rowNumber: number;
  aisle?: number;
  bay?: number;
  level?: number;
};

export function parseWarehouseRows(rawRows: unknown[][]): WarehouseParseResult {
  const rows = rawRows
    .map((row) => row.map((cell) => cell instanceof Date && !Number.isNaN(cell.getTime())
      ? cell.toISOString().slice(0, 10)
      : String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
  if (rows.length < 2) {
    return { dataset: null, items: [], errors: ["El archivo debe incluir encabezados y al menos una fila."], warnings: [] };
  }
  const headers = rows[0].map(normalizeHeader);
  const column = (...aliases: string[]) => {
    const normalizedAliases = aliases.map(normalizeHeader);
    return headers.findIndex((header) => normalizedAliases.includes(header));
  };
  const indexes = {
    sku: column("sku", "codigo", "referencia", "id_producto"),
    product: column("producto", "nombre", "descripcion", "articulo"),
    family: column("familia", "categoria", "grupo", "grupo_familiar"),
    quantity: column("cantidad_ubicacion", "stock_actual", "stock", "existencias", "cantidad"),
    unitCost: column("coste_unitario", "costo_unitario", "coste", "costo", "precio_compra"),
    leadTime: column("lead_time_dias", "plazo_entrega_dias", "lead_time", "plazo_entrega"),
    safetyStock: column("stock_seguridad", "seguridad", "stock_minimo"),
    demand: column("demanda_mensual", "ventas_mensuales", "consumo_mensual"),
    salesM1: column("ventas_mes_1", "ventas_m1", "mes_1"),
    salesM2: column("ventas_mes_2", "ventas_m2", "mes_2"),
    salesM3: column("ventas_mes_3", "ventas_m3", "mes_3"),
    location: column("ubicacion", "location", "codigo_ubicacion"),
    aisle: column("pasillo", "aisle"),
    bay: column("modulo", "hueco", "posicion", "bay"),
    level: column("altura", "nivel", "level"),
    batch: column("lote", "batch"),
    manufacturing: column("fecha_fabricacion", "fabricacion", "manufacturing_date"),
    expiry: column("fecha_vencimiento", "fecha_caducidad", "caducidad", "vencimiento"),
    hazardous: column("apq", "hazardous", "peligroso", "mercancia_peligrosa"),
    zone: column("zona", "tipo_zona"),
    pending: column("picking_pendiente", "pedidos_proximos", "salidas_pendientes"),
    capacity: column("capacidad_ubicacion", "capacidad", "capacidad_hueco"),
    totalAisles: column("total_pasillos", "numero_pasillos"),
    baysPerAisle: column("modulos_por_pasillo", "huecos_por_pasillo"),
    totalLevels: column("alturas_almacen", "numero_alturas", "total_alturas"),
  };

  const missing = [
    [indexes.sku, "SKU"],
    [indexes.product, "producto"],
    [indexes.quantity, "cantidad_ubicacion o stock_actual"],
    [indexes.unitCost, "coste_unitario"],
  ].filter(([index]) => index === -1).map(([, label]) => label);
  if (indexes.demand === -1 && indexes.salesM1 === -1 && indexes.salesM2 === -1 && indexes.salesM3 === -1) {
    missing.push("demanda_mensual o ventas_mes_1/2/3");
  }
  if (missing.length) {
    return { dataset: null, items: [], errors: [`Faltan columnas obligatorias: ${missing.join(", ")}.`], warnings: [] };
  }

  const read = (row: string[], index: number) => index >= 0 ? row[index]?.trim() ?? "" : "";
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsedRows: ParsedRow[] = [];
  const locationOverrides: WarehouseLocationOverride[] = [];
  let requestedAisles = 0;
  let requestedBays = 0;
  let requestedLevels = 0;

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const code = parseLocationCode(read(row, indexes.location));
    const aisle = parseNumber(read(row, indexes.aisle), code?.aisle ?? 0) || undefined;
    const bay = parseNumber(read(row, indexes.bay), code?.bay ?? 0) || undefined;
    const level = parseNumber(read(row, indexes.level), code?.level ?? 0) || undefined;
    requestedAisles = Math.max(requestedAisles, parseNumber(read(row, indexes.totalAisles)), aisle ?? 0);
    requestedBays = Math.max(requestedBays, parseNumber(read(row, indexes.baysPerAisle)), bay ?? 0);
    requestedLevels = Math.max(requestedLevels, parseNumber(read(row, indexes.totalLevels)), level ?? 0);
    const family = read(row, indexes.family) || "Sin asignar";
    const hazardous = parseBoolean(read(row, indexes.hazardous)) || normalizeHeader(read(row, indexes.zone)) === "apq";
    const capacity = parseNumber(read(row, indexes.capacity), DEFAULT_CONFIG.defaultCapacity);
    const sku = read(row, indexes.sku);
    const product = read(row, indexes.product);

    if (!sku && !product) {
      if (aisle && bay && level) locationOverrides.push({ aisle, bay, level, family, hazardous, capacity });
      return;
    }
    if (!sku || !product) {
      errors.push(`Fila ${rowNumber}: SKU y producto deben estar ambos informados.`);
      return;
    }
    if (level && (level < 1 || level > 7)) {
      errors.push(`Fila ${rowNumber}: la altura debe estar entre 1 y 7.`);
      return;
    }
    const demand = parseNumber(read(row, indexes.demand), 0);
    const salesM1 = indexes.salesM1 >= 0 ? parseNumber(read(row, indexes.salesM1), demand) : demand;
    const salesM2 = indexes.salesM2 >= 0 ? parseNumber(read(row, indexes.salesM2), salesM1) : salesM1;
    const salesM3 = indexes.salesM3 >= 0 ? parseNumber(read(row, indexes.salesM3), salesM2) : salesM2;
    const quantity = parseNumber(read(row, indexes.quantity));
    const unitCost = parseNumber(read(row, indexes.unitCost));
    const pendingPicking = parseNumber(read(row, indexes.pending), 0);
    if ([quantity, unitCost, salesM1, salesM2, salesM3, pendingPicking, capacity].some(Number.isNaN)) {
      errors.push(`Fila ${rowNumber}: revisa los campos numéricos.`);
      return;
    }
    if (pendingPicking > quantity && level === 1) {
      warnings.push(`Fila ${rowNumber}: el picking pendiente supera la cantidad de la ubicación; se generará reposición urgente.`);
    }
    parsedRows.push({
      rowNumber,
      sku,
      product,
      family,
      quantity,
      unitCost,
      leadTimeDays: parseNumber(read(row, indexes.leadTime), 7),
      safetyStock: parseNumber(read(row, indexes.safetyStock), 0),
      salesM1,
      salesM2,
      salesM3,
      aisle,
      bay,
      level,
      batch: read(row, indexes.batch),
      manufacturingDate: cleanDate(read(row, indexes.manufacturing)),
      expiryDate: cleanDate(read(row, indexes.expiry)),
      hazardous,
      pendingPicking,
      capacity: Math.max(capacity, quantity),
    });
  });

  if (errors.length) return { dataset: null, items: [], errors: errors.slice(0, 10), warnings };
  if (!parsedRows.length) return { dataset: null, items: [], errors: ["No se encontraron ubicaciones ocupadas válidas."], warnings };
  if (requestedLevels > 7) return { dataset: null, items: [], errors: ["El almacén supera el máximo admitido de 7 alturas."], warnings };

  const levelCount = clamp(Math.round(requestedLevels || DEFAULT_CONFIG.levelCount), 5, 7);
  if (requestedLevels > 0 && requestedLevels < 5) warnings.push("La estructura se completó hasta 5 alturas, el mínimo operativo configurado.");
  const config: WarehouseConfig = {
    aisleCount: clamp(Math.round(requestedAisles || DEFAULT_CONFIG.aisleCount), 1, 40),
    baysPerAisle: clamp(Math.round(requestedBays || DEFAULT_CONFIG.baysPerAisle), 1, 80),
    levelCount,
    defaultCapacity: DEFAULT_CONFIG.defaultCapacity,
    apqAisles: [],
  };
  const explicitApqAisles = parsedRows.filter((row) => row.hazardous && row.aisle).map((row) => row.aisle as number);
  config.apqAisles = [...new Set(explicitApqAisles)];
  if (parsedRows.some((row) => row.hazardous) && !config.apqAisles.length) config.apqAisles = [config.aisleCount];

  const aisleFamilies: Record<number, string> = {};
  parsedRows.forEach((row) => {
    if (!row.aisle) return;
    if (row.hazardous) {
      aisleFamilies[row.aisle] = "APQ";
      return;
    }
    const currentFamily = aisleFamilies[row.aisle];
    if (!currentFamily) aisleFamilies[row.aisle] = row.family;
    else if (currentFamily !== "APQ" && !currentFamily.split(" / ").includes(row.family)) aisleFamilies[row.aisle] = `${currentFamily} / ${row.family}`;
  });
  config.apqAisles.forEach((aisle) => { aisleFamilies[aisle] = "APQ"; });
  parsedRows.forEach((row) => {
    if (row.aisle && config.apqAisles.includes(row.aisle) && !row.hazardous) {
      warnings.push(`Fila ${row.rowNumber}: el pasillo ${row.aisle} está reservado como APQ; revisa la segregación de la mercancía general.`);
    }
  });
  const familyAssignments = new Map<string, number>();
  Object.entries(aisleFamilies).forEach(([aisle, family]) => family.split(" / ").forEach((part) => familyAssignments.set(part, Number(aisle))));
  let nextAisle = 1;
  const usedAutoCodes = new Set(parsedRows.filter((row) => row.aisle && row.bay && row.level).map((row) => formatLocationCode(row.aisle as number, row.bay as number, row.level as number)));

  const findAisle = (row: ParsedRow) => {
    if (row.hazardous) return config.apqAisles[0] ?? config.aisleCount;
    const existing = familyAssignments.get(row.family);
    if (existing) return existing;
    while (config.apqAisles.includes(nextAisle) && nextAisle <= config.aisleCount) nextAisle += 1;
    const aisle = nextAisle <= config.aisleCount ? nextAisle : 1;
    familyAssignments.set(row.family, aisle);
    aisleFamilies[aisle] = aisleFamilies[aisle] ? `${aisleFamilies[aisle]} / ${row.family}` : row.family;
    nextAisle += 1;
    return aisle;
  };

  const stocks = parsedRows.map((row, index): WarehouseStock => {
    let aisle = row.aisle;
    let bay = row.bay;
    let level = row.level;
    if (!aisle || !bay || !level) {
      aisle = aisle || findAisle(row);
      let assigned = false;
      for (let candidateLevel = 1; candidateLevel <= config.levelCount && !assigned; candidateLevel += 1) {
        for (let candidateBay = 1; candidateBay <= config.baysPerAisle; candidateBay += 1) {
          const code = formatLocationCode(aisle, candidateBay, candidateLevel);
          if (!usedAutoCodes.has(code)) {
            bay = candidateBay;
            level = candidateLevel;
            usedAutoCodes.add(code);
            assigned = true;
            break;
          }
        }
      }
      if (!assigned) {
        bay = bay || 1;
        level = level || 1;
        warnings.push(`Fila ${row.rowNumber}: no había huecos libres; revisa la dimensión del almacén.`);
      }
    }
    if (row.hazardous && !config.apqAisles.includes(aisle)) {
      config.apqAisles.push(aisle);
      aisleFamilies[aisle] = "APQ";
    } else if (!aisleFamilies[aisle]) {
      aisleFamilies[aisle] = row.family;
    }
    if (!row.batch || !row.manufacturingDate || !row.expiryDate) {
      warnings.push(`Fila ${row.rowNumber}: faltan lote o fechas; esa mercancía no se fusionará con otra ubicación.`);
    }
    return {
      ...row,
      id: `import-${row.rowNumber}-${index}`,
      aisle,
      bay,
      level,
    };
  });

  const dataset: WarehouseDataset = {
    config,
    stocks,
    locationOverrides,
    aisleFamilies,
    warnings: [...new Set(warnings)].slice(0, 12),
  };
  return {
    dataset,
    items: inventoryFromWarehouse(dataset),
    errors: [],
    warnings: dataset.warnings,
  };
}

export function parseWarehouseCsv(text: string): WarehouseParseResult {
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return { dataset: null, items: [], errors: ["El archivo está vacío."], warnings: [] };
  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim());
  const firstLine = lines[0] ?? "";
  const delimiter = (firstLine.match(/;/g) ?? []).length >= (firstLine.match(/,/g) ?? []).length ? ";" : ",";
  return parseWarehouseRows(lines.map((line) => parseDelimitedLine(line, delimiter)));
}

export function createWarehouseTemplateRows() {
  const headers = [
    "sku", "producto", "familia", "cantidad_ubicacion", "coste_unitario", "lead_time_dias", "stock_seguridad",
    "ventas_mes_1", "ventas_mes_2", "ventas_mes_3", "pasillo", "modulo", "altura", "lote",
    "fecha_fabricacion", "fecha_vencimiento", "apq", "picking_pendiente", "capacidad_ubicacion",
    "total_pasillos", "modulos_por_pasillo", "alturas_almacen",
  ];
  const rows = [
    ["SKU-1001", "Agua mineral caja", "Bebidas", 180, 8.5, 7, 40, 100, 110, 105, 1, 1, 1, "AG-2601", "2026-01-10", "2027-01-10", "NO", 24, 250, 6, 8, 6],
    ["SKU-1001", "Agua mineral caja", "Bebidas", 120, 8.5, 7, 40, 100, 110, 105, 1, 1, 4, "AG-2601", "2026-01-10", "2027-01-10", "NO", 0, 250, "", "", ""],
    ["SKU-2001", "Detergente industrial", "Limpieza", 80, 18, 12, 20, 30, 28, 32, 6, 1, 1, "DT-2602", "2026-02-05", "2028-02-05", "SI", 8, 150, "", "", ""],
    ["SKU-2001", "Detergente industrial", "Limpieza", 60, 18, 12, 20, 30, 28, 32, 6, 1, 5, "DT-2602", "2026-02-05", "2028-02-05", "SI", 0, 150, "", "", ""],
    ["SKU-3001", "Guantes de protección", "Protección", 45, 12, 9, 25, 70, 75, 72, 5, 2, 1, "GP-2603", "2026-03-01", "2029-03-01", "NO", 18, 100, "", "", ""],
  ];
  return [headers, ...rows];
}

const quoteCsv = (value: string | number) => {
  const text = String(value).replace(/"/g, '""');
  return /[;"\n]/.test(text) ? `"${text}"` : text;
};

export function exportWarehouseCsv(locations: WarehouseLocation[]) {
  const headers = ["ubicacion", "pasillo", "modulo", "altura", "zona", "familia", "estado", "sku", "producto", "cantidad", "lote", "fecha_fabricacion", "fecha_vencimiento", "picking_pendiente"];
  const rows = locations.flatMap((location) => {
    if (!location.contents.length) {
      return [[location.code, location.aisle, location.bay, location.level, location.zone, location.family, "VACÍA", "", "", 0, "", "", "", 0]];
    }
    return location.contents.map((stock) => [
      location.code,
      location.aisle,
      location.bay,
      location.level,
      location.zone,
      location.family,
      "OCUPADA",
      stock.sku,
      stock.product,
      stock.quantity,
      stock.batch,
      stock.manufacturingDate,
      stock.expiryDate,
      stock.pendingPicking,
    ]);
  });
  return [headers, ...rows].map((row) => row.map(quoteCsv).join(";")).join("\n");
}
