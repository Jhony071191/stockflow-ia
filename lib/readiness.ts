import type { RawInventoryItem } from "./inventory";
import type { WarehouseDataset } from "./warehouse";

export type ReadinessCapability = {
  id: "inventory" | "locations" | "demand" | "cost" | "family" | "traceability" | "expiry" | "picking";
  label: string;
  available: boolean;
  status: "complete" | "partial" | "missing";
  coverage: number;
  weight: number;
  helper: string;
  nextStep: string;
};

export type OperationalReadiness = {
  score: number;
  level: "Datos físicos" | "Operativo" | "Avanzado" | "Control completo";
  activeModules: number;
  totalModules: number;
  capabilities: ReadinessCapability[];
  nextSteps: string[];
};

export function assessOperationalReadiness(dataset: WarehouseDataset, items: RawInventoryItem[]): OperationalReadiness {
  const capabilities = dataset.capabilities;
  const ratio = (known: number, total: number) => total ? Math.min(1, Math.max(0, known / total)) : 0;
  const itemCoverage = (field: "productAvailable" | "familyAvailable" | "unitCostAvailable" | "demandAvailable", datasetFlag?: boolean) => {
    const hasExplicitQuality = items.some((item) => item.dataQuality?.[field] !== undefined);
    if (!hasExplicitQuality) return datasetFlag ? 1 : 0;
    return ratio(items.filter((item) => item.dataQuality?.[field] === true).length, items.length);
  };
  const makeCheck = (
    value: Omit<ReadinessCapability, "available" | "status" | "coverage"> & { coverage: number },
  ): ReadinessCapability => {
    const coverage = Math.round(Math.min(1, Math.max(0, value.coverage)) * 100);
    return {
      ...value,
      coverage,
      available: coverage > 0,
      status: coverage >= 95 ? "complete" : coverage > 0 ? "partial" : "missing",
    };
  };
  const inventoryCoverage = items.length > 0 && dataset.stocks.length > 0 ? 1 : 0;
  const locationCoverage = capabilities?.location
    ? 1
    : ratio(dataset.stocks.filter((stock) => Boolean(stock.sourceLocationCode) || stock.aisle > 0).length, dataset.stocks.length);
  const demandCoverage = itemCoverage("demandAvailable", capabilities?.demand);
  const costCoverage = itemCoverage("unitCostAvailable", capabilities?.unitCost);
  const familyCoverage = itemCoverage("familyAvailable", capabilities?.family);
  const lotCoverage = ratio(dataset.stocks.filter((stock) => Boolean(stock.batch)).length, dataset.stocks.length);
  const expiryCoverage = ratio(dataset.stocks.filter((stock) => Boolean(stock.expiryDate)).length, dataset.stocks.length);
  // Un cero en picking es un valor válido; la capacidad confirma que la columna fue aportada.
  const pickingCoverage = capabilities?.pendingPicking ? 1 : 0;
  const checks: ReadinessCapability[] = [
    makeCheck({ id: "inventory", label: "SKU y cantidades", coverage: inventoryCoverage, weight: 20, helper: "Base física del inventario", nextStep: "Importa SKU y cantidades para crear el inventario base." }),
    makeCheck({ id: "locations", label: "Ubicaciones", coverage: locationCoverage, weight: 15, helper: "Mapa, ocupación y huecos", nextStep: "Añade ubicación o pasillo, módulo y altura." }),
    makeCheck({ id: "demand", label: "Demanda", coverage: demandCoverage, weight: 20, helper: "Cobertura, rotura y sobrestock", nextStep: "Completa ventas, consumo o demanda mensual para los SKU pendientes." }),
    makeCheck({ id: "cost", label: "Costes", coverage: costCoverage, weight: 10, helper: "ABC económico y valor inmovilizado", nextStep: "Completa el coste unitario de las referencias pendientes." }),
    makeCheck({ id: "family", label: "Familias", coverage: familyCoverage, weight: 10, helper: "Slotting y compatibilidad", nextStep: "Completa la familia o categoría de los productos pendientes." }),
    makeCheck({ id: "traceability", label: "Lotes", coverage: lotCoverage, weight: 10, helper: "Fusión segura y trazabilidad", nextStep: "Añade lote y, cuando exista, fechas de fabricación." }),
    makeCheck({ id: "expiry", label: "Vencimientos", coverage: expiryCoverage, weight: 5, helper: "FEFO y alerta de caducidad", nextStep: "Añade fecha de vencimiento para activar FEFO donde corresponda." }),
    makeCheck({ id: "picking", label: "Picking pendiente", coverage: pickingCoverage, weight: 10, helper: "Salidas próximas y reposición", nextStep: "Complementa unidades comprometidas en pedidos próximos." }),
  ];
  const score = Math.round(checks.reduce((sum, check) => sum + (check.weight * check.coverage / 100), 0));
  const level = score >= 90 ? "Control completo" : score >= 75 ? "Avanzado" : score >= 50 ? "Operativo" : "Datos físicos";
  const hasDemand = demandCoverage > 0;
  const hasCost = costCoverage > 0;
  const activeModules = 2 + Number(checks.find((check) => check.id === "locations")?.available) + (hasDemand ? 2 : 0) + Number(hasCost && hasDemand);
  return {
    score,
    level,
    activeModules,
    totalModules: 6,
    capabilities: checks,
    nextSteps: checks
      .filter((check) => check.status !== "complete")
      .sort((left, right) => (right.weight * (100 - right.coverage)) - (left.weight * (100 - left.coverage)))
      .slice(0, 3)
      .map((check) => check.nextStep),
  };
}
