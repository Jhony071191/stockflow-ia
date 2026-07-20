import assert from "node:assert/strict";
import test from "node:test";
import { readSheet } from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";

import { analyzeInventory } from "../lib/inventory.ts";
import {
  buildWarehouseLocations,
  calculateExpiryRiskPlans,
  calculateWarehouseMoves,
  createDemoWarehouseDataset,
  createWarehouseTemplateRows,
  inventoryFromWarehouse,
  parseWarehouseCsv,
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
  const exactMove = moves.find((move) => move.type === "consolidate" && move.to === "P01-M01-A04");
  assert.ok(exactMove);
  assert.ok(exactMove.destinationScore > 0);
  assert.ok(exactMove.optimizationFactors.some((factor) => factor.includes("fusión exacta")));
  assert.ok(exactMove.alternatives.length > 0);

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

test("no propone un hueco vacío de una familia incompatible", () => {
  const stock = {
    id: "family-floor", sku: "FAM-1", product: "Producto familia A", family: "Familia A", quantity: 100,
    unitCost: 2, leadTimeDays: 5, safetyStock: 2, salesM1: 10, salesM2: 10, salesM3: 10,
    aisle: 1, bay: 1, level: 1, batch: "L-1", manufacturingDate: "2026-01-01", expiryDate: "2028-01-01",
    hazardous: false, pendingPicking: 0, capacity: 200,
  };
  const dataset = {
    config: { aisleCount: 1, baysPerAisle: 2, levelCount: 5, defaultCapacity: 200, apqAisles: [] },
    aisleFamilies: { 1: "Familia B" }, locationOverrides: [], warnings: [], stocks: [stock],
  };
  const moves = calculateWarehouseMoves(dataset, analyzeInventory(inventoryFromWarehouse(dataset)).items);
  assert.ok(moves.some((move) => move.type === "blocked"));
  assert.equal(moves.some((move) => move.type === "elevate"), false);
});

test("el importador CSV heredado respeta campos entrecomillados", () => {
  const parsed = parseWarehouseCsv('SKU,Producto,Cantidad,Coste unitario,Demanda mensual\nA-1,"Producto, especial",10,4,8');
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.items[0].product, "Producto, especial");
});

test("explica la ruta óptima y conserva ubicaciones alternativas", () => {
  const common = {
    sku: "ROUTE-1", product: "Producto con ruta", family: "Familia R", unitCost: 3,
    leadTimeDays: 5, safetyStock: 5, salesM1: 20, salesM2: 20, salesM3: 20,
    batch: "RT-1", manufacturingDate: "2026-01-01", expiryDate: "2027-01-01",
    hazardous: false, pendingPicking: 0, capacity: 200,
  };
  const dataset = {
    config: { aisleCount: 2, baysPerAisle: 3, levelCount: 5, defaultCapacity: 200, apqAisles: [] },
    aisleFamilies: { 1: "Familia R", 2: "Familia R" }, locationOverrides: [], warnings: [],
    stocks: [{ ...common, id: "route-floor", quantity: 100, aisle: 1, bay: 2, level: 1 }],
  };
  const moves = calculateWarehouseMoves(dataset, analyzeInventory(inventoryFromWarehouse(dataset)).items);
  const move = moves.find((candidate) => candidate.type === "elevate");
  assert.ok(move);
  assert.match(move.from, /^P01-M02-A01$/);
  assert.match(move.to, /^P01-M02-A0[2-5]$/);
  assert.ok(move.destinationScore >= 70);
  assert.ok(move.alternatives.some((alternative) => alternative.location !== move.to));
  assert.equal(move.projectedFloorAvailability, 20);
});

test("genera cinco vías seguras para rescatar un lote próximo a caducar", () => {
  const dataset = createDemoWarehouseDataset(SAMPLE_INVENTORY);
  const analysis = analyzeInventory(inventoryFromWarehouse(dataset));
  const plans = calculateExpiryRiskPlans(dataset, analysis.items, new Date("2026-07-20T12:00:00Z"));
  const coffee = plans.find((plan) => plan.sku === "SKU-2087");
  assert.ok(coffee);
  assert.equal(coffee.solutions.length, 5);
  assert.ok(coffee.quantityAtRisk > 0);
  assert.equal(coffee.recommendedSolution, "stores");
  const donation = coffee.solutions.find((solution) => solution.id === "donation");
  assert.equal(donation.enabled, true);
  assert.deepEqual(donation.partners.map((partner) => partner.name), [
    "FESBAL · Bancos de Alimentos",
    "Cáritas Española",
    "Cruz Roja Española",
  ]);
});

test("bloquea venta y donación cuando el lote ya está caducado", () => {
  const dataset = createDemoWarehouseDataset(SAMPLE_INVENTORY.slice(0, 1));
  dataset.stocks = dataset.stocks.map((stock) => ({ ...stock, expiryDate: "2026-07-01" }));
  const plans = calculateExpiryRiskPlans(dataset, analyzeInventory(inventoryFromWarehouse(dataset)).items, new Date("2026-07-20T12:00:00Z"));
  assert.equal(plans[0].recommendedSolution, "withdraw");
  assert.ok(plans[0].solutions.every((solution) => solution.enabled === false));
  assert.match(plans[0].solutions[0].blockedReason, /bloquear/i);
});
