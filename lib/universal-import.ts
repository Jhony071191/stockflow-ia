import {
  inventoryFromWarehouse,
  type WarehouseCapabilities,
  type WarehouseDataset,
  type WarehouseLocationOverride,
  type WarehouseParseResult,
  type WarehouseStock,
  type WarehouseZone,
} from "./warehouse.ts";

export type UniversalField =
  | "sku"
  | "product"
  | "family"
  | "quantity"
  | "unitCost"
  | "leadTime"
  | "safetyStock"
  | "demand"
  | "salesM1"
  | "salesM2"
  | "salesM3"
  | "location"
  | "zone"
  | "aisle"
  | "bay"
  | "level"
  | "batch"
  | "manufacturing"
  | "expiry"
  | "hazardous"
  | "pending"
  | "capacity"
  | "totalAisles"
  | "baysPerAisle"
  | "totalLevels"
  | "grade"
  | "holdCode"
  | "pickingIndicator";

export type UniversalMapping = Record<UniversalField, number | null> & {
  locationStart: number | null;
  locationEnd: number | null;
};

export type UniversalColumn = {
  index: number;
  letter: string;
  header: string;
  label: string;
  sample: string;
};

export type UniversalSheetInput = {
  name: string;
  rows: unknown[][];
};

export type UniversalImportDraft = {
  sheetName: string;
  rows: unknown[][];
  workbookSheets: UniversalSheetInput[];
  sheetOptions: Array<{ name: string; suggestedHeaderRowIndex: number; rowCount: number }>;
  headerRowIndex: number;
  columns: UniversalColumn[];
  mapping: UniversalMapping;
  confidence: Partial<Record<UniversalField, number>>;
  dataRowCount: number;
  profileSignature: string;
  warnings: string[];
};

export const UNIVERSAL_FIELD_LABELS: Record<UniversalField, string> = {
  sku: "SKU / código de artículo",
  product: "Producto / descripción",
  family: "Familia / categoría",
  quantity: "Cantidad / stock",
  unitCost: "Coste unitario",
  leadTime: "Plazo de reposición",
  safetyStock: "Stock de seguridad",
  demand: "Demanda mensual",
  salesM1: "Ventas mes 1",
  salesM2: "Ventas mes 2",
  salesM3: "Ventas mes 3",
  location: "Ubicación completa",
  zone: "Zona / tipo de ubicación",
  aisle: "Pasillo",
  bay: "Módulo / hueco",
  level: "Altura / nivel",
  batch: "Lote",
  manufacturing: "Fecha de fabricación",
  expiry: "Vencimiento / fecha FEFO",
  hazardous: "APQ / mercancía peligrosa",
  pending: "Unidades pendientes de picking",
  capacity: "Capacidad de ubicación",
  totalAisles: "Total de pasillos",
  baysPerAisle: "Módulos por pasillo",
  totalLevels: "Alturas del almacén",
  grade: "Grado / estado de calidad",
  holdCode: "Código de bloqueo",
  pickingIndicator: "Indicador picking (sí/no)",
};

export const UNIVERSAL_EDITABLE_FIELDS: UniversalField[] = [
  "sku", "product", "quantity", "family", "unitCost", "demand", "batch", "manufacturing", "expiry",
  "zone", "aisle", "bay", "level", "hazardous", "pending", "grade", "holdCode",
];

