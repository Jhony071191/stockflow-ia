import assert from "node:assert/strict";
import test from "node:test";

import {
  parseJsonBusinessDocument,
  parseTextBusinessDocument,
  rowsFromPdfTextItems,
} from "../lib/document-import.ts";
import { assessOperationalReadiness } from "../lib/readiness.ts";
import {
  analyzeUniversalWorkbook,
  enrichWarehouseDataset,
  translateUniversalDraft,
} from "../lib/universal-import.ts";

test("convierte un JSON empresarial anidado en una tabla traducible", () => {
  const sheets = parseJsonBusinessDocument(JSON.stringify({ exportacion: { inventario: [
    { codigo: "A-1", unidades: 15, demanda_mensual: 9 },
    { codigo: "B-2", unidades: 8, demanda_mensual: 4 },
  ] } }));
  assert.equal(sheets.length, 1);
  const draft = analyzeUniversalWorkbook(sheets);
  assert.notEqual(draft.mapping.sku, null);
  assert.notEqual(draft.mapping.quantity, null);
  assert.equal(translateUniversalDraft(draft).items.length, 2);
});

test("interpreta registros clave-valor procedentes de Word o texto", () => {
  const rows = parseTextBusinessDocument("SKU: A-1\nCantidad: 12\nFamilia: Bebidas\n\nSKU: B-2\nCantidad: 7\nFamilia: Limpieza");
  assert.deepEqual(rows[0], ["SKU", "Cantidad", "Familia"]);
  assert.equal(rows.length, 3);
});

test("reconstruye filas y columnas usando posiciones de texto PDF", () => {
  const rows = rowsFromPdfTextItems([
    { str: "SKU", width: 20, transform: [1, 0, 0, 1, 10, 100] },
    { str: "Cantidad", width: 40, transform: [1, 0, 0, 1, 130, 100] },
    { str: "A-1", width: 20, transform: [1, 0, 0, 1, 10, 80] },
    { str: "12", width: 12, transform: [1, 0, 0, 1, 130, 80] },
  ]);
  assert.deepEqual(rows, [["SKU", "Cantidad"], ["A-1", "12"]]);
});

test("complementa demanda y coste sin duplicar cantidades", () => {
  const baseDraft = analyzeUniversalWorkbook([{ name: "Stock", rows: [
    ["SKU", "Cantidad", "Ubicación"],
    ["A-1", 15, "P01-M01-A01"],
  ] }]);
  const base = translateUniversalDraft(baseDraft);
  assert.ok(base.dataset);
  const supplementDraft = analyzeUniversalWorkbook([{ name: "Demanda", rows: [
    ["Código", "Demanda mensual", "Coste unitario"],
    ["A-1", 30, 5.5],
  ] }]);
  const enriched = enrichWarehouseDataset(base.dataset, supplementDraft);
  assert.deepEqual(enriched.errors, []);
  assert.equal(enriched.updatedSkuCount, 1);
  assert.equal(enriched.items[0].currentStock, 15);
  assert.equal(enriched.items[0].salesM1, 30);
  assert.equal(enriched.items[0].unitCost, 5.5);
  assert.equal(enriched.dataset?.dataSources?.length, 1);
});

test("la preparación operativa aumenta cuando se complementan datos", () => {
  const draft = analyzeUniversalWorkbook([{ name: "Stock", rows: [["SKU", "Cantidad"], ["A-1", 15]] }]);
  const parsed = translateUniversalDraft(draft);
  assert.ok(parsed.dataset);
  const before = assessOperationalReadiness(parsed.dataset, parsed.items);
  const supplement = analyzeUniversalWorkbook([{ name: "Datos", rows: [["SKU", "Demanda mensual", "Coste unitario", "Familia"], ["A-1", 20, 4, "Bebidas"]] }]);
  const enriched = enrichWarehouseDataset(parsed.dataset, supplement);
  assert.ok(enriched.dataset);
  const after = assessOperationalReadiness(enriched.dataset, enriched.items);
  assert.ok(after.score > before.score);
});

test("la auditoría distingue cobertura parcial de datos completos", () => {
  const base = translateUniversalDraft(analyzeUniversalWorkbook([{ name: "Inventario", rows: [
    ["SKU", "Cantidad", "Ubicación"],
    ["A-1", 15, "P01-M01-A01"],
    ["A-2", 20, "P01-M02-A01"],
  ] }]));
  assert.ok(base.dataset);
  const supplement = analyzeUniversalWorkbook([{ name: "Costes", rows: [["SKU", "Coste unitario"], ["A-1", 4.5]] }]);
  const enriched = enrichWarehouseDataset(base.dataset, supplement);
  assert.ok(enriched.dataset);
  const readiness = assessOperationalReadiness(enriched.dataset, enriched.items);
  const cost = readiness.capabilities.find((capability) => capability.id === "cost");
  assert.equal(cost?.status, "partial");
  assert.equal(cost?.coverage, 50);
});

test("no marca como aplicado un coste numérico inválido", () => {
  const base = translateUniversalDraft(analyzeUniversalWorkbook([{ name: "Inventario", rows: [["SKU", "Cantidad"], ["A-1", 15]] }]));
  assert.ok(base.dataset);
  const supplement = analyzeUniversalWorkbook([{ name: "Costes", rows: [["SKU", "Coste unitario"], ["A-1", "desconocido"]] }]);
  const enriched = enrichWarehouseDataset(base.dataset, supplement);
  assert.ok(enriched.errors.length > 0);
  assert.equal(enriched.dataset, null);
});
