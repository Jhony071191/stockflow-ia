import assert from "node:assert/strict";
import test from "node:test";

import {
  addSixMonths,
  calculateLocationCountProgress,
  calculateCountMetrics,
  countOperationalDays,
  createCountCampaigns,
  subtractOneMonth,
} from "../lib/cycle-counts.ts";
import { SAMPLE_INVENTORY, analyzeInventory } from "../lib/inventory.ts";

test("crea uno o dos conteos según el contrato del cliente", () => {
  const base = { clientName: "Cliente demo", year: 2026, firstDate: "2026-03-15", secondDate: "2026-09-15", graceCount: false, graceDate: "", tolerancePct: 2 };
  assert.equal(createCountCampaigns({ ...base, frequency: 1 }).length, 1);
  assert.equal(createCountCampaigns({ ...base, frequency: 2 }).length, 2);
});

test("añade un conteo de gracia sin alterar el servicio contratado", () => {
  const plan = { clientName: "Cliente demo", year: 2026, firstDate: "2026-03-15", secondDate: "2026-09-15", graceCount: true, graceDate: "2026-12-10", tolerancePct: 2, frequency: 1 };
  const campaigns = createCountCampaigns(plan);
  assert.equal(campaigns.length, 2);
  assert.equal(campaigns[1].label, "Conteo de gracia");
  assert.equal(campaigns[1].date, "2026-12-10");
});

test("propone el segundo conteo seis meses después", () => {
  assert.equal(addSixMonths("2026-04-30"), "2026-10-30");
});

test("calcula avance y diferencias fuera de tolerancia", () => {
  const items = analyzeInventory(SAMPLE_INVENTORY).items.slice(0, 2);
  const entries = {
    [items[0].sku]: String(items[0].currentStock),
    [items[1].sku]: String(items[1].currentStock + 10),
  };
  const metrics = calculateCountMetrics(items, entries, 2);
  assert.equal(metrics.counted, 2);
  assert.equal(metrics.pending, 0);
  assert.equal(metrics.exactMatches, 1);
  assert.equal(metrics.discrepancies, 1);
});

test("fija el objetivo un mes antes respetando el último día del mes", () => {
  assert.equal(subtractOneMonth("2026-03-31"), "2026-02-28");
  assert.equal(subtractOneMonth("2026-09-30"), "2026-08-30");
});

test("cuenta únicamente los días operativos configurados", () => {
  assert.equal(countOperationalDays("2026-07-19", "2026-08-30", 5), 30);
  assert.equal(countOperationalDays("2026-07-19", "2026-07-25", 6), 6);
  assert.equal(countOperationalDays("2026-07-19", "2026-07-25", 7), 7);
});

test("calcula porcentaje, pendientes y ritmo diario por ubicación", () => {
  const record = (index, status, zone = "RESERVA") => ({
    locationCode: `P01-M${String(index + 1).padStart(2, "0")}-A02`,
    aisle: 1,
    bay: index + 1,
    level: 2,
    zone,
    family: "Retail",
    status,
    physicalCount: status === "counted" ? 10 : null,
    countedAt: status === "counted" ? "2026-07-18" : "",
    systemQuantity: 10,
    pendingPicking: index === 30 ? 20 : 0,
    skus: [`SKU-${index + 1}`],
    products: [`Producto ${index + 1}`],
  });
  const records = [record(0, "counted"), ...Array.from({ length: 31 }, (_, index) => record(index + 1, "pending", index === 30 ? "APQ" : "RESERVA"))];
  const progress = calculateLocationCountProgress({ campaign: "Segundo conteo", deadline: "2026-09-30", workdaysPerWeek: 5, records }, "2026-07-19");

  assert.ok(progress);
  assert.equal(progress.total, 32);
  assert.equal(progress.counted, 1);
  assert.equal(progress.pending, 31);
  assert.equal(progress.targetDate, "2026-08-30");
  assert.equal(progress.remainingWorkdays, 30);
  assert.equal(progress.dailyTarget, 2);
  assert.equal(progress.pendingRecords[0].zone, "APQ");
});

test("no inventa una meta diaria cuando el Excel no trae fecha final", () => {
  const progress = calculateLocationCountProgress({
    campaign: "Conteo sin fecha",
    deadline: "",
    workdaysPerWeek: 5,
    records: [{ locationCode: "P01-M01-A01", aisle: 1, bay: 1, level: 1, zone: "SUELO", family: "Retail", status: "pending", physicalCount: null, countedAt: "", systemQuantity: 0, pendingPicking: 0, skus: [], products: [] }],
  }, "2026-07-19");

  assert.ok(progress);
  assert.equal(progress.status, "no-deadline");
  assert.equal(progress.dailyTarget, 0);
});