const FIELD_ALIASES: Record<UniversalField, string[]> = {
  sku: ["sku", "item", "item_code", "item_number", "codigo", "codigo_articulo", "codigo_producto", "referencia", "reference", "part", "part_number", "prtnum", "material", "material_number", "article_code", "code_article", "codigo_artigo"],
  product: ["producto", "product", "nombre", "name", "descripcion", "description", "item_description", "designation", "libelle", "articulo", "article", "produto", "descricao"],
  family: ["familia", "family", "categoria", "category", "grupo", "group", "grupo_familiar", "product_family", "commodity", "famille", "categorie"],
  quantity: ["cantidad_ubicacion", "cantidad", "quantity", "qty", "qte", "stock", "stock_actual", "current_stock", "on_hand", "on_hand_qty", "available_qty", "existencias", "untqty", "total_untqty", "menge", "quantite", "quantidade"],
  unitCost: ["coste_unitario", "costo_unitario", "unit_cost", "unit_price", "coste", "costo", "precio_compra", "purchase_price", "prix_unitaire", "preco_unitario"],
  leadTime: ["lead_time_dias", "lead_time", "plazo_entrega", "plazo_reposicion", "delivery_time", "replenishment_time", "delai", "lieferzeit"],
  safetyStock: ["stock_seguridad", "safety_stock", "stock_minimo", "minimum_stock", "min_stock", "stock_securite"],
  demand: ["demanda_mensual", "monthly_demand", "consumo_mensual", "monthly_consumption", "ventas_mensuales", "average_demand", "demande_mensuelle"],
  salesM1: ["ventas_mes_1", "ventas_m1", "sales_month_1", "month_1", "mes_1", "consumo_mes_1"],
  salesM2: ["ventas_mes_2", "ventas_m2", "sales_month_2", "month_2", "mes_2", "consumo_mes_2"],
  salesM3: ["ventas_mes_3", "ventas_m3", "sales_month_3", "month_3", "mes_3", "consumo_mes_3"],
  location: ["ubicacion", "ubicacion_actual", "codigo_ubicacion", "location", "location_code", "bin", "bin_code", "bin_location", "slot", "storage_bin", "emplacement", "adresse_stockage"],
  zone: ["zona", "zone", "tipo_zona", "location_type", "tipo_ubicacion", "current_loc", "current_location", "storage_type", "area"],
  aisle: ["pasillo", "aisle", "allee", "gang", "corredor"],
  bay: ["modulo", "hueco", "posicion", "bay", "rack", "slot_number", "position", "travée"],
  level: ["altura", "nivel", "level", "height", "etage", "ebene"],
  batch: ["lote", "batch", "lot", "lot_number", "batch_number", "charge"],
  manufacturing: ["fecha_fabricacion", "fabricacion", "manufacturing_date", "production_date", "date_fabrication", "herstelldatum"],
  expiry: ["fecha_vencimiento", "fecha_caducidad", "caducidad", "vencimiento", "expiry", "expiry_date", "expiration_date", "best_before", "priority_date", "fefo_date", "date_expiration"],
  hazardous: ["apq", "hazardous", "dangerous_goods", "peligroso", "mercancia_peligrosa", "hazmat", "adr", "dangerous", "dangereux"],
  pending: ["picking_pendiente", "pending_picking", "pedidos_proximos", "salidas_pendientes", "allocated_qty", "open_order_qty", "committed_qty", "quantite_allouee"],
  capacity: ["capacidad_ubicacion", "capacidad", "capacity", "bin_capacity", "max_qty", "capacite"],
  totalAisles: ["total_pasillos", "numero_pasillos", "aisle_count", "number_of_aisles"],
  baysPerAisle: ["modulos_por_pasillo", "huecos_por_pasillo", "bays_per_aisle", "slots_per_aisle"],
  totalLevels: ["alturas_almacen", "numero_alturas", "total_alturas", "level_count", "number_of_levels"],
  grade: ["grade", "quality_grade", "stock_grade", "grado", "calidad", "quality_status"],
  holdCode: ["hold_code", "block_code", "codigo_bloqueo", "blocked", "quarantine_code", "status_code"],
  pickingIndicator: ["prp_pick", "prep_pick", "pick_flag", "picking_flag", "is_picking", "picking_indicator"],
};

const TERMINAL_LOCATION_HEADERS = new Set([
  "hd_number", "handling_unit", "handling_unit_number", "hu", "hu_number", "carton_number", "carton", "pallet", "pallet_number", "sscc", "license_plate",
]);

