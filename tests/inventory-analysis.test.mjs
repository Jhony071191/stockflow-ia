import assert from "node:assert/strict";
import test from "node:test";

import {
  SAMPLE_INVENTORY,
  analyzeInventory,
  createTemplateCsv,
  parseInventoryCsv,
  simulateInventory,
} from "../lib/inventory.ts";

test("analiza todas las referencias y genera las tres clases ABC", () => {
  const analysis = analyzeInventory(SAMPLE_INVENTORY);
  assert.equal(analysis.items.length, SAMPLE_INVENTORY.length);
  assert.deepEqual(new Set(analysis.items.map((item) => item.abcClass)), new Set(["A", "B", "C"]));
  assert.ok(analysis.summary.totalStockValue > 0);
  assert.ok(analysis.summary.riskCount > 0);
});

test("el simulador no reduce el riesgo cuando suben demanda y plazo", () => {
  const baseline = analyzeInventory(SAMPLE_INVENTORY);
  const projected = simulateInventory(SAMPLE_INVENTORY, 35, 14);
  assert.ok(projected.summary.riskCount >= baseline.summary.riskCount);
  assert.ok(projected.summary.totalSuggestedOrder >= baseline.summary.totalSuggestedOrder);
});

test("la plantilla CSV puede importarse sin errores", () => {
  const parsed = parseInventoryCsv(createTemplateCsv());
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.items.length, 6);
  assert.equal(parsed.items[0].sku, "SKU-1042");
});

test("el importador informa cuando faltan columnas obligatorias", () => {
  const parsed = parseInventoryCsv("sku;producto\nA-1;Producto incompleto");
  assert.equal(parsed.items.length, 0);
  assert.match(parsed.errors[0], /Faltan columnas obligatorias/);
});
