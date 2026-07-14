import assert from "node:assert/strict";
import test from "node:test";

import { buildWarehouseLocations } from "../lib/warehouse.ts";
import {
  analyzeUniversalWorkbook,
  reanalyzeUniversalDraft,
  translateUniversalDraft,
} from "../lib/universal-import.ts";

test("detecta encabezados desplazados y reconstruye una ubicación compuesta", () => {
  const rows = [
    ["Informe de gestión de almacén"],
    [],
    ["Generado para pruebas"],
    [],
    ["Item", "Batch", "Priority date", "Grade", "Hold code", "Quantity", "Prp / pick", "Current loc.", 9, 9, 9, 9, 9, "HD number", "Carton number"],
    ["ART-001", "LOT-7", "2027-05-20", "A", "", 25, 1, "STR", "0501", "P", "002", "60", "01", "HD-1", "C-1"],
    ["ART-002", "LOT-8", "2027-06-10", "A", "", 12, 0, "PIC", "0101", "P", "001", "10", "01", "HD-2", "C-2"],
  ];

  const draft = analyzeUniversalWorkbook([{ name: "Sheet0", rows }]);
  assert.equal(draft.headerRowIndex, 4);
  assert.equal(draft.mapping.sku, 0);
  assert.equal(draft.mapping.quantity, 5);
  assert.equal(draft.mapping.zone, 7);
  assert.equal(draft.mapping.locationStart, 7);
  assert.equal(draft.mapping.locationEnd, 12);

  const parsed = translateUniversalDraft(draft);
  assert.deepEqual(parsed.errors, []);
  assert.ok(parsed.dataset);
  assert.equal(parsed.dataset.layoutMode, "source");
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[0].product, parsed.items[0].sku);
  assert.equal(parsed.dataset.capabilities.demand, false);
  assert.equal(parsed.dataset.capabilities.pendingPicking, false);

  const locations = buildWarehouseLocations(parsed.dataset);
  assert.ok(locations.some((location) => location.code === "STR-0501-P-002-60-01" && location.level === 6));
  assert.ok(locations.some((location) => location.code === "PIC-0101-P-001-10-01" && location.zone === "PICKING"));
});

test("elige la hoja de inventario entre varias hojas", () => {
  const draft = analyzeUniversalWorkbook([
    { name: "Instrucciones", rows: [["Cómo utilizar el fichero"], ["No modificar este texto"]] },
    { name: "Warehouse Export", rows: [["Material", "On Hand", "Storage Bin"], ["MAT-1", 40, "A-01-02"]] },
  ]);

  assert.equal(draft.sheetName, "Warehouse Export");
  const parsed = translateUniversalDraft(draft);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.items[0].sku, "MAT-1");
  assert.equal(parsed.items[0].currentStock, 40);
});

test("importa de forma segura un fichero mínimo con solo SKU y cantidad", () => {
  const draft = analyzeUniversalWorkbook([
    { name: "Inventario", rows: [["Referencia", "Existencias"], ["REF-1", 9], ["REF-2", 15]] },
  ]);
  const parsed = translateUniversalDraft(draft);

  assert.deepEqual(parsed.errors, []);
  assert.ok(parsed.dataset);
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.dataset.capabilities.location, false);
  assert.equal(parsed.dataset.capabilities.family, false);
  assert.equal(parsed.dataset.capabilities.unitCost, false);
  assert.equal(parsed.dataset.capabilities.demand, false);
  assert.ok(parsed.warnings.some((warning) => warning.includes("no se calcularán sobrestock")));
});

test("genera el almacén completo cuando el Excel aporta pasillo, módulo y altura", () => {
  const rows = [
    ["SKU", "Producto", "Cantidad", "Pasillo", "Módulo", "Altura"],
    ["A-1", "Producto A", 30, 1, 1, 1],
    ["", "", "", 2, 1, 5],
  ];
  const draft = analyzeUniversalWorkbook([{ name: "Ubicaciones", rows }]);
  const parsed = translateUniversalDraft(draft);

  assert.deepEqual(parsed.errors, []);
  assert.ok(parsed.dataset);
  assert.equal(parsed.dataset.layoutMode, "structured");
  assert.equal(parsed.dataset.config.aisleCount, 2);
  assert.equal(parsed.dataset.config.levelCount, 5);
  const locations = buildWarehouseLocations(parsed.dataset);
  assert.equal(locations.length, 10);
  assert.ok(locations.some((location) => location.code === "P02-M01-A05" && location.contents.length === 0));
});

test("no convierte celdas vacías de demanda o coste en ceros conocidos", () => {
  const rows = [
    ["SKU", "Cantidad", "Demanda mensual", "Coste unitario"],
    ["CON-DATOS", 10, 5, 2],
    ["SIN-DATOS", 20, "", ""],
  ];
  const parsed = translateUniversalDraft(analyzeUniversalWorkbook([{ name: "Inventario", rows }]));

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.items.find((item) => item.sku === "CON-DATOS")?.dataQuality?.demandAvailable, true);
  assert.equal(parsed.items.find((item) => item.sku === "SIN-DATOS")?.dataQuality?.demandAvailable, false);
  assert.equal(parsed.items.find((item) => item.sku === "SIN-DATOS")?.dataQuality?.unitCostAvailable, false);
  assert.ok(parsed.warnings.some((warning) => warning.includes("1 SKU no incluyen demanda")));
});

test("permite corregir manualmente la hoja y la fila de encabezados", () => {
  const initial = analyzeUniversalWorkbook([
    { name: "Inventario", rows: [["SKU", "Cantidad"], ["AUTO-1", 7]] },
    { name: "Formato alternativo", rows: [["Título"], ["Metadatos"], ["Referencia", "Existencias"], ["MANUAL-1", 11]] },
  ]);
  const corrected = reanalyzeUniversalDraft(initial, "Formato alternativo", 2);
  const parsed = translateUniversalDraft(corrected);

  assert.equal(corrected.sheetName, "Formato alternativo");
  assert.equal(corrected.headerRowIndex, 2);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.items[0].sku, "MANUAL-1");
  assert.equal(parsed.items[0].currentStock, 11);
});