const DEFAULT_CAPACITY = 500;

export const normalizeUniversalHeader = (value: unknown) => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_|_$/g, "");

const columnLetter = (index: number) => {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
};

const emptyMapping = (): UniversalMapping => ({
  sku: null,
  product: null,
  family: null,
  quantity: null,
  unitCost: null,
  leadTime: null,
  safetyStock: null,
  demand: null,
  salesM1: null,
  salesM2: null,
  salesM3: null,
  location: null,
  zone: null,
  aisle: null,
  bay: null,
  level: null,
  batch: null,
  manufacturing: null,
  expiry: null,
  hazardous: null,
  pending: null,
  capacity: null,
  totalAisles: null,
  baysPerAisle: null,
  totalLevels: null,
  grade: null,
  holdCode: null,
  pickingIndicator: null,
  locationStart: null,
  locationEnd: null,
});

const aliasLookup = new Map<string, UniversalField[]>();
Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => aliases.forEach((alias) => {
  const normalized = normalizeUniversalHeader(alias);
  aliasLookup.set(normalized, [...(aliasLookup.get(normalized) ?? []), field as UniversalField]);
}));

const levenshtein = (left: string, right: string) => {
  if (left === right) return 0;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const saved = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + Number(left[row - 1] !== right[column - 1]),
      );
      diagonal = saved;
    }
  }
  return previous[right.length];
};

const aliasScore = (header: string, alias: string) => {
  if (!header || !alias) return 0;
  if (header === alias) return 1;
  if (header.length >= 5 && alias.length >= 5 && (header.includes(alias) || alias.includes(header))) return 0.86;
  const distance = levenshtein(header, alias);
  const similarity = 1 - distance / Math.max(header.length, alias.length);
  return similarity >= 0.78 ? similarity * 0.9 : 0;
};

const headerRowScore = (row: unknown[]) => {
  const matched = new Set<UniversalField>();
  let score = 0;
  row.forEach((cell) => {
    const normalized = normalizeUniversalHeader(cell);
    const fields = aliasLookup.get(normalized) ?? [];
    fields.forEach((field) => matched.add(field));
    if (fields.length) score += 4;
  });
  if (matched.has("sku")) score += 7;
  if (matched.has("quantity")) score += 7;
  if (matched.has("location") || matched.has("zone") || matched.has("aisle")) score += 3;
  score += Math.min(2, row.filter((cell) => String(cell ?? "").trim()).length * 0.08);
  return score;
};

