import {
  buildWarehouseLocations,
  formatLocationCode,
  inventoryFromWarehouse,
  type WarehouseCapabilities,
  type WarehouseCycleCountData,
  type WarehouseCycleCountRecord,
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
  | "pickingIndicator"
  | "countCampaign"
  | "countStatus"
  | "physicalCount"
  | "countedAt"
  | "countDeadline"
  | "countWorkdays";

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

export type UniversalEnrichmentResult = {
  dataset: WarehouseDataset | null;
  items: ReturnType<typeof inventoryFromWarehouse>;
  errors: string[];
  warnings: string[];
  updatedSkuCount: number;
  updatedLocationCount: number;
  updatedRowCount: number;
  appliedFields: UniversalField[];
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
  countCampaign: "Campaña de conteo",
  countStatus: "Estado del conteo por ubicación",
  physicalCount: "Cantidad física contada",
  countedAt: "Fecha del conteo realizado",
  countDeadline: "Fecha final de la campaña",
  countWorkdays: "Días operativos por semana",
};

export const UNIVERSAL_EDITABLE_FIELDS: UniversalField[] = [
  "sku", "product", "quantity", "family", "unitCost", "demand", "salesM1", "salesM2", "salesM3",
  "leadTime", "safetyStock", "location", "zone", "aisle", "bay", "level", "batch", "manufacturing",
  "expiry", "hazardous", "pending", "capacity", "totalAisles", "baysPerAisle", "totalLevels", "grade",
  "holdCode", "pickingIndicator", "countCampaign", "countStatus", "physicalCount", "countedAt",
  "countDeadline", "countWorkdays",
];

const FIELD_ALIASES: Record<UniversalField, string[]> = {
  sku: ["sku", "item", "item_code", "item_number", "codigo", "codigo_articulo", "codigo_producto", "referencia", "reference", "part", "part_number", "prtnum", "material", "material_number", "article_code", "code_article", "codigo_artigo"],
  product: ["producto", "product", "nombre", "name", "descripcion", "description", "item_description", "designation", "libelle", "articulo", "article", "produto", "descricao"],
  family: ["familia", "family", "categoria", "category", "grupo", "group", "grupo_familiar", "product_family", "commodity", "famille", "categorie"],
  quantity: ["cantidad_ubicacion", "cantidad", "cantidades", "unidades", "quantity", "qty", "qte", "stock", "stock_actual", "current_stock", "on_hand", "on_hand_qty", "available_qty", "existencias", "untqty", "total_untqty", "menge", "quantite", "quantidade"],
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
  countCampaign: ["campana_conteo", "campana_de_conteo", "count_campaign", "cycle_count_campaign", "ciclo_conteo"],
  countStatus: ["estado_conteo", "estatus_conteo", "conteo_estado", "count_status", "cycle_count_status", "estado_inventario_fisico"],
  physicalCount: ["conteo_fisico", "cantidad_contada", "physical_count", "counted_quantity", "counted_qty", "stock_fisico"],
  countedAt: ["fecha_conteo", "fecha_de_conteo", "count_date", "counted_at", "cycle_count_date"],
  countDeadline: ["fecha_limite_conteo", "fecha_final_conteo", "fin_campana_conteo", "count_deadline", "cycle_count_deadline"],
  countWorkdays: ["dias_conteo_semana", "dias_operativos_semana", "workdays_per_week", "count_workdays_per_week"],
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
  countCampaign: null,
  countStatus: null,
  physicalCount: null,
  countedAt: null,
  countDeadline: null,
  countWorkdays: null,
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

const CYCLE_COUNT_FIELDS: UniversalField[] = [
  "countCampaign", "countStatus", "physicalCount", "countedAt", "countDeadline", "countWorkdays",
];

const parseCycleCountStatus = (value: unknown, physicalCount: unknown, countedAt: unknown) => {
  const normalized = normalizeUniversalHeader(value);
  if (["excluido", "excluida", "excluded", "fuera_alcance", "no_aplica", "n_a"].includes(normalized)) return "excluded" as const;
  if (["contado", "contada", "completado", "completada", "cerrado", "closed", "counted", "done", "finalizado"].includes(normalized)) return "counted" as const;
  if (["pendiente", "pending", "abierto", "open", "por_contar", "no_contado", "sin_contar"].includes(normalized)) return "pending" as const;
  if (hasCellValue(physicalCount) || hasCellValue(countedAt)) return "counted" as const;
  return "pending" as const;
};

const mergeCountStatus = (
  left: WarehouseCycleCountRecord["status"],
  right: WarehouseCycleCountRecord["status"],
) => left === "pending" || right === "pending"
  ? "pending"
  : left === "counted" || right === "counted"
    ? "counted"
    : "excluded";

const distinctText = (...groups: string[][]) => [...new Set(groups.flat().filter(Boolean))];

const extractCycleCountData = (
  draft: UniversalImportDraft,
  mapping: UniversalMapping,
  dataset: WarehouseDataset,
): WarehouseCycleCountData | null => {
  if (!CYCLE_COUNT_FIELDS.some((field) => mapping[field] !== null)) return null;
  const hasExplicitCoordinates = mapping.aisle !== null && mapping.bay !== null;
  if (mapping.locationStart === null && mapping.location === null && !hasExplicitCoordinates) return null;

  const read = (row: unknown[], field: UniversalField) => mapping[field] === null ? "" : row[mapping[field] as number];
  const rows = draft.rows.slice(draft.headerRowIndex + 1).filter((row) => row.some((value) => hasCellValue(value)));
  const locations = buildWarehouseLocations(dataset);
  const records = new Map<string, WarehouseCycleCountRecord>();
  let campaign = "";
  let deadline = "";
  let workdaysPerWeek: 5 | 6 | 7 = dataset.cycleCount?.workdaysPerWeek ?? 5;

  rows.forEach((row) => {
    const locationParts = mapping.locationStart !== null
      ? row.slice(mapping.locationStart, (mapping.locationEnd ?? mapping.locationStart) + 1).map(cellText).filter(Boolean)
      : mapping.location !== null ? [cellText(read(row, "location"))].filter(Boolean) : [];
    const sourceLocationCode = locationParts.join("-");
    const explicitAisle = parseNumber(read(row, "aisle"), 0);
    const explicitBay = parseNumber(read(row, "bay"), 0);
    const sourceZone = translateZone(read(row, "zone")) || translateZone(locationParts[0]);
    const explicitLevel = deriveLevel(read(row, "level"), sourceZone, locationParts);
    const locationNumbers = sourceLocationCode.match(/\d+/g)?.map(Number) ?? [];
    const resolvedAisle = explicitAisle || locationNumbers[0] || 0;
    const resolvedBay = explicitBay || locationNumbers[1] || 0;
    const resolvedLevel = hasCellValue(read(row, "level")) ? explicitLevel : locationNumbers[2] || explicitLevel;
    const location = locations.find((candidate) => sourceLocationCode && (
      normalizeUniversalHeader(candidate.sourceCode) === normalizeUniversalHeader(sourceLocationCode)
      || normalizeUniversalHeader(candidate.code) === normalizeUniversalHeader(sourceLocationCode)
    )) ?? locations.find((candidate) => resolvedAisle && resolvedBay
      && candidate.aisle === Math.round(resolvedAisle)
      && candidate.bay === Math.round(resolvedBay)
      && candidate.level === Math.round(resolvedLevel));
    if (!location) return;

    const rawPhysicalCount = read(row, "physicalCount");
    const rawCountedAt = read(row, "countedAt");
    const parsedPhysicalCount = parseNumber(rawPhysicalCount, Number.NaN);
    const status = parseCycleCountStatus(read(row, "countStatus"), rawPhysicalCount, rawCountedAt);
    const sku = cellText(read(row, "sku"));
    const product = cellText(read(row, "product"));
    const key = `${location.aisle}-${location.bay}-${location.level}`;
    const next: WarehouseCycleCountRecord = {
      locationCode: location.code || formatLocationCode(location.aisle, location.bay, location.level),
      sourceLocationCode: sourceLocationCode || location.sourceCode,
      aisle: location.aisle,
      bay: location.bay,
      level: location.level,
      zone: location.zone,
      family: location.family,
      status,
      physicalCount: Number.isNaN(parsedPhysicalCount) ? null : parsedPhysicalCount,
      countedAt: cleanDate(rawCountedAt),
      systemQuantity: location.quantity,
      pendingPicking: location.pendingPicking,
      skus: sku ? [sku] : location.contents.map((stock) => stock.sku),
      products: product ? [product] : location.contents.map((stock) => stock.product),
    };
    const current = records.get(key);
    records.set(key, current ? {
      ...current,
      status: mergeCountStatus(current.status, next.status),
      physicalCount: current.physicalCount === null
        ? next.physicalCount
        : next.physicalCount === null ? current.physicalCount : current.physicalCount + next.physicalCount,
      countedAt: current.countedAt || next.countedAt,
      skus: distinctText(current.skus, next.skus),
      products: distinctText(current.products, next.products),
    } : next);

    if (!campaign && hasCellValue(read(row, "countCampaign"))) campaign = cellText(read(row, "countCampaign"));
    if (!deadline && hasCellValue(read(row, "countDeadline"))) deadline = cleanDate(read(row, "countDeadline"));
    if (hasCellValue(read(row, "countWorkdays"))) {
      workdaysPerWeek = clamp(Math.round(parseNumber(read(row, "countWorkdays"), 5)), 5, 7) as 5 | 6 | 7;
    }
  });

  if (!records.size) return null;
  return {
    campaign: campaign || dataset.cycleCount?.campaign || "Conteo importado",
    deadline: deadline || dataset.cycleCount?.deadline || "",
    workdaysPerWeek,
    records: [...records.values()].sort((left, right) => left.aisle - right.aisle || left.bay - right.bay || left.level - right.level),
  };
};

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
  dataset.cycleCount = extractCycleCountData(draft, mapping, dataset) ?? undefined;
  if (dataset.cycleCount && !dataset.cycleCount.deadline) {
    dataset.warnings = [...new Set([...dataset.warnings, "Conteo por ubicación importado sin fecha final: el ritmo diario quedará pendiente."])].slice(0, 16);
  }
  return { dataset, items: inventoryFromWarehouse(dataset), errors: [], warnings: dataset.warnings };
}

const ENRICHMENT_VALUE_FIELDS: UniversalField[] = [
  "product", "family", "quantity", "unitCost", "leadTime", "safetyStock", "demand", "salesM1", "salesM2",
  "salesM3", "location", "zone", "aisle", "bay", "level", "batch", "manufacturing", "expiry", "hazardous",
  "pending", "capacity", "totalAisles", "baysPerAisle", "totalLevels", "grade", "holdCode", ...CYCLE_COUNT_FIELDS,
];

export function enrichWarehouseDataset(
  baseDataset: WarehouseDataset,
  draft: UniversalImportDraft,
  mapping: UniversalMapping = draft.mapping,
  source: { name?: string; format?: string } = {},
): UniversalEnrichmentResult {
  const hasCycleCountMapping = CYCLE_COUNT_FIELDS.some((field) => mapping[field] !== null)
    && (mapping.locationStart !== null || mapping.location !== null || (mapping.aisle !== null && mapping.bay !== null));
  if (mapping.sku === null && !hasCycleCountMapping) {
    return { dataset: null, items: [], errors: ["Para complementar datos debes asignar el SKU o una ubicación con campos de conteo."], warnings: [], updatedSkuCount: 0, updatedLocationCount: 0, updatedRowCount: 0, appliedFields: [] };
  }
  const mappedValueFields = ENRICHMENT_VALUE_FIELDS.filter((field) => mapping[field] !== null);
  if (!mappedValueFields.length && mapping.locationStart === null) {
    return { dataset: null, items: [], errors: ["Asigna al menos un dato adicional al SKU o al conteo por ubicación."], warnings: [], updatedSkuCount: 0, updatedLocationCount: 0, updatedRowCount: 0, appliedFields: [] };
  }

  const dataset: WarehouseDataset = {
    ...baseDataset,
    config: { ...baseDataset.config, apqAisles: [...baseDataset.config.apqAisles] },
    stocks: baseDataset.stocks.map((stock) => ({ ...stock, dataQuality: stock.dataQuality ? { ...stock.dataQuality } : undefined })),
    locationOverrides: baseDataset.locationOverrides.map((override) => ({ ...override })),
    aisleFamilies: { ...baseDataset.aisleFamilies },
    warnings: [...baseDataset.warnings],
    capabilities: baseDataset.capabilities ? { ...baseDataset.capabilities } : undefined,
    dataSources: [...(baseDataset.dataSources ?? [])],
    cycleCount: baseDataset.cycleCount ? {
      ...baseDataset.cycleCount,
      records: baseDataset.cycleCount.records.map((record) => ({ ...record, skus: [...record.skus], products: [...record.products] })),
    } : undefined,
  };
  const rows = draft.rows.slice(draft.headerRowIndex + 1).filter((row) => row.some((value) => hasCellValue(value)));
  const read = (row: unknown[], field: UniversalField) => mapping[field] === null ? "" : row[mapping[field] as number];
  const bySku = new Map<string, WarehouseStock[]>();
  dataset.stocks.forEach((stock) => {
    const key = normalizeUniversalHeader(stock.sku);
    bySku.set(key, [...(bySku.get(key) ?? []), stock]);
  });
  const appliedFields = new Set<UniversalField>();
  const updatedSkus = new Set<string>();
  const unmatchedSkus = new Set<string>();
  const ambiguousRows: number[] = [];
  let updatedRowCount = 0;
  const qualityFor = (stock: WarehouseStock) => ({
    productAvailable: stock.dataQuality?.productAvailable ?? dataset.capabilities?.product ?? true,
    familyAvailable: stock.dataQuality?.familyAvailable ?? dataset.capabilities?.family ?? true,
    unitCostAvailable: stock.dataQuality?.unitCostAvailable ?? dataset.capabilities?.unitCost ?? true,
    demandAvailable: stock.dataQuality?.demandAvailable ?? dataset.capabilities?.demand ?? true,
  });

  rows.forEach((row, index) => {
    const rowNumber = draft.headerRowIndex + index + 2;
    const sku = cellText(read(row, "sku"));
    if (!sku) return;
    const skuStocks = bySku.get(normalizeUniversalHeader(sku)) ?? [];
    if (!skuStocks.length) {
      unmatchedSkus.add(sku);
      return;
    }
    const locationParts = mapping.locationStart !== null
      ? row.slice(mapping.locationStart, (mapping.locationEnd ?? mapping.locationStart) + 1).map(cellText).filter(Boolean)
      : mapping.location !== null ? [cellText(read(row, "location"))].filter(Boolean) : [];
    const sourceLocation = locationParts.join("-");
    const explicitAisle = parseNumber(read(row, "aisle"), 0);
    const explicitBay = parseNumber(read(row, "bay"), 0);
    const explicitLevel = parseNumber(read(row, "level"), 0);
    let locationStocks = sourceLocation
      ? skuStocks.filter((stock) => normalizeUniversalHeader(stock.sourceLocationCode) === normalizeUniversalHeader(sourceLocation))
      : [];
    if (!locationStocks.length && explicitAisle && explicitBay) {
      locationStocks = skuStocks.filter((stock) => stock.aisle === Math.round(explicitAisle)
        && stock.bay === Math.round(explicitBay)
        && (!explicitLevel || stock.level === deriveLevel(explicitLevel, stock.sourceZone, [])));
    }
    if (!locationStocks.length && skuStocks.length === 1 && !sourceLocation) locationStocks = skuStocks;
    const businessTargets = locationStocks.length ? locationStocks : skuStocks;
    let rowApplied = false;
    const apply = (field: UniversalField, targets: WarehouseStock[], callback: (stock: WarehouseStock, value: unknown) => boolean | void) => {
      const value = read(row, field);
      if (!targets.length || mapping[field] === null || !hasCellValue(value)) return;
      let applied = false;
      targets.forEach((stock) => {
        if (callback(stock, value) !== false) applied = true;
      });
      if (!applied) return;
      appliedFields.add(field);
      rowApplied = true;
    };

    apply("product", businessTargets, (stock, value) => {
      stock.product = cellText(value);
      stock.dataQuality = { ...qualityFor(stock), productAvailable: true };
    });
    apply("family", businessTargets, (stock, value) => {
      stock.family = cellText(value);
      stock.dataQuality = { ...qualityFor(stock), familyAvailable: true };
      if (!dataset.aisleFamilies[stock.aisle] || dataset.aisleFamilies[stock.aisle] === "Sin asignar") dataset.aisleFamilies[stock.aisle] = stock.family;
    });
    apply("unitCost", businessTargets, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.unitCost = parsed;
        stock.dataQuality = { ...qualityFor(stock), unitCostAvailable: true };
        return true;
      }
      return false;
    });
    apply("leadTime", businessTargets, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.leadTimeDays = parsed;
        return true;
      }
      return false;
    });
    apply("safetyStock", businessTargets, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.safetyStock = parsed;
        return true;
      }
      return false;
    });
    apply("demand", businessTargets, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.salesM1 = parsed;
        stock.salesM2 = parsed;
        stock.salesM3 = parsed;
        stock.dataQuality = { ...qualityFor(stock), demandAvailable: true };
        return true;
      }
      return false;
    });
    (["salesM1", "salesM2", "salesM3"] as UniversalField[]).forEach((field) => apply(field, businessTargets, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        if (field === "salesM1") stock.salesM1 = parsed;
        if (field === "salesM2") stock.salesM2 = parsed;
        if (field === "salesM3") stock.salesM3 = parsed;
        stock.dataQuality = { ...qualityFor(stock), demandAvailable: true };
        return true;
      }
      return false;
    }));
    apply("hazardous", businessTargets, (stock, value) => { stock.hazardous = parseBoolean(value); });

    const locationSpecificMapped = (["quantity", "pending", "batch", "manufacturing", "expiry", "capacity", "grade", "holdCode"] as UniversalField[])
      .some((field) => mapping[field] !== null && hasCellValue(read(row, field)));
    if (locationSpecificMapped && !locationStocks.length) ambiguousRows.push(rowNumber);
    apply("quantity", locationStocks, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.quantity = parsed;
        return true;
      }
      return false;
    });
    apply("pending", locationStocks, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.pendingPicking = parsed;
        return true;
      }
      return false;
    });
    apply("batch", locationStocks, (stock, value) => { stock.batch = cellText(value); });
    apply("manufacturing", locationStocks, (stock, value) => { stock.manufacturingDate = cleanDate(value); });
    apply("expiry", locationStocks, (stock, value) => { stock.expiryDate = cleanDate(value); });
    apply("capacity", locationStocks, (stock, value) => {
      const parsed = parseNumber(value, Number.NaN);
      if (!Number.isNaN(parsed)) {
        stock.capacity = Math.max(stock.quantity, parsed);
        return true;
      }
      return false;
    });
    apply("grade", locationStocks, (stock, value) => { stock.qualityGrade = cellText(value); });
    apply("holdCode", locationStocks, (stock, value) => { stock.holdCode = cellText(value); });
    apply("zone", locationStocks.length ? locationStocks : businessTargets, (stock, value) => {
      const zone = translateZone(value);
      if (zone) {
        stock.sourceZone = zone;
        if (zone === "APQ") stock.hazardous = true;
      }
    });
    if (sourceLocation && locationStocks.length) {
      locationStocks.forEach((stock) => { stock.sourceLocationCode = sourceLocation; });
      appliedFields.add("location");
      rowApplied = true;
    }
    if (explicitAisle && explicitBay && locationStocks.length) {
      locationStocks.forEach((stock) => {
        stock.aisle = Math.round(explicitAisle);
        stock.bay = Math.round(explicitBay);
        if (explicitLevel) stock.level = deriveLevel(explicitLevel, stock.sourceZone, []);
      });
      appliedFields.add("aisle");
      appliedFields.add("bay");
      if (explicitLevel) appliedFields.add("level");
      rowApplied = true;
    }

    const totalAisles = parseNumber(read(row, "totalAisles"), 0);
    const baysPerAisle = parseNumber(read(row, "baysPerAisle"), 0);
    const totalLevels = parseNumber(read(row, "totalLevels"), 0);
    if (mapping.totalAisles !== null && totalAisles) {
      dataset.config.aisleCount = clamp(Math.round(totalAisles), 1, 40);
      appliedFields.add("totalAisles");
      rowApplied = true;
    }
    if (mapping.baysPerAisle !== null && baysPerAisle) {
      dataset.config.baysPerAisle = clamp(Math.round(baysPerAisle), 1, 80);
      appliedFields.add("baysPerAisle");
      rowApplied = true;
    }
    if (mapping.totalLevels !== null && totalLevels) {
      dataset.config.levelCount = clamp(Math.round(totalLevels), 5, 7);
      appliedFields.add("totalLevels");
      rowApplied = true;
    }
    if (rowApplied) {
      updatedSkus.add(sku);
      updatedRowCount += 1;
    }
  });

  const importedCycleCount = extractCycleCountData(draft, mapping, dataset);
  let updatedLocationCount = 0;
  if (importedCycleCount) {
    const recordsByLocation = new Map(
      (dataset.cycleCount?.records ?? []).map((record) => [`${record.aisle}-${record.bay}-${record.level}`, record]),
    );
    importedCycleCount.records.forEach((record) => {
      recordsByLocation.set(`${record.aisle}-${record.bay}-${record.level}`, record);
    });
    dataset.cycleCount = {
      campaign: importedCycleCount.campaign || dataset.cycleCount?.campaign || "Conteo importado",
      deadline: importedCycleCount.deadline || dataset.cycleCount?.deadline || "",
      workdaysPerWeek: importedCycleCount.workdaysPerWeek || dataset.cycleCount?.workdaysPerWeek || 5,
      records: [...recordsByLocation.values()].sort((left, right) => left.aisle - right.aisle || left.bay - right.bay || left.level - right.level),
    };
    CYCLE_COUNT_FIELDS.filter((field) => mapping[field] !== null).forEach((field) => appliedFields.add(field));
    updatedLocationCount = importedCycleCount.records.length;
    if (!updatedRowCount) updatedRowCount = updatedLocationCount;
  }

  if (!updatedRowCount) {
    const reason = unmatchedSkus.size
      ? `No encontramos los SKU del documento en el inventario actual. Ejemplos: ${[...unmatchedSkus].slice(0, 4).join(", ")}.`
      : "El documento no contenía valores aplicables al inventario actual.";
    return { dataset: null, items: [], errors: [reason], warnings: [], updatedSkuCount: 0, updatedLocationCount: 0, updatedRowCount: 0, appliedFields: [] };
  }
  const fields = [...appliedFields];
  const warnings: string[] = [];
  if (unmatchedSkus.size) warnings.push(`${unmatchedSkus.size} SKU del documento no existen en el inventario actual y se omitieron.`);
  if (ambiguousRows.length) warnings.push(`${ambiguousRows.length} filas tenían datos de lote, cantidad o picking sin una ubicación inequívoca; esos campos no se aplicaron.`);
  if (dataset.cycleCount && !dataset.cycleCount.deadline) warnings.push("Se actualizó el avance de conteo, pero falta la fecha final para calcular el objetivo diario.");
  const capabilities = dataset.capabilities ?? {
    product: true,
    family: true,
    unitCost: true,
    demand: true,
    location: true,
    completeLayout: dataset.layoutMode !== "source",
    hazardous: true,
    manufacturingDate: true,
    expiryDate: true,
    pendingPicking: true,
  };
  capabilities.product ||= fields.includes("product");
  capabilities.family ||= fields.includes("family");
  capabilities.unitCost ||= fields.includes("unitCost");
  capabilities.demand ||= fields.some((field) => ["demand", "salesM1", "salesM2", "salesM3"].includes(field));
  capabilities.location ||= fields.some((field) => ["location", "aisle", "bay", "level"].includes(field));
  capabilities.hazardous ||= fields.some((field) => ["hazardous", "zone"].includes(field));
  capabilities.manufacturingDate ||= fields.includes("manufacturing");
  capabilities.expiryDate ||= fields.includes("expiry");
  capabilities.pendingPicking ||= fields.includes("pending");
  dataset.capabilities = capabilities;
  dataset.warnings = [...new Set([...dataset.warnings, ...warnings])].slice(0, 20);
  dataset.dataSources = [...(dataset.dataSources ?? []), {
    name: source.name || "Documento complementario",
    format: source.format || "Documento",
    mode: "enrich",
    rows: updatedRowCount,
    mappedFields: fields.length,
    importedAt: new Date().toISOString(),
  }];
  return {
    dataset,
    items: inventoryFromWarehouse(dataset),
    errors: [],
    warnings,
    updatedSkuCount: updatedSkus.size,
    updatedLocationCount,
    updatedRowCount,
    appliedFields: fields,
  };
}
