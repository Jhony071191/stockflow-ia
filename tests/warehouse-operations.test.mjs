import assert from "node:assert/strict";
import test from "node:test";
import { readSheet } from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";

import { analyzeInventory } from "../lib/inventory.ts";
import {
  buildWarehouseLocations,
  calculateWarehouseMoves,
  createDemoWarehouseDataset,
  createWarehouseTemplateRows,
  inventoryFromWarehouse,
  parseWarehouseRows,
} from "../lib/warehouse.ts";
import { SAMPLE_INVENTORY } from "../lib/inventory.ts";

test("genera todas las ubicaciones, incluidas las vacías y la zona APQ", () => {
  const dataset = createDemoWarehouseDataset(SAMPLE_INVENTORY);
  const locations = buildWarehouseLocations(dataset);
  assert.equal(locations.length, 6 * 8 * 6);
  assert.ok(locations.some((location) => location.contents.length === 0));
  assert.ok(locations.some((location) => location.zone === "APQ"));
  assert.ok(locations.some((location) => location.pendingPicking > 0));
});

test("importa una fila por ubicación y agrega el stock por SKU", () => {
  const rows = [
    ["sku", "producto", "familia", "cantidad_ubicacion", "coste_unitario", "demanda_mensual", "pasillo", "modulo", "altura", "lote", "fecha_fabricacion", "fecha_vencimiento", "apq", "picking_pendiente", "total_pasillos", "modulos_por_pasillo", "alturas_almacen"],
    ["A-1", "Producto A", "Familia A", 40, 5, 20, 1, 1, 1, "L-1", "2026-01-01", "2027-01-01", "NO", 8, 3, 4, 5],
    ["A-1", "Producto A", "Familia A", 60, 5, 20, 1, 1, 4, "L-1", "2026-01-01", "2027-01-01", "NO", 0, "", "", ""],
    ["Q-1", "Producto APQ", "Química", 25, 9, 12, 3, 1, 1, "Q-7", "2026-02-01", "2028-02-01", "SI", 3, "", "", ""],
  ];
  const parsed = parseWarehouseRows(rows);
  assert.deepEqual(parsed.errors, []);
  assert.ok(parsed.dataset);
  assert.equal(parsed.dataset.config.levelCount, 5);
  assert.equal(parsed.items.find((item) => item.sku === "A-1")?.currentStock, 100);
  assert.ok(buildWarehouseLocations(parsed.dataset).some((location) => location.zone === "APQ"));
});

test("la plantilla Excel real puede generarse y volver a importarse", async () => {
  const buffer = await writeExcelFile(createWarehouseTemplateRows()).toBuffer();
  const rows = await readSheet(buffer);
  const parsed = parseWarehouseRows(rows);
  assert.deepEqual(parsed.errors, []);
  assert.ok(parsed.dataset);
  assert.equal(parsed.dataset.config.levelCount, 6);
  assert.equal(parsed.items.length, 3);
});

test("solo fusiona en altura cuando lote y ambas fechas coinciden", () => {
  const base = {
    sku: "OV-1",
    product: "Producto con sobrestock",
    family: "Familia A",
    unitCost: 10,
    leadTimeDays: 7,
    safetyStock: 5,
    salesM1: 10,
    salesM2: 10,
    salesM3: 10,
    batch: "LOTE-1",
    manufacturingDate: "2026-01-01",
    expiryDate: "2027-01-01",
    hazardous: false,
    pendingPicking: 0,
    capacity: 200,
    aisle: 1,
    bay: 1,
  };
  const dataset = {
    config: { aisleCount: 2, baysPerAisle: 3, levelCount: 5, defaultCapacity: 200, apqAisles: [] },
    aisleFamilies: { 1: "Familia A", 2: "Familia B" },
    locationOverrides: [],
    warnings: [],
    stocks: [
      { ...base, id: "floor", quantity: 80, level: 1 },
      { ...base, id: "height", quantity: 20, level: 4 },
    ],
  };
  const inventory = inventoryFromWarehouse(dataset);
  const moves = calculateWarehouseMoves(dataset, analyzeInventory(inventory).items);
  assert.ok(moves.some((move) => move.type === "consolidate" && move.to === "P01-M01-A04"));

  const incompatible = {
    ...dataset,
    stocks: dataset.stocks.map((stock) => stock.id === "height" ? { ...stock, manufacturingDate: "2026-02-01" } : stock),
  };
  const incompatibleMoves = calculateWarehouseMoves(incompatible, analyzeInventory(inventoryFromWarehouse(incompatible)).items);
  assert.equal(incompatibleMoves.some((move) => move.type === "consolidate"), false);
  assert.ok(incompatibleMoves.some((move) => move.type === "elevate"));
});

test("propone reponer desde altura hacia una ubicación de suelo", () => {
  const common = {
    sku: "RP-1",
    product: "Producto de alta rotación",
    family: "Familia R",
    unitCost: 4,
    leadTimeDays: 5,
    safetyStock: 10,
    salesM1: 100,
    salesM2: 100,
    salesM3: 100,
    batch: "RP-LOT",
    manufacturingDate: "2026-01-15",
    expiryDate: "2027-01-15",
    hazardous: false,
    capacity: 200,
    aisle: 1,
    bay: 1,
  };
  const dataset = {
    config: { aisleCount: 1, baysPerAisle: 2, levelCount: 5, defaultCapacity: 200, apqAisles: [] },
    aisleFamilies: { 1: "Familia R" },
    locationOverrides: [],
    warnings: [],
    stocks: [
      { ...common, id: "floor", quantity: 10, pendingPicking: 5, level: 1 },
      { ...common, id: "height", quantity: 50, pendingPicking: 0, level: 5 },
    ],
  };
  const moves = calculateWarehouseMoves(dataset, analyzeInventory(inventoryFromWarehouse(dataset)).items);
  assert.ok(moves.some((move) => move.type === "replenish" && move.from === "P01-M01-A05" && move.to === "P01-M01-A01"));
});