const detectHeaderRow = (rows: unknown[][]) => {
  let bestIndex = 0;
  let bestScore = -1;
  rows.slice(0, 60).forEach((row, index) => {
    const score = headerRowScore(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return { index: bestIndex, score: bestScore };
};

const sampleValue = (rows: unknown[][], headerRowIndex: number, columnIndex: number) => {
  for (const row of rows.slice(headerRowIndex + 1, headerRowIndex + 30)) {
    const value = row[columnIndex];
    if (value !== null && value !== undefined && String(value).trim()) {
      if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
      return String(value).slice(0, 52);
    }
  }
  return "Sin muestra";
};

const zoneValueRatio = (rows: unknown[][], headerRowIndex: number, columnIndex: number) => {
  const values = rows.slice(headerRowIndex + 1, headerRowIndex + 121)
    .map((row) => normalizeUniversalHeader(row[columnIndex]))
    .filter(Boolean);
  if (!values.length) return 0;
  const zones = new Set(["pic", "pick", "picking", "str", "storage", "res", "reserva", "sol", "floor", "suelo", "qes", "quality", "qc", "apq", "haz", "hazardous"]);
  return values.filter((value) => zones.has(value)).length / values.length;
};

const inferMapping = (headers: unknown[], rows: unknown[][], headerRowIndex: number) => {
  const mapping = emptyMapping();
  const confidence: Partial<Record<UniversalField, number>> = {};
  const used = new Set<number>();
  const normalizedHeaders = headers.map(normalizeUniversalHeader);
  const orderedFields = (Object.keys(FIELD_ALIASES) as UniversalField[]).sort((left, right) => {
    const priority: UniversalField[] = ["sku", "quantity", "product", "batch", "expiry", "zone", "location"];
    return (priority.indexOf(left) === -1 ? 99 : priority.indexOf(left)) - (priority.indexOf(right) === -1 ? 99 : priority.indexOf(right));
  });

  orderedFields.forEach((field) => {
    let bestIndex = -1;
    let bestScore = 0;
    normalizedHeaders.forEach((header, index) => {
      if (used.has(index) || !header) return;
      const score = Math.max(...FIELD_ALIASES[field].map((alias) => aliasScore(header, normalizeUniversalHeader(alias))));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex >= 0 && bestScore >= 0.7) {
      mapping[field] = bestIndex;
      confidence[field] = bestScore;
      used.add(bestIndex);
    }
  });

  const currentLocationIndex = normalizedHeaders.findIndex((header) => ["current_loc", "current_location"].includes(header));
  if (currentLocationIndex >= 0 && zoneValueRatio(rows, headerRowIndex, currentLocationIndex) >= 0.55) {
    if (mapping.location === currentLocationIndex) mapping.location = null;
    mapping.zone = currentLocationIndex;
    confidence.zone = 1;
  }

  if (mapping.location !== null) {
    mapping.locationStart = mapping.location;
    mapping.locationEnd = mapping.location;
  } else if (mapping.zone !== null) {
    let end = mapping.zone;
    for (let index = mapping.zone + 1; index <= Math.min(headers.length - 1, mapping.zone + 7); index += 1) {
      const normalized = normalizedHeaders[index];
      if (TERMINAL_LOCATION_HEADERS.has(normalized)) break;
      const mappedAsBusinessField = (Object.entries(mapping) as Array<[string, number | null]>).some(([key, value]) => !["locationStart", "locationEnd"].includes(key) && value === index && key !== "location");
      if (mappedAsBusinessField && normalized !== "9") break;
      end = index;
    }
    if (end > mapping.zone) {
      mapping.locationStart = mapping.zone;
      mapping.locationEnd = end;
    }
  }

  return { mapping, confidence };
};

const signatureFor = (sheetName: string, headers: unknown[]) => `${normalizeUniversalHeader(sheetName)}::${headers.map(normalizeUniversalHeader).join("|")}`;

const createUniversalDraft = (sheets: UniversalSheetInput[], selectedSheet: UniversalSheetInput, headerRowIndex: number): UniversalImportDraft => {
  const safeHeaderRowIndex = clamp(headerRowIndex, 0, Math.max(0, selectedSheet.rows.length - 1));
  const headers = selectedSheet.rows[safeHeaderRowIndex] ?? [];
  const { mapping, confidence } = inferMapping(headers, selectedSheet.rows, safeHeaderRowIndex);
  const columns = headers.map((header, index) => {
    const raw = String(header ?? "").trim();
    const letter = columnLetter(index);
    return {
      index,
      letter,
      header: raw,
      label: raw ? `${letter} · ${raw}` : `${letter} · Sin encabezado`,
      sample: sampleValue(selectedSheet.rows, safeHeaderRowIndex, index),
    };
  });
  const warnings: string[] = [];
  if (safeHeaderRowIndex > 0) warnings.push(`Encabezados detectados en la fila ${safeHeaderRowIndex + 1}. Puedes corregirla antes de importar.`);
  if (mapping.product === null) warnings.push("No se detectó descripción: se utilizará el SKU como nombre provisional.");
  if (mapping.locationStart !== null && mapping.locationEnd !== null && mapping.locationEnd > mapping.locationStart) {
    warnings.push(`Ubicación compuesta detectada entre las columnas ${columnLetter(mapping.locationStart)} y ${columnLetter(mapping.locationEnd)}.`);
  }
  return {
    sheetName: selectedSheet.name,
    rows: selectedSheet.rows,
    workbookSheets: sheets,
    sheetOptions: sheets.map((sheet) => ({
      name: sheet.name,
      suggestedHeaderRowIndex: detectHeaderRow(sheet.rows).index,
      rowCount: sheet.rows.length,
    })),
    headerRowIndex: safeHeaderRowIndex,
    columns,
    mapping,
    confidence,
    dataRowCount: selectedSheet.rows.slice(safeHeaderRowIndex + 1).filter((row) => row.some((value) => String(value ?? "").trim())).length,
    profileSignature: signatureFor(selectedSheet.name, headers),
    warnings,
  };
};

export function analyzeUniversalWorkbook(sheets: UniversalSheetInput[]): UniversalImportDraft {
  if (!sheets.length) throw new Error("El libro no contiene hojas legibles.");
  const candidates = sheets.map((sheet) => ({ sheet, header: detectHeaderRow(sheet.rows) }));
  candidates.sort((left, right) => right.header.score - left.header.score || right.sheet.rows.length - left.sheet.rows.length);
  return createUniversalDraft(sheets, candidates[0].sheet, candidates[0].header.index);
}

export function reanalyzeUniversalDraft(draft: UniversalImportDraft, sheetName: string, headerRowIndex?: number): UniversalImportDraft {
  const sheet = draft.workbookSheets.find((item) => item.name === sheetName) ?? draft.workbookSheets[0];
  if (!sheet) throw new Error("La hoja seleccionada ya no está disponible.");
  const suggested = draft.sheetOptions.find((item) => item.name === sheet.name)?.suggestedHeaderRowIndex ?? detectHeaderRow(sheet.rows).index;
  return createUniversalDraft(draft.workbookSheets, sheet, headerRowIndex ?? suggested);
}

const parseNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : Number.NaN;
  let normalized = String(value).trim().replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) normalized = normalized.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : Number.NaN;
};

const parseBoolean = (value: unknown) => ["si", "s", "yes", "y", "true", "1", "apq", "hazardous", "hazmat", "peligroso", "adr"].includes(normalizeUniversalHeader(value));

const cleanDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && value >= 1 && value <= 100000) {
    return new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86_400_000).toISOString().slice(0, 10);
  }
  const text = String(value ?? "").trim();
  if (!text) return "";
  const iso = text.match(/^(\d{4})[-/]([01]?\d)[-/]([0-3]?\d)/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const european = text.match(/^([0-3]?\d)[-/]([01]?\d)[-/](\d{4})/);
  if (european) return `${european[3]}-${european[2].padStart(2, "0")}-${european[1].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
};

const cellText = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return String(value ?? "").trim();
};

const hasCellValue = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== "";

const translateZone = (value: unknown): WarehouseZone | undefined => {
  const zone = normalizeUniversalHeader(value);
  if (["apq", "haz", "hazardous", "hazmat", "adr", "dangerous_goods"].includes(zone)) return "APQ";
  if (["pic", "pick", "picking", "prp"].includes(zone)) return "PICKING";
  if (["str", "storage", "reserve", "reserva", "res"].includes(zone)) return "RESERVA";
  if (["sol", "floor", "suelo", "ground"].includes(zone)) return "SUELO";
  if (["qes", "quality", "qc", "quarantine", "cuarentena", "blocked", "calidad"].includes(zone)) return "CALIDAD";
  return undefined;
};

const deriveLevel = (explicit: unknown, sourceZone: WarehouseZone | undefined, locationParts: string[]) => {
  const direct = parseNumber(explicit, 0);
  if (direct >= 1 && direct <= 7) return Math.round(direct);
  if (direct >= 10 && direct <= 70 && direct % 10 === 0) return direct / 10;
  if (["PICKING", "SUELO", "CALIDAD"].includes(sourceZone ?? "")) return 1;
  for (let index = locationParts.length - 1; index >= 0; index -= 1) {
    if (/^(10|20|30|40|50|60|70)$/.test(locationParts[index])) return Number(locationParts[index]) / 10;
  }
  return sourceZone === "RESERVA" ? 2 : 1;
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function translateUniversalDraft(draft: UniversalImportDraft, mapping: UniversalMapping = draft.mapping): WarehouseParseResult {
  if (mapping.sku === null || mapping.quantity === null) {
    return { dataset: null, items: [], errors: ["Asigna al menos las columnas SKU y cantidad."], warnings: draft.warnings };
  }
  const read = (row: unknown[], field: UniversalField) => mapping[field] === null ? "" : row[mapping[field] as number];
  const rows = draft.rows.slice(draft.headerRowIndex + 1).filter((row) => row.some((value) => String(value ?? "").trim()));
  const warnings = [...draft.warnings];
  const stocks: WarehouseStock[] = [];
  const locationOverrides: WarehouseLocationOverride[] = [];
  const aisleFamilies: Record<number, string> = {};
  const locationCoordinates = new Map<string, { aisle: number; bay: number; level: number }>();
  const occupiedCoordinates = new Set<string>();
  let requestedAisles = 0;
  let requestedBays = 0;
  let requestedLevels = 0;
  let skippedRows = 0;

  const hasDemand = mapping.demand !== null || mapping.salesM1 !== null || mapping.salesM2 !== null || mapping.salesM3 !== null;
  const hasExplicitLayout = mapping.aisle !== null && mapping.bay !== null && mapping.level !== null;
  const hasLocation = mapping.locationStart !== null || mapping.location !== null || hasExplicitLayout;
  const hasHazardousZones = rows.some((row) => {
    const rangeFirst = mapping.locationStart === null ? "" : row[mapping.locationStart];
    return translateZone(read(row, "zone")) === "APQ" || translateZone(rangeFirst) === "APQ";
  });
  const capabilities: WarehouseCapabilities = {
    product: mapping.product !== null,
    family: mapping.family !== null,
    unitCost: mapping.unitCost !== null,
    demand: hasDemand,
    location: hasLocation,
    completeLayout: hasExplicitLayout,
    hazardous: mapping.hazardous !== null || hasHazardousZones,
    manufacturingDate: mapping.manufacturing !== null,
    expiryDate: mapping.expiry !== null,
    pendingPicking: mapping.pending !== null,
  };

  const allocate = (sourceCode: string, preferredLevel: number) => {
    const existing = locationCoordinates.get(sourceCode);
    if (existing) return existing;
    const levels = [clamp(preferredLevel, 1, 7), ...Array.from({ length: 7 }, (_, index) => index + 1).filter((level) => level !== preferredLevel)];
    for (const level of levels) {
      for (let aisle = 1; aisle <= 40; aisle += 1) {
        for (let bay = 1; bay <= 80; bay += 1) {
          const key = `${aisle}-${bay}-${level}`;
          if (!occupiedCoordinates.has(key)) {
            occupiedCoordinates.add(key);
            const coordinate = { aisle, bay, level };
            locationCoordinates.set(sourceCode, coordinate);
            return coordinate;
          }
        }
      }
    }
    return { aisle: 40, bay: 80, level: clamp(preferredLevel, 1, 7) };
  };

  rows.forEach((row, index) => {
    const rowNumber = draft.headerRowIndex + index + 2;
    const sku = cellText(read(row, "sku"));
    const quantity = parseNumber(read(row, "quantity"), 0);
    const locationParts = mapping.locationStart !== null
      ? row.slice(mapping.locationStart, (mapping.locationEnd ?? mapping.locationStart) + 1).map(cellText).filter(Boolean)
      : mapping.location !== null ? [cellText(read(row, "location"))].filter(Boolean) : [];
    const sourceLocationCode = locationParts.join("-");
    const sourceZone = translateZone(read(row, "zone")) || translateZone(locationParts[0]);
    const hazardous = parseBoolean(read(row, "hazardous")) || sourceZone === "APQ";
    const family = cellText(read(row, "family")) || (hazardous ? "APQ · Sin asignar" : "Sin asignar");
    const explicitAisle = parseNumber(read(row, "aisle"), 0);
    const explicitBay = parseNumber(read(row, "bay"), 0);
    const level = deriveLevel(read(row, "level"), sourceZone, locationParts);
    const sourceKey = sourceLocationCode || `SIN-UBICACION-${rowNumber}`;
    const coordinate = explicitAisle && explicitBay
      ? { aisle: Math.round(explicitAisle), bay: Math.round(explicitBay), level }
      : allocate(sourceKey, level);
    requestedAisles = Math.max(requestedAisles, coordinate.aisle, parseNumber(read(row, "totalAisles"), 0));
    requestedBays = Math.max(requestedBays, coordinate.bay, parseNumber(read(row, "baysPerAisle"), 0));
    requestedLevels = Math.max(requestedLevels, coordinate.level, parseNumber(read(row, "totalLevels"), 0));

    if (!sku) {
      if (sourceLocationCode || hasExplicitLayout) {
        locationOverrides.push({ ...coordinate, sourceCode: sourceLocationCode || undefined, family, hazardous, zone: sourceZone, capacity: parseNumber(read(row, "capacity"), DEFAULT_CAPACITY) });
      } else skippedRows += 1;
      return;
    }
    if (Number.isNaN(quantity)) {
      skippedRows += 1;
      return;
    }
    const demand = parseNumber(read(row, "demand"), 0);
    const salesM1 = mapping.salesM1 !== null ? parseNumber(read(row, "salesM1"), demand) : demand;
    const salesM2 = mapping.salesM2 !== null ? parseNumber(read(row, "salesM2"), salesM1) : salesM1;
    const salesM3 = mapping.salesM3 !== null ? parseNumber(read(row, "salesM3"), salesM2) : salesM2;
    const unitCost = parseNumber(read(row, "unitCost"), 0);
    const pendingPicking = parseNumber(read(row, "pending"), 0);
    const capacity = Math.max(parseNumber(read(row, "capacity"), DEFAULT_CAPACITY), quantity);
    if ([salesM1, salesM2, salesM3, unitCost, pendingPicking, capacity].some(Number.isNaN)) {
      skippedRows += 1;
      return;
    }
    const product = cellText(read(row, "product")) || sku;
    const rowDemandAvailable = (["demand", "salesM1", "salesM2", "salesM3"] as UniversalField[])
      .some((field) => mapping[field] !== null && hasCellValue(read(row, field)));
    stocks.push({
      id: `universal-${rowNumber}-${index}`,
      sku,
      product,
      family,
      quantity,
      unitCost,
      leadTimeDays: parseNumber(read(row, "leadTime"), 7),
      safetyStock: parseNumber(read(row, "safetyStock"), 0),
      salesM1,
      salesM2,
      salesM3,
      aisle: coordinate.aisle,
      bay: coordinate.bay,
      level: coordinate.level,
      batch: cellText(read(row, "batch")),
      manufacturingDate: cleanDate(read(row, "manufacturing")),
      expiryDate: cleanDate(read(row, "expiry")),
      hazardous,
      pendingPicking,
      capacity,
      sourceLocationCode: sourceLocationCode || undefined,
      sourceZone,
      qualityGrade: cellText(read(row, "grade")) || undefined,
      holdCode: cellText(read(row, "holdCode")) || undefined,
      dataQuality: {
        productAvailable: mapping.product !== null && hasCellValue(read(row, "product")),
        familyAvailable: mapping.family !== null && hasCellValue(read(row, "family")),
        unitCostAvailable: mapping.unitCost !== null && hasCellValue(read(row, "unitCost")),
        demandAvailable: rowDemandAvailable,
      },
    });
    if (!aisleFamilies[coordinate.aisle]) aisleFamilies[coordinate.aisle] = hazardous ? "APQ" : family;
  });

  if (!stocks.length) {
    return { dataset: null, items: [], errors: ["No se encontraron filas válidas con SKU y cantidad."], warnings };
  }
  capabilities.product = stocks.some((stock) => stock.dataQuality?.productAvailable);
  capabilities.family = stocks.some((stock) => stock.dataQuality?.familyAvailable);
  capabilities.unitCost = stocks.some((stock) => stock.dataQuality?.unitCostAvailable);
  capabilities.demand = stocks.some((stock) => stock.dataQuality?.demandAvailable);
  const skuQuality = new Map<string, { demand: boolean; cost: boolean }>();
  stocks.forEach((stock) => {
    const current = skuQuality.get(stock.sku) ?? { demand: false, cost: false };
    skuQuality.set(stock.sku, {
      demand: current.demand || Boolean(stock.dataQuality?.demandAvailable),
      cost: current.cost || Boolean(stock.dataQuality?.unitCostAvailable),
    });
  });
  const missingDemandSku = [...skuQuality.values()].filter((quality) => !quality.demand).length;
  const missingCostSku = [...skuQuality.values()].filter((quality) => !quality.cost).length;
  if (skippedRows) warnings.push(`${skippedRows} filas vacías o inválidas se omitieron sin bloquear la importación.`);
  if (!capabilities.product) warnings.push("Producto no disponible: se muestra el SKU como descripción provisional.");
  if (!capabilities.family) warnings.push("Familia no disponible: clasifica los SKU para aplicar slotting familiar.");
  if (!capabilities.unitCost) warnings.push("Coste no disponible: el valor de inventario y el ABC económico quedan pendientes.");
  else if (missingCostSku) warnings.push(`${missingCostSku} SKU no incluyen coste: su valor y ABC económico se mostrarán como no disponibles.`);
  if (!capabilities.demand) warnings.push("Demanda no disponible: no se calcularán sobrestock, cobertura ni aprovisionamiento.");
  else if (missingDemandSku) warnings.push(`${missingDemandSku} SKU no incluyen demanda: se pausarán sus cálculos de cobertura, sobrestock y reposición.`);
  if (!capabilities.pendingPicking) warnings.push("Picking pendiente no disponible: los indicadores 0/1 no se interpretan como unidades de pedidos.");
  if (!capabilities.hazardous) warnings.push("APQ no disponible: no se asignará mercancía peligrosa sin una columna explícita.");
  if (!capabilities.completeLayout) warnings.push("El archivo solo confirma ubicaciones ocupadas; no se inventarán huecos vacíos que no aparezcan en un maestro de ubicaciones.");

  const levelCount = clamp(Math.round(requestedLevels || 6), 5, 7);
  const config = {
    aisleCount: clamp(Math.round(requestedAisles || 6), 1, 40),
    baysPerAisle: clamp(Math.round(requestedBays || 8), 1, 80),
    levelCount,
    defaultCapacity: DEFAULT_CAPACITY,
    apqAisles: [...new Set(stocks.filter((stock) => stock.hazardous).map((stock) => stock.aisle))],
  };
  const dataset: WarehouseDataset = {
    config,
    stocks,
    locationOverrides,
    aisleFamilies,
    warnings: [...new Set(warnings)].slice(0, 16),
    layoutMode: capabilities.completeLayout ? "structured" : "source",
    capabilities,
    importSummary: {
      sheetName: draft.sheetName,
      headerRow: draft.headerRowIndex + 1,
      dataRows: rows.length,
      mappedFields: (Object.values(mapping).filter((value) => value !== null).length - Number(mapping.locationStart !== null) - Number(mapping.locationEnd !== null)),
      profileSignature: draft.profileSignature,
    },
  };
  return { dataset, items: inventoryFromWarehouse(dataset), errors: [], warnings: dataset.warnings };
}
