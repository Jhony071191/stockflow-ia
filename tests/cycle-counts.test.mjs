import assert from "node:assert/strict";
import test from "node:test";

import {
  addSixMonths,
  calculateCountMetrics,
  createCountCampaigns,
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
