"use client";

import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Ban,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Combine,
  Database,
  Download,
  Euro,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  LayoutDashboard,
  ListChecks,
  LineChart,
  Layers3,
  MapPin,
  Menu,
  Package,
  PackageOpen,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Warehouse as WarehouseIcon,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  SAMPLE_INVENTORY,
  analyzeInventory,
  exportAnalysisCsv,
  simulateInventory,
  type AnalyzedInventoryItem,
  type InventoryAnalysis,
  type RawInventoryItem,
  type StockStatus,
} from "../lib/inventory";
import {
  buildWarehouseLocations,
  calculateWarehouseMoves,
  createDemoWarehouseDataset,
  createWarehouseTemplateRows,
  exportWarehouseCsv,
  warehouseSummary,
  type WarehouseDataset,
  type WarehouseLocation,
  type WarehouseMove,
} from "../lib/warehouse";
import {
  UNIVERSAL_EDITABLE_FIELDS,
  UNIVERSAL_FIELD_LABELS,
  analyzeUniversalWorkbook,
  enrichWarehouseDataset,
  reanalyzeUniversalDraft,
  translateUniversalDraft,
  type UniversalImportDraft,
  type UniversalMapping,
} from "../lib/universal-import";
import {
  extractBusinessDocument,
  type ExtractedBusinessDocument,
} from "../lib/document-import";
import { assessOperationalReadiness, type OperationalReadiness } from "../lib/readiness";
import {
  addSixMonths,
  calculateLocationCountProgress,
  calculateCountMetrics,
  createCountCampaigns,
  exportCountCsv,
  exportPendingLocationsCsv,
  type CycleCountPlan,
} from "../lib/cycle-counts";

type View = "resumen" | "inventario" | "almacen" | "acciones" | "simulador" | "conteos";
type ImportMode = "replace" | "enrich";

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "almacen", label: "Mapa de almacén", icon: WarehouseIcon },
  { id: "acciones", label: "Acciones", icon: Zap },
  { id: "simulador", label: "Simulador", icon: LineChart },
  { id: "conteos", label: "Conteos cíclicos", icon: ClipboardCheck },
];

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const SAMPLE_WAREHOUSE = createDemoWarehouseDataset(SAMPLE_INVENTORY);
const IMPORT_PROFILE_KEY = "stockflow-universal-import-profiles-v1";

const downloadTextFile = (filename: string, contents: string) => {
  const blob = new Blob([`\uFEFF${contents}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const coverageLabel = (coverage: number, demandAvailable = true) => !demandAvailable ? "No disponible" : coverage >= 999 ? "Sin consumo" : `${decimal.format(coverage)} días`;

function PriorityBadge({ status, label }: { status: StockStatus; label: string }) {
  return (
    <span className={`priority priority-${status}`}>
      <span aria-hidden="true" className="priority-dot" />
      {label}
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "teal" | "red" | "amber" | "blue";
  icon: LucideIcon;
}) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-heading">
        <span className="stat-icon" aria-hidden="true"><Icon size={24} strokeWidth={1.9} /></span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function ActionTable({
  items,
  limit,
  onSelect,
}: {
  items: AnalyzedInventoryItem[];
  limit?: number;
  onSelect: (item: AnalyzedInventoryItem) => void;
}) {
  const rows = typeof limit === "number" ? items.slice(0, limit) : items;

  return (
    <div className="table-scroll">
      <table className="action-table">
        <thead>
          <tr>
            <th>Prioridad</th>
            <th>Producto</th>
            <th>Situación</th>
            <th>Cobertura</th>
            <th>Acción recomendada</th>
            <th aria-label="Abrir detalle" />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.sku} onClick={() => onSelect(item)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onSelect(item)}>
              <td><PriorityBadge status={item.status} label={item.statusLabel} /></td>
              <td>
                <span className="sku-line">{item.sku} · {item.abcAvailable ? `Clase ${item.abcClass}` : "ABC pendiente"}</span>
                <span className="product-line">{item.product}</span>
              </td>
              <td className={`situation situation-${item.status}`}>{item.situation}</td>
              <td>{coverageLabel(item.coverageDays, item.demandAvailable)}</td>
              <td className="recommendation">{item.recommendation}</td>
              <td><ChevronRight size={18} aria-hidden="true" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard({
  analysis,
  readiness,
  warehouse,
  onAnalyze,
  onCompleteData,
  onExportExecutive,
  onViewAll,
  onSelect,
}: {
  analysis: InventoryAnalysis;
  readiness: OperationalReadiness;
  warehouse: WarehouseDataset;
  onAnalyze: () => void;
  onCompleteData: () => void;
  onExportExecutive: () => void;
  onViewAll: () => void;
  onSelect: (item: AnalyzedInventoryItem) => void;
}) {
  const { summary, items } = analysis;
  const costKnownCount = items.filter((item) => item.unitCostAvailable).length;
  const demandKnownCount = items.filter((item) => item.demandAvailable).length;
  const hasCost = costKnownCount > 0;
  const hasDemand = demandKnownCount > 0;
  const allCostsKnown = costKnownCount === items.length;
  const sourceCount = warehouse.dataSources?.length ?? (warehouse.importSummary ? 1 : 0);
  const displayedSourceCount = Math.max(1, sourceCount);
  return (
    <div className="view-enter">
      <header className="hero">
        <div>
          <p className="eyebrow">Centro de control</p>
          <h1>Decisiones de stock,<br />antes de que se conviertan en problemas</h1>
          <p className="hero-copy">Prioriza riesgos, evita roturas y transforma tu inventario en acciones claras.</p>
        </div>
        <button className="primary-button" data-testid="analyze-inventory" onClick={onAnalyze} type="button">
          <Upload size={20} aria-hidden="true" />
          Analizar inventario
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </header>

      <section className="stats-grid" aria-label="Indicadores principales">
        <StatCard label={allCostsKnown ? "Valor del inventario" : "Valor conocido"} value={hasCost ? currency.format(summary.totalStockValue) : "Pendiente"} helper={hasCost ? `${costKnownCount} de ${items.length} referencias con coste${allCostsKnown ? "" : " · total parcial"}` : "Añade el coste unitario para calcularlo"} tone="teal" icon={Euro} />
        <StatCard label="Riesgo de rotura" value={hasDemand ? `${summary.riskCount} SKU` : "Pendiente"} helper={hasDemand ? `${summary.actionTodayCount} clase A requieren acción` : "Añade demanda, consumo o pedidos"} tone="red" icon={CircleAlert} />
        <StatCard label="Sobrestock" value={hasDemand ? `${summary.overstockCount} SKU` : "Pendiente"} helper={hasDemand ? `${hasCost ? currency.format(summary.immobilizedValue) : "Valor pendiente"} inmovilizado` : "No se presume demanda igual a cero"} tone="amber" icon={Boxes} />
        <StatCard label="Cobertura media" value={hasDemand ? `${decimal.format(summary.averageCoverage)} días` : "Pendiente"} helper={hasDemand ? `${demandKnownCount} de ${items.length} referencias con demanda` : "Objetivo disponible al añadir consumo"} tone="blue" icon={CalendarDays} />
      </section>

      <section className="readiness-panel">
        <div className="readiness-score-card">
          <div className="readiness-gauge" style={{ "--readiness": `${readiness.score * 3.6}deg` } as CSSProperties}>
            <span><strong>{readiness.score}</strong><small>/100</small></span>
          </div>
          <div><p className="panel-kicker">Auditoría operativa inteligente</p><h2>{readiness.level}</h2><p>{readiness.activeModules} de {readiness.totalModules} módulos activos · {displayedSourceCount} fuente{displayedSourceCount === 1 ? "" : "s"} integrada{displayedSourceCount === 1 ? "" : "s"}</p></div>
        </div>
        <div className="readiness-body">
          <div className="readiness-capabilities">
            {readiness.capabilities.map((capability) => (
              <span className={capability.status} key={capability.id} title={`${capability.helper} · ${capability.coverage}% de cobertura`}>
                {capability.status === "complete" ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                {capability.label}{capability.status === "partial" ? ` · ${capability.coverage}%` : ""}
              </span>
            ))}
          </div>
          <div className="readiness-next">
            <strong>{readiness.nextSteps.length ? "Próximos datos que más valor aportan" : "Preparación completa"}</strong>
            {readiness.nextSteps.length ? <ul>{readiness.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul> : <p>Todos los motores principales pueden trabajar con datos verificados.</p>}
          </div>
          <div className="readiness-actions">
            <button className="secondary-button" onClick={onCompleteData} type="button"><PlusCircle size={17} /> Complementar datos</button>
            <button className="primary-button compact" onClick={onExportExecutive} type="button"><Download size={17} /> Informe Excel completo</button>
          </div>
        </div>
      </section>

      <section className="panel actions-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">Ordenado por impacto</span>
            <h2>Centro de acciones</h2>
          </div>
          <button className="text-button" onClick={onViewAll} type="button">Ver todas <ChevronRight size={18} aria-hidden="true" /></button>
        </div>
        <ActionTable items={items} limit={5} onSelect={onSelect} />
      </section>
    </div>
  );
}

function InventoryView({
  items,
  onUpload,
  onExport,
  onSelect,
}: {
  items: AnalyzedInventoryItem[];
  onUpload: () => void;
  onExport: () => void;
  onSelect: (item: AnalyzedInventoryItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [abcFilter, setAbcFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return items.filter((item) => {
      const matchesQuery = !normalized || `${item.sku} ${item.product} ${item.category}`.toLowerCase().includes(normalized);
      const matchesAbc = abcFilter === "all" || (item.abcAvailable && item.abcClass === abcFilter);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQuery && matchesAbc && matchesStatus;
    });
  }, [items, query, abcFilter, statusFilter]);

  const classSummary = (["A", "B", "C"] as const).map((abcClass) => ({
    abcClass,
    count: items.filter((item) => item.abcAvailable && item.abcClass === abcClass).length,
    value: items.filter((item) => item.abcAvailable && item.abcClass === abcClass).reduce((sum, item) => sum + item.consumptionValue, 0),
  }));
  const abcKnownCount = items.filter((item) => item.abcAvailable).length;

  return (
    <div className="view-enter section-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Datos operativos</p>
          <h1>Inventario</h1>
          <p>Consulta la clasificación ABC, cobertura, rotación y nivel de riesgo.</p>
        </div>
        <button className="primary-button compact" onClick={onUpload} type="button"><Upload size={18} /> Importar documentos</button>
      </div>

      {abcKnownCount ? <section className="abc-summary" aria-label="Resumen de clasificación ABC">
          {classSummary.map((item) => (
            <article key={item.abcClass}>
              <span className={`abc-badge abc-${item.abcClass.toLowerCase()}`}>{item.abcClass}</span>
              <div><strong>{item.count} SKU</strong><p>{currency.format(item.value)} de consumo mensual</p></div>
            </article>
          ))}
          <div className="abc-help"><Info size={18} /><span>ABC económico calculado con demanda y coste disponibles en {abcKnownCount} de {items.length} SKU.</span></div>
        </section> : <section className="inventory-data-notice"><CircleAlert size={19} /><div><strong>Clasificación ABC económica pendiente</strong><p>El stock físico está disponible. Añade coste y demanda para clasificar referencias por valor de consumo sin asumir datos que el Excel no contiene.</p></div></section>}

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar productos</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por SKU, producto o categoría" />
          </label>
          <div className="toolbar-actions">
            <label className="select-box"><span className="sr-only">Filtrar clase ABC</span><select value={abcFilter} onChange={(event) => setAbcFilter(event.target.value)}><option value="all">Todas las clases</option><option value="A">Clase A</option><option value="B">Clase B</option><option value="C">Clase C</option></select></label>
            <label className="select-box"><span className="sr-only">Filtrar estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option><option value="critical">Crítico</option><option value="attention">Atención</option><option value="stable">Estable</option></select></label>
            <button className="secondary-button" onClick={onExport} type="button"><Download size={17} /> Exportar</button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="inventory-table">
            <thead><tr><th>Clase</th><th>SKU / Producto</th><th>Categoría</th><th>Stock</th><th>Demanda/mes</th><th>Cobertura</th><th>Rotación</th><th>Estado</th></tr></thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.sku} onClick={() => onSelect(item)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onSelect(item)}>
                  <td>{item.abcAvailable ? <span className={`abc-badge abc-${item.abcClass.toLowerCase()}`}>{item.abcClass}</span> : <span className="abc-badge abc-na">—</span>}</td>
                  <td><span className="sku-line">{item.sku}</span><span className="product-line">{item.product}</span></td>
                  <td>{item.category}</td><td>{decimal.format(item.currentStock)}</td><td>{item.demandAvailable ? decimal.format(item.averageMonthlyDemand) : "—"}</td>
                  <td>{coverageLabel(item.coverageDays, item.demandAvailable)}</td><td>{item.demandAvailable ? `${decimal.format(item.rotationMonthly)}×` : "—"}</td>
                  <td><PriorityBadge status={item.status} label={item.statusLabel} /></td>
                </tr>
              ))}
              {!filteredRows.length && <tr><td colSpan={8}><div className="empty-state"><Search size={24} /><strong>No encontramos productos</strong><span>Prueba con otros filtros o términos de búsqueda.</span></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer">Mostrando {filteredRows.length} de {items.length} referencias</div>
      </section>
    </div>
  );
}

function WarehouseLocationDrawer({ location, pendingKnown, onClose }: { location: WarehouseLocation | null; pendingKnown: boolean; onClose: () => void }) {
  if (!location) return null;
  const unlocated = location.code.startsWith("SIN-UBICACION-");
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside aria-labelledby="location-detail-title" aria-modal="true" className="detail-drawer location-drawer" role="dialog">
        <button className="modal-close" aria-label="Cerrar detalle de ubicación" onClick={onClose} type="button"><X size={20} /></button>
        <p className="eyebrow">Ubicación logística</p>
        <h2 id="location-detail-title">{unlocated ? "Sin ubicación informada" : location.code}</h2>
        <div className="drawer-meta">
          {unlocated ? <span>El archivo no contiene una dirección para este registro</span> : location.sourceCode ? <span>Coordenada lógica {location.logicalCode}</span> : <><span>Pasillo {location.aisle}</span><span>Altura {location.level}</span></>}
          {!unlocated && <span className={`zone-chip ${location.zone.toLowerCase()}`}>{location.zone}</span>}
        </div>
        <section className="location-capacity-card">
          <div><span>Familia asignada</span><strong>{location.family}</strong></div>
          <div><span>Ocupación</span><strong>{decimal.format(location.quantity)} / {decimal.format(location.capacity)} ud.</strong></div>
          <div className="capacity-track"><span style={{ width: `${Math.min(100, (location.quantity / Math.max(1, location.capacity)) * 100)}%` }} /></div>
        </section>
        {!location.contents.length ? (
          <div className="location-empty-detail"><PackageOpen size={30} /><strong>Ubicación vacía</strong><p>Disponible para mercancía compatible con la familia y la zona.</p></div>
        ) : (
          <div className="location-content-list">
            {location.contents.map((stock) => (
              <article key={stock.id}>
                <div className="location-content-heading"><div><span>{stock.sku}</span><strong>{stock.product}</strong></div><b>{decimal.format(stock.quantity)} ud.</b></div>
                <dl>
                  <div><dt>Lote</dt><dd>{stock.batch || "No informado"}</dd></div>
                  <div><dt>Fabricación</dt><dd>{stock.manufacturingDate || "No informada"}</dd></div>
                  <div><dt>Vencimiento</dt><dd>{stock.expiryDate || "No informado"}</dd></div>
                  <div><dt>Picking próximo</dt><dd>{pendingKnown ? `${decimal.format(stock.pendingPicking)} ud.` : "No informado"}</dd></div>
                  {stock.qualityGrade && <div><dt>Grado</dt><dd>{stock.qualityGrade}</dd></div>}
                  {stock.holdCode && <div><dt>Bloqueo</dt><dd>{stock.holdCode}</dd></div>}
                </dl>
                {stock.hazardous && <p className="apq-notice"><ShieldAlert size={16} /> Mercancía APQ: mantener segregación y validar compatibilidad.</p>}
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

const movementMeta = (move: WarehouseMove) => {
  if (move.type === "replenish") return { label: "Reposición al suelo", icon: ArrowDown, tone: "teal" };
  if (move.type === "consolidate") return { label: "Fusión exacta", icon: Combine, tone: "blue" };
  if (move.type === "elevate") return { label: "Subir a altura", icon: ArrowUp, tone: "amber" };
  return { label: "Bloqueado", icon: Ban, tone: "red" };
};

function WarehouseView({
  dataset,
  analysis,
  onUpload,
  onExport,
}: {
  dataset: WarehouseDataset;
  analysis: InventoryAnalysis;
  onUpload: () => void;
  onExport: () => void;
}) {
  const locations = useMemo(() => buildWarehouseLocations(dataset), [dataset]);
  const moves = useMemo(() => calculateWarehouseMoves(dataset, analysis.items), [dataset, analysis.items]);
  const summary = useMemo(() => warehouseSummary(locations), [locations]);
  const [query, setQuery] = useState("");
  const [aisleFilter, setAisleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [sourcePage, setSourcePage] = useState(0);
  const sourceMode = dataset.layoutMode === "source";
  const capabilities = dataset.capabilities;
  const families = [...new Set(locations.map((location) => location.family))].sort();
  const normalizedQuery = query.trim().toLowerCase();
  const matchesLocation = (location: WarehouseLocation) => {
    const searchable = `${location.code} ${location.family} ${location.zone} ${location.contents.map((stock) => `${stock.sku} ${stock.product} ${stock.batch}`).join(" ")}`.toLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesFamily = familyFilter === "all" || location.family === familyFilter || location.contents.some((stock) => stock.family === familyFilter);
    const matchesStatus = statusFilter === "all"
      || (statusFilter === "empty" && !location.contents.length)
      || (statusFilter === "occupied" && location.contents.length > 0)
      || (statusFilter === "apq" && location.zone === "APQ")
      || (statusFilter === "picking" && location.pendingPicking > 0);
    return matchesQuery && matchesFamily && matchesStatus;
  };
  const visibleAisles = Array.from({ length: dataset.config.aisleCount }, (_, index) => index + 1).filter((aisle) => {
    if (aisleFilter !== "all" && Number(aisleFilter) !== aisle) return false;
    return locations.filter((location) => location.aisle === aisle).some(matchesLocation);
  });
  const sourceFiltered = locations.filter((location) => {
    if (aisleFilter !== "all" && location.aisle !== Number(aisleFilter)) return false;
    return matchesLocation(location);
  });
  const sourcePageSize = 120;
  const sourcePages = Math.max(1, Math.ceil(sourceFiltered.length / sourcePageSize));
  const safeSourcePage = Math.min(sourcePage, sourcePages - 1);
  const sourceVisible = sourceFiltered.slice(safeSourcePage * sourcePageSize, (safeSourcePage + 1) * sourcePageSize);

  return (
    <div className="view-enter section-view warehouse-view">
      <div className="section-heading warehouse-heading">
        <div>
          <p className="eyebrow">Gemelo operativo del almacén</p>
          <h1>Mapa de ubicaciones</h1>
          <p>{sourceMode ? "Consulta las ubicaciones originales traducidas desde el sistema de la empresa." : "Visualiza pasillos, alturas, familias, lotes, zona APQ y salidas de picking."}</p>
        </div>
        <div className="warehouse-heading-actions">
          <button className="secondary-button" onClick={onExport} type="button"><Download size={17} /> Exportar mapa</button>
          <button className="primary-button compact" onClick={onUpload} type="button"><Upload size={18} /> Importar documentos</button>
        </div>
      </div>

      <section className="warehouse-stats" aria-label="Resumen de ubicaciones">
        <article><span className="warehouse-stat-icon blue"><MapPin size={20} /></span><div><small>Ubicaciones</small><strong>{summary.total}</strong><p>{sourceMode ? "confirmadas por el archivo" : `${dataset.config.aisleCount} pasillos · ${dataset.config.levelCount} alturas`}</p></div></article>
        <article><span className="warehouse-stat-icon teal"><Boxes size={20} /></span><div><small>Ocupadas</small><strong>{summary.occupied}</strong><p>{decimal.format((summary.occupied / Math.max(1, summary.total)) * 100)} % de ocupación</p></div></article>
        <article><span className="warehouse-stat-icon green"><PackageOpen size={20} /></span><div><small>Vacías</small><strong>{sourceMode && !capabilities?.completeLayout && summary.empty === 0 ? "—" : summary.empty}</strong><p>{sourceMode && !capabilities?.completeLayout ? (summary.empty ? "vacías confirmadas; el maestro puede estar incompleto" : "requiere maestro de huecos") : "huecos disponibles"}</p></div></article>
        <article><span className="warehouse-stat-icon amber"><ListChecks size={20} /></span><div><small>Picking próximo</small><strong>{capabilities?.pendingPicking === false ? "—" : `${decimal.format(summary.pendingPicking)} ud.`}</strong><p>{capabilities?.pendingPicking === false ? "no incluido en el archivo" : "reservadas para pedidos"}</p></div></article>
        <article><span className="warehouse-stat-icon red"><ShieldAlert size={20} /></span><div><small>Zona APQ</small><strong>{capabilities?.hazardous === false ? "—" : summary.apq}</strong><p>{capabilities?.hazardous === false ? "no indicado en el archivo" : "ubicaciones segregadas"}</p></div></article>
      </section>

      <section className="warehouse-rule-banner">
        <Layers3 size={22} />
        {capabilities?.demand === false
          ? <div><strong>Datos físicos traducidos · recomendaciones en espera</strong><p>Las ubicaciones y cantidades ya pueden consultarse. StockFlow no calculará sobrestock ni aprovisionamiento hasta recibir demanda, consumo o pedidos reales.</p></div>
          : capabilities?.completeLayout === false
            ? <div><strong>Ubicaciones de origen preservadas</strong><p>El archivo no contiene un maestro completo de huecos. Se muestran las ubicaciones confirmadas sin inventar espacios vacíos ni destinos de movimiento.</p></div>
            : <div><strong>Regla de almacenamiento activa</strong><p>Se deja un mes de demanda disponible en suelo después del picking. El sobrante sube a altura y solo se fusiona si coinciden exactamente SKU, lote, fabricación y vencimiento.</p></div>}
      </section>

      {dataset.importSummary && capabilities && (
        <section className="translation-panel">
          <div className="translation-heading"><span><Sparkles size={19} /></span><div><strong>Traducción empresarial aplicada</strong><p>Hoja «{dataset.importSummary.sheetName}» · encabezados en fila {dataset.importSummary.headerRow} · {dataset.importSummary.dataRows} registros procesados</p></div></div>
          <div className="translation-capabilities">
            <span className="available"><CheckCircle2 size={14} /> SKU y cantidades</span>
            <span className={capabilities.location ? "available" : "missing"}>{capabilities.location ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} Ubicaciones</span>
            <span className={capabilities.demand ? "available" : "missing"}>{capabilities.demand ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} Demanda</span>
            <span className={capabilities.unitCost ? "available" : "missing"}>{capabilities.unitCost ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} Costes</span>
            <span className={capabilities.family ? "available" : "missing"}>{capabilities.family ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} Familias</span>
            <span className={capabilities.hazardous ? "available" : "missing"}>{capabilities.hazardous ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} APQ</span>
            <span className={capabilities.pendingPicking ? "available" : "missing"}>{capabilities.pendingPicking ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} Pedidos pendientes</span>
          </div>
        </section>
      )}

      {!!dataset.warnings.length && (
        <section className="warehouse-warning-list"><CircleAlert size={19} /><div><strong>Observaciones de la importación</strong>{dataset.warnings.slice(0, 4).map((warning) => <p key={warning}>{warning}</p>)}</div></section>
      )}

      <section className="panel warehouse-map-panel">
        <div className="warehouse-toolbar">
          <label className="search-box warehouse-search"><Search size={18} /><span className="sr-only">Buscar ubicación, SKU o lote</span><input value={query} onChange={(event) => { setQuery(event.target.value); setSourcePage(0); }} placeholder="Buscar ubicación, SKU, producto o lote" /></label>
          {!sourceMode && <label className="select-box"><span className="sr-only">Filtrar pasillo</span><select value={aisleFilter} onChange={(event) => { setAisleFilter(event.target.value); setSourcePage(0); }}><option value="all">Todos los pasillos</option>{Array.from({ length: dataset.config.aisleCount }, (_, index) => <option key={index + 1} value={index + 1}>Pasillo {index + 1}</option>)}</select></label>}
          <label className="select-box"><span className="sr-only">Filtrar familia</span><select value={familyFilter} onChange={(event) => { setFamilyFilter(event.target.value); setSourcePage(0); }}><option value="all">Todas las familias</option>{families.map((family) => <option key={family} value={family}>{family}</option>)}</select></label>
          <label className="select-box"><span className="sr-only">Filtrar ocupación</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setSourcePage(0); }}><option value="all">Todas</option><option value="occupied">Ocupadas</option>{(!sourceMode || summary.empty > 0) && <option value="empty">Vacías confirmadas</option>}<option value="picking">Con picking</option><option value="apq">Solo APQ</option></select></label>
        </div>
        {sourceMode ? (
          <>
            <div className="warehouse-legend source-legend"><span><i className="legend-dot occupied" /> Ubicación confirmada</span><span><i className="legend-dot picking" /> Picking pendiente</span><span><i className="legend-dot apq" /> APQ</span><small>Se conserva exactamente el código del sistema de origen.</small></div>
            <div className="table-scroll source-location-scroll">
              <table className="source-location-table">
                <thead><tr><th>Ubicación original</th><th>Zona</th><th>SKU / Producto</th><th>Cantidad</th><th>Lote / Vencimiento</th><th>Calidad</th><th>Picking próximo</th></tr></thead>
                <tbody>
                  {sourceVisible.map((location) => (
                    <tr key={location.code} onClick={() => setSelectedLocation(location)} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setSelectedLocation(location)}>
                      <td><code className="source-location-code">{location.sourceCode || "Sin ubicación informada"}</code><small>{location.logicalCode ? `Coordenada interna ${location.logicalCode}` : ""}</small></td>
                      <td>{location.sourceCode ? <span className={`zone-chip ${location.zone.toLowerCase()}`}>{location.zone}</span> : <span className="data-missing">No informada</span>}</td>
                      <td><div className="source-stock-stack">{location.contents.slice(0, 3).map((stock) => <span key={stock.id}><strong>{stock.sku}</strong><small>{stock.product}</small></span>)}{location.contents.length > 3 && <em>+{location.contents.length - 3} registros</em>}</div></td>
                      <td><strong>{decimal.format(location.quantity)} ud.</strong></td>
                      <td><div className="source-lot-stack">{location.contents.slice(0, 3).map((stock) => <span key={stock.id}>{stock.batch || "Sin lote"}<small>{stock.expiryDate || "Vencimiento no informado"}</small></span>)}</div></td>
                      <td><div className="source-quality-stack">{location.contents.some((stock) => stock.qualityGrade || stock.holdCode) ? location.contents.slice(0, 3).map((stock) => <span key={stock.id}>{stock.qualityGrade || "—"}{stock.holdCode ? ` · ${stock.holdCode}` : ""}</span>) : <span>—</span>}</div></td>
                      <td>{capabilities?.pendingPicking === false ? <span className="data-missing">No informado</span> : location.pendingPicking > 0 ? <span className="pending-pill"><ListChecks size={13} /> {decimal.format(location.pendingPicking)} ud.</span> : <span>0 ud.</span>}</td>
                    </tr>
                  ))}
                  {!sourceVisible.length && <tr><td colSpan={7}><div className="empty-state warehouse-empty"><Search size={24} /><strong>No hay ubicaciones que coincidan</strong><span>Cambia los filtros o el término de búsqueda.</span></div></td></tr>}
                </tbody>
              </table>
            </div>
            {!!sourceFiltered.length && <div className="source-pagination"><span>Mostrando {safeSourcePage * sourcePageSize + 1}–{Math.min((safeSourcePage + 1) * sourcePageSize, sourceFiltered.length)} de {sourceFiltered.length} ubicaciones</span><div><button disabled={safeSourcePage === 0} onClick={() => setSourcePage(Math.max(0, safeSourcePage - 1))} type="button">Anterior</button><strong>{safeSourcePage + 1} / {sourcePages}</strong><button disabled={safeSourcePage >= sourcePages - 1} onClick={() => setSourcePage(Math.min(sourcePages - 1, safeSourcePage + 1))} type="button">Siguiente</button></div></div>}
          </>
        ) : (
          <>
            <div className="warehouse-legend"><span><i className="legend-dot empty" /> Vacía</span><span><i className="legend-dot occupied" /> Ocupada</span><span><i className="legend-dot picking" /> Picking pendiente</span><span><i className="legend-dot apq" /> APQ</span></div>
            <div className="aisle-stack">
              {visibleAisles.map((aisle) => {
                const aisleLocations = locations.filter((location) => location.aisle === aisle);
                const aisleFamily = dataset.aisleFamilies[aisle] || (dataset.config.apqAisles.includes(aisle) ? "APQ" : "Sin asignar");
                return (
                  <article className={`aisle-card ${dataset.config.apqAisles.includes(aisle) ? "aisle-apq" : ""}`} key={aisle}>
                    <div className="aisle-heading"><div><span>Pasillo {String(aisle).padStart(2, "0")}</span><strong>{aisleFamily}</strong></div><small>{aisleLocations.filter((location) => location.contents.length).length}/{aisleLocations.length} ocupadas</small></div>
                    <div className="rack-scroll">
                      <div className="rack-grid" style={{ gridTemplateColumns: `72px repeat(${dataset.config.baysPerAisle}, minmax(126px, 1fr))` }}>
                        <div className="rack-corner">Altura</div>
                        {Array.from({ length: dataset.config.baysPerAisle }, (_, index) => <div className="rack-bay-label" key={`bay-${index + 1}`}>Módulo {String(index + 1).padStart(2, "0")}</div>)}
                        {Array.from({ length: dataset.config.levelCount }, (_, index) => dataset.config.levelCount - index).flatMap((level) => [
                          <div className="rack-level-label" key={`level-${level}`}>{level === 1 ? "Suelo" : `A${level}`}</div>,
                          ...Array.from({ length: dataset.config.baysPerAisle }, (_, bayIndex) => {
                            const location = aisleLocations.find((item) => item.level === level && item.bay === bayIndex + 1) as WarehouseLocation;
                            const matched = matchesLocation(location);
                            const first = location.contents[0];
                            return (
                              <button
                                className={`location-slot ${location.contents.length ? "occupied" : "empty"} ${location.zone === "APQ" ? "apq" : ""} ${location.pendingPicking ? "has-picking" : ""} ${matched ? "" : "filtered"}`}
                                key={location.code}
                                onClick={() => setSelectedLocation(location)}
                                type="button"
                              >
                                <span className="location-code">{location.code}</span>
                                {first ? <><strong>{first.sku}</strong><span>{decimal.format(location.quantity)} ud. · Lote {first.batch || "—"}</span>{location.pendingPicking > 0 && <b><ListChecks size={12} /> Salen {decimal.format(location.pendingPicking)}</b>}</> : <><PackageOpen size={17} /><span>Libre</span></>}
                              </button>
                            );
                          }),
                        ])}
                      </div>
                    </div>
                  </article>
                );
              })}
              {!visibleAisles.length && <div className="empty-state warehouse-empty"><Search size={24} /><strong>No hay ubicaciones que coincidan</strong><span>Cambia los filtros o el término de búsqueda.</span></div>}
            </div>
          </>
        )}
      </section>

      <section className="panel movement-panel">
        <div className="panel-heading"><div><span className="panel-kicker">Plan logístico explicable</span><h2>Movimientos recomendados</h2></div><span className="movement-count">{moves.length} acciones</span></div>
        <div className="table-scroll">
          <table className="movement-table">
            <thead><tr><th>Movimiento</th><th>SKU / Producto</th><th>Cantidad</th><th>Origen</th><th>Destino</th><th>Motivo y control de lote</th></tr></thead>
            <tbody>
              {moves.map((move) => {
                const meta = movementMeta(move);
                const Icon = meta.icon;
                return <tr key={move.id}><td><span className={`movement-type ${meta.tone}`}><Icon size={16} />{meta.label}</span></td><td><span className="sku-line">{move.sku}</span><span className="product-line">{move.product}</span></td><td><strong>{decimal.format(move.quantity)} ud.</strong></td><td><code>{move.from}</code></td><td>{move.to ? <code>{move.to}</code> : <span className="no-target">Sin hueco</span>}</td><td><strong>{move.title}</strong><p>{move.reason}</p><small>{move.lotRule}</small></td></tr>;
              })}
              {!moves.length && <tr><td colSpan={6}><div className="empty-state">{capabilities?.demand === false || capabilities?.completeLayout === false ? <CircleAlert size={24} /> : <CheckCircle2 size={24} />}<strong>{capabilities?.demand === false ? "Recomendaciones pausadas" : capabilities?.completeLayout === false ? "Falta el maestro completo de ubicaciones" : "Distribución equilibrada"}</strong><span>{capabilities?.demand === false ? "Añade demanda, consumo mensual o pedidos para calcular sobrestock y reposición." : capabilities?.completeLayout === false ? "Carga también los huecos vacíos y capacidades para proponer destinos reales." : "No se requieren movimientos de altura o reposición."}</span></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <WarehouseLocationDrawer location={selectedLocation} pendingKnown={capabilities?.pendingPicking !== false} onClose={() => setSelectedLocation(null)} />
    </div>
  );
}

function ActionsView({
  items,
  onExport,
  onSelect,
}: {
  items: AnalyzedInventoryItem[];
  onExport: () => void;
  onSelect: (item: AnalyzedInventoryItem) => void;
}) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? items : items.filter((item) => item.status === filter);
  const classACritical = items.filter((item) => item.status === "critical" && item.abcAvailable && item.abcClass === "A").length;
  const hasDemand = items.some((item) => item.demandAvailable);

  return (
    <div className="view-enter section-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Plan priorizado</p>
          <h1>Acciones recomendadas</h1>
          <p>Actúa primero sobre los productos con mayor impacto operativo.</p>
        </div>
        <button className="secondary-button" onClick={onExport} type="button"><Download size={17} /> Descargar plan</button>
      </div>
      <section className="insight-banner">
        <span className="insight-icon"><Sparkles size={22} /></span>
        <div><strong>{hasDemand ? `${classACritical} decisiones clase A requieren atención inmediata` : "Priorización de roturas y sobrestock pendiente"}</strong><p>{hasDemand ? "La prioridad combina cobertura, plazo de entrega, valor de consumo y stock de seguridad." : "Las cantidades físicas ya están disponibles; añade demanda para activar las recomendaciones operativas."}</p></div>
      </section>
      <section className="panel">
        <div className="panel-filter-row">
          <div className="segmented-control" aria-label="Filtrar prioridades">
            {[{ id: "all", label: "Todas" }, { id: "critical", label: "Críticas" }, { id: "attention", label: "Atención" }, { id: "stable", label: "Estables" }].map((option) => (
              <button key={option.id} className={filter === option.id ? "selected" : ""} onClick={() => setFilter(option.id)} type="button">{option.label}</button>
            ))}
          </div>
          <span>{filtered.length} acciones</span>
        </div>
        <ActionTable items={filtered} onSelect={onSelect} />
      </section>
      <section className="method-grid">
        <article><span>1</span><div><strong>Detecta</strong><p>Compara existencias, demanda y plazo de entrega.</p></div></article>
        <article><span>2</span><div><strong>Prioriza</strong><p>Pondera el riesgo según la importancia ABC.</p></div></article>
        <article><span>3</span><div><strong>Explica</strong><p>Convierte cada alerta en una decisión concreta.</p></div></article>
      </section>
    </div>
  );
}

function ComparisonCard({ label, baseline, projected, tone = "neutral" }: { label: string; baseline: string; projected: string; tone?: "neutral" | "danger" | "warning" }) {
  return (
    <article className={`comparison-card comparison-${tone}`}>
      <span>{label}</span>
      <div><small>Actual</small><strong>{baseline}</strong></div>
      <ArrowRight size={17} aria-hidden="true" />
      <div><small>Escenario</small><strong>{projected}</strong></div>
    </article>
  );
}

function SimulatorView({
  inventory,
  baseline,
  onSelect,
}: {
  inventory: RawInventoryItem[];
  baseline: InventoryAnalysis;
  onSelect: (item: AnalyzedInventoryItem) => void;
}) {
  const [demand, setDemand] = useState(18);
  const [delay, setDelay] = useState(7);
  const hasDemand = baseline.items.some((item) => item.demandAvailable);
  const projected = useMemo(() => simulateInventory(inventory, demand, delay), [inventory, demand, delay]);
  const impactItems = projected.items.filter((item) => item.status !== "stable").slice(0, 6);
  const signedDemand = `${demand > 0 ? "+" : ""}${demand} %`;

  if (!hasDemand) {
    return (
      <div className="view-enter section-view">
        <div className="section-heading simulator-heading"><div><p className="eyebrow">Escenarios operativos</p><h1>Simulador</h1><p>Anticípate a cambios de demanda y retrasos de proveedores.</p></div></div>
        <section className="panel simulator-unavailable"><CircleAlert size={30} /><strong>El simulador necesita demanda real</strong><p>Importa consumo mensual, ventas históricas o pedidos previstos. StockFlow no convertirá la ausencia de esa información en una demanda de cero.</p></section>
      </div>
    );
  }

  return (
    <div className="view-enter section-view">
      <div className="section-heading simulator-heading">
        <div><p className="eyebrow">Escenarios operativos</p><h1>Simulador</h1><p>Anticípate a cambios de demanda y retrasos de proveedores.</p></div>
        <button className="secondary-button" onClick={() => { setDemand(0); setDelay(0); }} type="button"><RotateCcw size={17} /> Restablecer</button>
      </div>
      <div className="simulator-grid">
        <section className="panel control-card">
          <div className="control-title"><SlidersHorizontal size={20} /><strong>Variables del escenario</strong></div>
          <div className="slider-label"><span>Variación de demanda</span><strong>{signedDemand}</strong></div>
          <input aria-label="Variación de demanda" type="range" min="-20" max="50" value={demand} onChange={(event) => setDemand(Number(event.target.value))} />
          <div className="range-ends"><span>−20 %</span><span>+50 %</span></div>
          <div className="slider-label"><span>Retraso adicional del proveedor</span><strong>+{delay} días</strong></div>
          <input aria-label="Retraso adicional del proveedor" type="range" min="0" max="30" value={delay} onChange={(event) => setDelay(Number(event.target.value))} />
          <div className="range-ends"><span>0 días</span><span>30 días</span></div>
          <p className="control-note"><Info size={16} /> El cálculo se aplica a todas las referencias sin modificar los datos originales.</p>
        </section>
        <section className="scenario-stack">
          <ComparisonCard label="SKU en riesgo" baseline={String(baseline.summary.riskCount)} projected={String(projected.summary.riskCount)} tone="danger" />
          <ComparisonCard label="Unidades sugeridas" baseline={decimal.format(baseline.summary.totalSuggestedOrder)} projected={decimal.format(projected.summary.totalSuggestedOrder)} tone="warning" />
          <ComparisonCard label="Inversión de reposición" baseline={currency.format(baseline.summary.suggestedOrderCost)} projected={currency.format(projected.summary.suggestedOrderCost)} />
        </section>
      </div>
      <section className="panel scenario-impact">
        <div className="panel-heading"><div><span className="panel-kicker">Impacto proyectado</span><h2>Productos que requieren revisión</h2></div><span className="scenario-chip"><TrendingUp size={16} /> Demanda {signedDemand}</span></div>
        <ActionTable items={impactItems} onSelect={onSelect} />
      </section>
    </div>
  );
}

function CyclicCountsView({
  items,
  warehouse,
  plan,
  entries,
  activeCampaignId,
  completedCampaigns,
  onPlanChange,
  onEntryChange,
  onCampaignChange,
  onFillSample,
  onReset,
  onComplete,
  onNotify,
}: {
  items: AnalyzedInventoryItem[];
  warehouse: WarehouseDataset;
  plan: CycleCountPlan;
  entries: Record<string, string>;
  activeCampaignId: string;
  completedCampaigns: string[];
  onPlanChange: (plan: CycleCountPlan) => void;
  onEntryChange: (sku: string, value: string) => void;
  onCampaignChange: (campaignId: string) => void;
  onFillSample: () => void;
  onReset: () => void;
  onComplete: (campaignId: string) => void;
  onNotify: (message: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "discrepancies">("all");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationZone, setLocationZone] = useState("all");
  const campaigns = createCountCampaigns(plan);
  const campaign = campaigns.find((item) => item.id === activeCampaignId) ?? campaigns[0];
  const orderedItems = useMemo(() => {
    const abcOrder = { A: 0, B: 1, C: 2 };
    return [...items].sort((a, b) => (a.abcAvailable ? abcOrder[a.abcClass] : 3) - (b.abcAvailable ? abcOrder[b.abcClass] : 3) || b.priorityScore - a.priorityScore);
  }, [items]);
  const metrics = useMemo(
    () => calculateCountMetrics(orderedItems, entries, plan.tolerancePct),
    [orderedItems, entries, plan.tolerancePct],
  );
  const locationProgress = useMemo(
    () => calculateLocationCountProgress(warehouse.cycleCount),
    [warehouse.cycleCount],
  );
  const filteredPendingLocations = useMemo(() => {
    if (!locationProgress) return [];
    const query = locationQuery.trim().toLowerCase();
    return locationProgress.pendingRecords.filter((record) => {
      const matchesZone = locationZone === "all" || record.zone === locationZone;
      const haystack = [record.locationCode, record.sourceLocationCode, record.family, ...record.skus, ...record.products].join(" ").toLowerCase();
      return matchesZone && (!query || haystack.includes(query));
    });
  }, [locationProgress, locationQuery, locationZone]);
  const filteredRows = metrics.rows.filter((row) => {
    if (filter === "pending") return row.physicalCount === null;
    if (filter === "discrepancies") return row.hasDiscrepancy;
    return true;
  });
  const isCompleted = completedCampaigns.includes(campaign.id);
  const costKnownCount = items.filter((item) => item.unitCostAvailable).length;
  const formatDate = (date: string) => date
    ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`))
    : "Sin fecha";

  const updateFrequency = (frequency: 1 | 2) => {
    const nextPlan = {
      ...plan,
      frequency,
      secondDate: frequency === 2 ? plan.secondDate || addSixMonths(plan.firstDate) : plan.secondDate,
    };
    onPlanChange(nextPlan);
    onCampaignChange(`${nextPlan.year}-1`);
  };

  const updateFirstDate = (firstDate: string) => {
    onPlanChange({
      ...plan,
      firstDate,
      secondDate: plan.frequency === 2 ? addSixMonths(firstDate) : plan.secondDate,
    });
  };

  const exportAct = () => {
    downloadTextFile(
      `stockflow_conteo_${campaign.id}.csv`,
      exportCountCsv(plan, campaign, metrics),
    );
    onNotify("Acta de conteo preparada");
  };

  return (
    <div className="view-enter section-view count-view">
      <div className="section-heading count-heading">
        <div>
          <p className="eyebrow">Control físico planificado</p>
          <h1>Conteos cíclicos</h1>
          <p>Programa uno o dos conteos anuales por cliente y documenta cada diferencia.</p>
        </div>
        <button className="secondary-button" onClick={exportAct} type="button"><Download size={17} /> Exportar acta</button>
      </div>

      {locationProgress ? (
        <section className="panel location-count-panel">
          <div className="panel-heading location-count-heading">
            <div><span className="panel-kicker">Avance importado por ubicación</span><h2>{locationProgress.campaign}</h2></div>
            <span className={`location-progress-status ${locationProgress.status}`}>
              {locationProgress.status === "complete" ? "Completado" : locationProgress.status === "on-track" ? "A tiempo" : locationProgress.status === "urgent" ? "Ritmo urgente" : locationProgress.status === "overdue" ? "Objetivo vencido" : "Falta fecha final"}
            </span>
          </div>
          <div className="location-count-overview">
            <article className="location-progress-card">
              <div className="location-progress-value"><strong>{decimal.format(locationProgress.progressPct)}%</strong><span>del almacén contado</span></div>
              <div className="location-progress-track"><span style={{ width: `${Math.min(100, locationProgress.progressPct)}%` }} /></div>
              <p>{locationProgress.counted} de {locationProgress.total} ubicaciones elegibles · {locationProgress.excluded} excluidas</p>
            </article>
            <div className="location-count-kpis">
              <article><span className="count-metric-icon red"><MapPin size={20} /></span><div><small>Ubicaciones pendientes</small><strong>{locationProgress.pending}</strong><p>priorizadas para ejecutar</p></div></article>
              <article><span className="count-metric-icon teal"><Target size={20} /></span><div><small>Objetivo anticipado</small><strong>{locationProgress.targetDate ? formatDate(locationProgress.targetDate) : "Pendiente"}</strong><p>1 mes antes del {formatDate(locationProgress.deadline)}</p></div></article>
              <article className="daily-target-card"><span className="count-metric-icon amber"><CalendarDays size={20} /></span><div><small>Ritmo necesario</small><strong>{locationProgress.dailyTarget || "—"} {locationProgress.dailyTarget === 1 ? "ubicación/día" : "ubicaciones/día"}</strong><p>{locationProgress.targetDate ? `${locationProgress.remainingWorkdays} días operativos · ${locationProgress.workdaysPerWeek} días/semana` : "Añade la fecha final en el Excel"}</p></div></article>
            </div>
          </div>
          <div className="count-toolbar location-count-toolbar">
            <label className="search-box warehouse-search"><Search size={17} /><input aria-label="Buscar ubicación pendiente" placeholder="Buscar ubicación, SKU o familia" value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} /></label>
            <label className="select-box"><span>Zona</span><select value={locationZone} onChange={(event) => setLocationZone(event.target.value)}><option value="all">Todas</option><option value="APQ">APQ</option><option value="PICKING">Picking</option><option value="SUELO">Suelo</option><option value="RESERVA">Reserva</option><option value="CALIDAD">Calidad</option><option value="GENERAL">General</option></select></label>
            <button className="ghost-button" onClick={() => { downloadTextFile("stockflow_ubicaciones_pendientes.csv", exportPendingLocationsCsv(locationProgress)); onNotify("Lista de ubicaciones pendientes preparada"); }} type="button"><Download size={16} /> Exportar pendientes</button>
          </div>
          <div className="count-guidance"><Info size={16} /><span>Prioridad automática: APQ, ubicaciones con picking pendiente y suelo antes que reserva. El ritmo diario se recalcula con los días operativos indicados en el Excel.</span></div>
          <div className="table-scroll">
            <table className="count-table location-count-table">
              <thead><tr><th>Prioridad</th><th>Ubicación</th><th>Zona / Familia</th><th>SKU / Producto</th><th>Stock sistema</th><th>Picking próximo</th><th>Estado</th></tr></thead>
              <tbody>
                {filteredPendingLocations.slice(0, 100).map((record, index) => (
                  <tr key={`${record.aisle}-${record.bay}-${record.level}`}>
                    <td><span className="count-order">{index + 1}</span></td>
                    <td><span className="sku-line">{record.sourceLocationCode || record.locationCode}</span><span className="product-line">P{record.aisle} · M{record.bay} · A{record.level}</span></td>
                    <td><span className={`zone-pill zone-${record.zone.toLowerCase()}`}>{record.zone}</span><span className="product-line">{record.family}</span></td>
                    <td><span className="sku-line">{record.skus.join(" · ") || "Ubicación vacía"}</span><span className="product-line">{record.products.join(" · ") || "Sin artículo"}</span></td>
                    <td>{decimal.format(record.systemQuantity)}</td>
                    <td>{decimal.format(record.pendingPicking)}</td>
                    <td><span className="count-result pending">Pendiente</span></td>
                  </tr>
                ))}
                {!filteredPendingLocations.length && <tr><td colSpan={7}><div className="empty-state"><CheckCircle2 size={24} /><strong>No hay ubicaciones pendientes en este filtro</strong><span>Prueba otra zona o búsqueda.</span></div></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="count-footer"><span>Mostrando {Math.min(filteredPendingLocations.length, 100)} de {filteredPendingLocations.length} ubicaciones filtradas</span><strong>{locationProgress.dailyTarget ? `Meta: ${locationProgress.dailyTarget} al día` : "Configura la fecha final"}</strong></div>
        </section>
      ) : (
        <section className="panel location-count-empty">
          <span className="count-metric-icon teal"><MapPin size={20} /></span>
          <div><span className="panel-kicker">Avance por ubicación</span><h2>Añádelo desde tu Excel</h2><p>Incluye ubicación, estado del conteo, fecha final y días operativos. StockFlow calculará automáticamente porcentaje, pendientes y ritmo diario para terminar un mes antes.</p></div>
        </section>
      )}

      <section className="panel count-plan-panel">
        <div className="panel-heading">
          <div><span className="panel-kicker">Contrato del cliente</span><h2>Plan anual de conteos</h2></div>
          <span className="privacy-chip"><ShieldCheck size={15} /> Sesión local</span>
        </div>
        <div className="count-plan-grid">
          <label className="field-group field-client"><span>Cliente</span><div className="field-with-icon"><Building2 size={17} /><input value={plan.clientName} onChange={(event) => onPlanChange({ ...plan, clientName: event.target.value })} placeholder="Nombre del cliente" /></div></label>
          <label className="field-group"><span>Año del plan</span><input type="number" min="2026" max="2100" value={plan.year} onChange={(event) => { const year = Number(event.target.value); onPlanChange({ ...plan, year }); onCampaignChange(`${year}-1`); }} /></label>
          <label className="field-group"><span>Tolerancia permitida</span><div className="field-suffix"><input type="number" min="0" max="100" step="0.5" value={plan.tolerancePct} onChange={(event) => onPlanChange({ ...plan, tolerancePct: Math.max(0, Number(event.target.value)) })} /><span>%</span></div></label>
          <fieldset className="frequency-field">
            <legend>Servicio contratado</legend>
            <div className="frequency-options">
              <button className={plan.frequency === 1 ? "selected" : ""} onClick={() => updateFrequency(1)} type="button"><strong>1</strong><span>conteo al año</span></button>
              <button className={plan.frequency === 2 ? "selected" : ""} onClick={() => updateFrequency(2)} type="button"><strong>2</strong><span>conteos al año</span></button>
            </div>
          </fieldset>
          <label className="field-group"><span>{plan.frequency === 1 ? "Fecha del conteo" : "Primer conteo"}</span><input type="date" value={plan.firstDate} onChange={(event) => updateFirstDate(event.target.value)} /></label>
          {plan.frequency === 2 && <label className="field-group"><span>Segundo conteo</span><input type="date" value={plan.secondDate} onChange={(event) => onPlanChange({ ...plan, secondDate: event.target.value })} /></label>}
          <label className="grace-count-option">
            <input checked={plan.graceCount} onChange={(event) => {
              const graceCount = event.target.checked;
              onPlanChange({ ...plan, graceCount, graceDate: graceCount ? plan.graceDate || plan.secondDate || addSixMonths(plan.firstDate) : plan.graceDate });
              if (!graceCount && activeCampaignId.endsWith("-gracia")) onCampaignChange(`${plan.year}-1`);
            }} type="checkbox" />
            <span><strong>Conteo de gracia</strong><small>Añade una revisión extraordinaria sin cambiar el servicio anual contratado.</small></span>
          </label>
          {plan.graceCount && <label className="field-group"><span>Fecha del conteo de gracia</span><input type="date" value={plan.graceDate} onChange={(event) => onPlanChange({ ...plan, graceDate: event.target.value })} /></label>}
        </div>
      </section>

      <section className="campaign-strip" aria-label="Campañas de conteo">
        {campaigns.map((item) => {
          const completed = completedCampaigns.includes(item.id);
          const active = item.id === campaign.id;
          return (
            <button key={item.id} className={active ? "active" : ""} onClick={() => onCampaignChange(item.id)} type="button">
              <span className="campaign-number"><ClipboardCheck size={18} /></span>
              <div><small>{item.label}</small><strong>{formatDate(item.date)}</strong></div>
              <span className={`campaign-status ${completed ? "completed" : "scheduled"}`}>{completed ? "Completado" : "Programado"}</span>
            </button>
          );
        })}
      </section>

      <section className="count-metrics-grid" aria-label="Progreso del conteo">
        <article><span className="count-metric-icon teal"><ListChecks size={20} /></span><div><small>Progreso</small><strong>{metrics.counted}/{items.length} SKU</strong><div className="mini-progress"><span style={{ width: `${metrics.progressPct}%` }} /></div></div></article>
        <article><span className="count-metric-icon red"><CircleAlert size={20} /></span><div><small>Diferencias</small><strong>{metrics.discrepancies}</strong><p>fuera de ±{decimal.format(plan.tolerancePct)} %</p></div></article>
        <article><span className="count-metric-icon green"><Target size={20} /></span><div><small>Exactitud</small><strong>{decimal.format(metrics.accuracyPct)} %</strong><p>{metrics.exactMatches} coincidencias exactas</p></div></article>
        <article><span className="count-metric-icon amber"><Euro size={20} /></span><div><small>Ajuste valorado</small><strong>{costKnownCount ? currency.format(metrics.valueDifference) : "Pendiente"}</strong><p>{costKnownCount === items.length ? "diferencia neta estimada" : `${costKnownCount}/${items.length} SKU con coste · valor parcial`}</p></div></article>
      </section>

      <section className="panel count-table-panel">
        <div className="count-toolbar">
          <div className="segmented-control" aria-label="Filtrar conteo">
            <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")} type="button">Todos</button>
            <button className={filter === "pending" ? "selected" : ""} onClick={() => setFilter("pending")} type="button">Pendientes</button>
            <button className={filter === "discrepancies" ? "selected" : ""} onClick={() => setFilter("discrepancies")} type="button">Diferencias</button>
          </div>
          <div className="count-actions">
            <button className="ghost-button" onClick={onFillSample} type="button"><Sparkles size={16} /> Cargar ejemplo</button>
            <button className="ghost-button" onClick={onReset} type="button"><RotateCcw size={16} /> Reiniciar</button>
            <button className="finish-count-button" disabled={metrics.pending > 0 || isCompleted} onClick={() => onComplete(campaign.id)} type="button"><CheckCircle2 size={17} /> {isCompleted ? "Conteo completado" : "Finalizar conteo"}</button>
          </div>
        </div>
        <div className="count-guidance"><Info size={16} /><span>Orden sugerido por criticidad ABC cuando está disponible; las referencias sin coste o demanda se mantienen visibles y no se clasifican de forma ficticia.</span></div>
        <div className="table-scroll">
          <table className="count-table">
            <thead><tr><th>Orden</th><th>Clase</th><th>SKU / Producto</th><th>Stock sistema</th><th>Conteo físico</th><th>Diferencia</th><th>Variación</th><th>Resultado</th></tr></thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.item.sku}>
                  <td><span className="count-order">{index + 1}</span></td>
                  <td>{row.item.abcAvailable ? <span className={`abc-badge abc-${row.item.abcClass.toLowerCase()}`}>{row.item.abcClass}</span> : <span className="abc-badge abc-na">—</span>}</td>
                  <td><span className="sku-line">{row.item.sku}</span><span className="product-line">{row.item.product}</span></td>
                  <td>{decimal.format(row.item.currentStock)}</td>
                  <td><input aria-label={`Conteo físico de ${row.item.product}`} className="physical-count-input" inputMode="decimal" min="0" type="number" value={entries[row.item.sku] ?? ""} onChange={(event) => onEntryChange(row.item.sku, event.target.value)} placeholder="0" /></td>
                  <td className={row.difference === null ? "muted-cell" : row.difference === 0 ? "difference-ok" : "difference-alert"}>{row.difference === null ? "—" : `${row.difference > 0 ? "+" : ""}${decimal.format(row.difference)}`}</td>
                  <td>{row.differencePct === null ? "—" : `${decimal.format(row.differencePct)} %`}</td>
                  <td>{row.physicalCount === null ? <span className="count-result pending">Pendiente</span> : row.hasDiscrepancy ? <span className="count-result mismatch">Revisar</span> : <span className="count-result match">Correcto</span>}</td>
                </tr>
              ))}
              {!filteredRows.length && <tr><td colSpan={8}><div className="empty-state"><CheckCircle2 size={24} /><strong>No hay referencias en este filtro</strong><span>Elige otra vista para continuar el conteo.</span></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="count-footer"><span>{metrics.pending} pendientes · {metrics.discrepancies} fuera de tolerancia</span><strong>{isCompleted ? "Acta cerrada" : "Conteo en preparación"}</strong></div>
      </section>
    </div>
  );
}

function UploadModal({
  open,
  processing,
  errors,
  draft,
  mapping,
  mode,
  canEnrich,
  documentMeta,
  onClose,
  onImport,
  onModeChange,
  onStructureChange,
  onMappingChange,
  onConfirm,
  onDownloadTemplate,
}: {
  open: boolean;
  processing: boolean;
  errors: string[];
  draft: UniversalImportDraft | null;
  mapping: UniversalMapping | null;
  mode: ImportMode;
  canEnrich: boolean;
  documentMeta: ExtractedBusinessDocument | null;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  onModeChange: (mode: ImportMode) => void;
  onStructureChange: (sheetName: string, headerRowIndex?: number) => void;
  onMappingChange: (field: keyof UniversalMapping, column: number | null) => void;
  onConfirm: () => void;
  onDownloadTemplate: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onImport(file);
    event.target.value = "";
  };

  const dropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void onImport(file);
  };

  const mappedFields = mapping ? UNIVERSAL_EDITABLE_FIELDS.filter((field) => mapping[field] !== null) : [];
  const hasMappedLocation = Boolean(mapping && (mapping.location !== null || mapping.locationStart !== null || (mapping.aisle !== null && mapping.bay !== null)));
  const hasMappedCycleCount = Boolean(mapping && ["countCampaign", "countStatus", "physicalCount", "countedAt", "countDeadline", "countWorkdays"].some((field) => mapping[field as keyof UniversalMapping] !== null));
  const mappingReady = Boolean(mapping && (mode === "replace"
    ? mapping.sku !== null && mapping.quantity !== null
    : (mapping.sku !== null && (mappedFields.some((field) => field !== "sku") || mapping.locationStart !== null))
      || (hasMappedLocation && hasMappedCycleCount)));
  const mappedCount = mapping ? UNIVERSAL_EDITABLE_FIELDS.filter((field) => mapping[field] !== null).length : 0;
  const mappingGroups: Array<{ title: string; fields: Array<keyof UniversalMapping> }> = [
    { title: "Inventario y producto", fields: ["sku", "product", "quantity", "family", "unitCost"] },
    { title: "Demanda y reposición", fields: ["demand", "salesM1", "salesM2", "salesM3", "leadTime", "safetyStock", "pending"] },
    { title: "Ubicación y capacidad", fields: ["location", "zone", "aisle", "bay", "level", "capacity", "totalAisles", "baysPerAisle", "totalLevels"] },
    { title: "Trazabilidad y seguridad", fields: ["batch", "manufacturing", "expiry", "hazardous", "grade", "holdCode", "pickingIndicator"] },
    { title: "Conteos por ubicación", fields: ["countCampaign", "countStatus", "physicalCount", "countedAt", "countDeadline", "countWorkdays"] },
  ];
  const selectColumn = (field: keyof UniversalMapping, label: string) => (
    <label className="mapping-field" key={field}>
      <span>{label}</span>
      <select
        value={mapping?.[field] ?? ""}
        onChange={(event) => onMappingChange(field, event.target.value === "" ? null : Number(event.target.value))}
      >
        <option value="">No disponible</option>
        {draft?.columns.map((column) => <option key={`${field}-${column.index}`} value={column.index}>{column.label} · ej. {column.sample}</option>)}
      </select>
    </label>
  );

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="upload-title" aria-modal="true" className="modal-card" role="dialog">
        <button className="modal-close" aria-label="Cerrar importación" onClick={onClose} type="button"><X size={20} /></button>
        <span className="modal-icon"><FileText size={26} /></span>
        <h2 id="upload-title">Centro universal de documentos</h2>
        <p>Extrae tablas de formatos empresariales, traduce sus columnas y te deja validar cada correspondencia antes de utilizar los datos.</p>
        <div className="import-mode-selector" aria-label="Modo de incorporación">
          <button className={mode === "replace" ? "selected" : ""} onClick={() => onModeChange("replace")} type="button">
            <FileSpreadsheet size={18} /><span><strong>Nuevo análisis</strong><small>Sustituye la demostración o el inventario actual</small></span>
          </button>
          <button className={mode === "enrich" ? "selected" : ""} disabled={!canEnrich} onClick={() => onModeChange("enrich")} type="button">
            <PlusCircle size={18} /><span><strong>Complementar datos</strong><small>{canEnrich ? "Une demanda, costes, picking o lotes por SKU" : "Importa primero un inventario propio"}</small></span>
          </button>
        </div>
        {!draft ? (
          <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={dropFile}>
            <Upload size={30} aria-hidden="true" />
            <strong>Arrastra aquí un documento empresarial</strong>
            <span>StockFlow buscará automáticamente tablas, encabezados y campos logísticos</span>
            <div className="format-pills"><span><FileSpreadsheet size={14} /> XLSX / CSV / TSV</span><span><FileJson size={14} /> JSON</span><span><FileText size={14} /> PDF / DOCX / TXT</span></div>
            <button className="primary-button compact" disabled={processing} onClick={() => inputRef.current?.click()} type="button">{processing ? <RefreshCw className="spin" size={18} /> : <Upload size={18} />}{processing ? "Interpretando…" : "Seleccionar documento"}</button>
            <small>PDF debe contener texto seleccionable. Los documentos escaneados requieren OCR antes de importarlos.</small>
          </div>
        ) : (
          <div className="mapping-assistant">
            <div className="mapping-summary">
              <span className="mapping-summary-icon"><Sparkles size={20} /></span>
              <div><strong>{documentMeta?.formatLabel || "Documento"} interpretado</strong><p>Tabla «{draft.sheetName}» · encabezados en fila {draft.headerRowIndex + 1} · {draft.dataRowCount} filas · {mappedCount} campos reconocidos</p></div>
              <button className="text-action" disabled={processing} onClick={() => inputRef.current?.click()} type="button">Cambiar documento</button>
            </div>
            <div className="mapping-source-controls">
              <label><span>Hoja de datos</span><select value={draft.sheetName} onChange={(event) => onStructureChange(event.target.value)}>{draft.sheetOptions.map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name} · {sheet.rowCount} filas</option>)}</select></label>
              <label><span>Fila de encabezados</span><input min="1" max={Math.max(1, draft.rows.length)} type="number" value={draft.headerRowIndex + 1} onChange={(event) => onStructureChange(draft.sheetName, Math.max(0, Number(event.target.value || 1) - 1))} /></label>
              <p><Info size={14} /> Si la detección no coincide con tu archivo, corrige estos dos datos y vuelve a revisar las columnas.</p>
            </div>
            {!![...(documentMeta?.warnings ?? []), ...draft.warnings].length && <div className="mapping-notes">{[...new Set([...(documentMeta?.warnings ?? []), ...draft.warnings])].map((warning) => <span key={warning}><Info size={14} />{warning}</span>)}</div>}
            <div className="mapping-required-note"><CheckCircle2 size={17} /><span>{mode === "replace" ? "Para un análisis nuevo solo SKU y cantidad son imprescindibles." : "Para complementar, usa SKU con un dato nuevo o una ubicación con campos de conteo. StockFlow los unirá sin duplicar el inventario."} Los valores ausentes nunca se inventan.</span></div>
            <div className="mapping-groups">
              {mappingGroups.map((group) => <section key={group.title}><h3>{group.title}</h3><div className="mapping-grid">{group.fields.map((field) => selectColumn(field, field === "locationStart" || field === "locationEnd" ? field : UNIVERSAL_FIELD_LABELS[field as keyof typeof UNIVERSAL_FIELD_LABELS]))}</div></section>)}
            </div>
            <div className="location-builder">
              <div><strong>Construcción de la ubicación</strong><p>Si la dirección está dividida en varias columnas, selecciona la primera y la última. StockFlow conservará el código original completo.</p></div>
              <div className="location-builder-fields">
                {selectColumn("locationStart", "Primera columna")}
                {selectColumn("locationEnd", "Última columna")}
              </div>
            </div>
            <div className="mapping-confirm-row">
              <span><ShieldCheck size={16} /> La correspondencia de este formato se recordará en este dispositivo.</span>
              <button className="primary-button compact" disabled={!mappingReady || processing} onClick={onConfirm} type="button">{processing ? <RefreshCw className="spin" size={18} /> : <ArrowRight size={18} />}{processing ? "Traduciendo…" : mode === "replace" ? "Crear análisis" : "Unir datos"}</button>
            </div>
          </div>
        )}
        <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.csv,.tsv,.json,.pdf,.docx,.txt,text/csv,text/tab-separated-values,application/json,application/pdf" onChange={selectFile} />
        {!!errors.length && <div className="upload-errors" role="alert"><strong>Revisa el archivo:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        <div className="modal-actions">
          <button className="template-button" onClick={onDownloadTemplate} type="button"><Download size={17} /> Descargar plantilla Excel</button>
          <span><ShieldCheck size={16} /> Tus datos se procesan localmente</span>
        </div>
      </section>
    </div>
  );
}

function DetailDrawer({ item, onClose }: { item: AnalyzedInventoryItem | null; onClose: () => void }) {
  if (!item) return null;
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside aria-labelledby="detail-title" aria-modal="true" className="detail-drawer" role="dialog">
        <button className="modal-close" aria-label="Cerrar detalle" onClick={onClose} type="button"><X size={20} /></button>
        <p className="eyebrow">Explicación de la decisión</p>
        <h2 id="detail-title">{item.product}</h2>
        <div className="drawer-meta"><span>{item.sku}</span><span>{item.abcAvailable ? `Clase ${item.abcClass}` : "ABC pendiente"}</span><PriorityBadge status={item.status} label={item.statusLabel} /></div>
        <section className="decision-card">
          <span>Acción recomendada</span><strong>{item.recommendation}</strong><p>{item.situation}. {item.demandAvailable ? "La recomendación se basa en demanda, cobertura, plazo de entrega y stock de seguridad." : "La aplicación ha detenido los cálculos que requieren demanda hasta disponer de un dato real."}</p>
        </section>
        <div className="detail-metrics">
          <article><span>Stock actual</span><strong>{decimal.format(item.currentStock)} ud.</strong></article>
          <article><span>Demanda media</span><strong>{item.demandAvailable ? `${decimal.format(item.averageMonthlyDemand)} ud./mes` : "No disponible"}</strong></article>
          <article><span>Cobertura</span><strong>{coverageLabel(item.coverageDays, item.demandAvailable)}</strong></article>
          <article><span>Punto de pedido</span><strong>{item.demandAvailable ? `${decimal.format(item.reorderPoint)} ud.` : "No disponible"}</strong></article>
          <article><span>Rotación mensual</span><strong>{item.demandAvailable ? `${decimal.format(item.rotationMonthly)}×` : "No disponible"}</strong></article>
          <article><span>Valor en stock</span><strong>{item.unitCostAvailable ? currency.format(item.stockValue) : "No disponible"}</strong></article>
        </div>
        <section className="formula-card">
          <h3>Cómo se calcula</h3>
          {item.demandAvailable ? <><p><strong>Cobertura:</strong> stock actual ÷ demanda diaria media.</p><p><strong>Punto de pedido:</strong> demanda durante el plazo de entrega + stock de seguridad.</p></> : <p><strong>Cálculo pausado:</strong> falta demanda o consumo verificable.</p>}
          <p><strong>ABC:</strong> {item.abcAvailable ? "valor de consumo acumulado de cada referencia." : "requiere demanda y coste unitario suficientes para clasificar."}</p>
        </section>
      </aside>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("resumen");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inventory, setInventory] = useState<RawInventoryItem[]>(SAMPLE_INVENTORY);
  const [warehouse, setWarehouse] = useState<WarehouseDataset>(SAMPLE_WAREHOUSE);
  const [datasetName, setDatasetName] = useState("Inventario de demostración");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [importDraft, setImportDraft] = useState<UniversalImportDraft | null>(null);
  const [importMapping, setImportMapping] = useState<UniversalMapping | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [importDocument, setImportDocument] = useState<ExtractedBusinessDocument | null>(null);
  const [selectedItem, setSelectedItem] = useState<AnalyzedInventoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [countPlan, setCountPlan] = useState<CycleCountPlan>({
    clientName: "Cliente Demo Logística",
    year: 2026,
    frequency: 2,
    firstDate: "2026-04-15",
    secondDate: "2026-10-15",
    graceCount: false,
    graceDate: "2026-12-10",
    tolerancePct: 2,
  });
  const [countEntriesByCampaign, setCountEntriesByCampaign] = useState<Record<string, Record<string, string>>>({});
  const [activeCampaignId, setActiveCampaignId] = useState("2026-2");
  const [completedCampaigns, setCompletedCampaigns] = useState<string[]>(["2026-1"]);

  const analysis = useMemo(() => analyzeInventory(inventory), [inventory]);
  const readiness = useMemo(() => assessOperationalReadiness(warehouse, inventory), [warehouse, inventory]);

  const navigate = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3600);
  };

  const openUpload = (mode: ImportMode = "replace") => {
    setUploadErrors([]);
    setImportMode(mode === "enrich" && datasetName === "Inventario de demostración" ? "replace" : mode);
    setUploadOpen(true);
  };

  const closeUpload = () => {
    if (processing) return;
    setUploadOpen(false);
    setUploadErrors([]);
    setImportDraft(null);
    setImportMapping(null);
    setImportFileName("");
    setImportDocument(null);
  };

  const loadRememberedMapping = (draft: UniversalImportDraft) => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(IMPORT_PROFILE_KEY) || "{}") as Record<string, UniversalMapping>;
      const remembered = stored[draft.profileSignature];
      if (!remembered) return draft.mapping;
      const validEntries = Object.fromEntries(Object.entries(remembered).map(([key, value]) => [
        key,
        typeof value === "number" && value >= 0 && value < draft.columns.length ? value : null,
      ]));
      return { ...draft.mapping, ...validEntries } as UniversalMapping;
    } catch {
      return draft.mapping;
    }
  };

  const rememberMapping = (draft: UniversalImportDraft, mapping: UniversalMapping) => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(IMPORT_PROFILE_KEY) || "{}") as Record<string, UniversalMapping>;
      window.localStorage.setItem(IMPORT_PROFILE_KEY, JSON.stringify({ ...stored, [draft.profileSignature]: mapping }));
    } catch {
      // La importación sigue funcionando aunque el navegador bloquee el almacenamiento local.
    }
  };

  const importFile = async (file: File) => {
    setProcessing(true);
    setUploadErrors([]);
    try {
      if (file.size > 20_000_000) {
        setUploadErrors(["El documento supera 20 MB. Divídelo o expórtalo en una versión más ligera."]);
        return;
      }
      const extracted = await extractBusinessDocument(file);
      const draft = analyzeUniversalWorkbook(extracted.sheets);
      setImportDocument(extracted);
      setImportDraft(draft);
      setImportMapping(loadRememberedMapping(draft));
      setImportFileName(file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      setImportDocument(null);
      setImportDraft(null);
      setImportMapping(null);
      setUploadErrors([error instanceof Error ? error.message : "No pudimos leer el documento. Comprueba su formato e inténtalo de nuevo."]);
    } finally {
      setProcessing(false);
    }
  };

  const changeImportMapping = (field: keyof UniversalMapping, column: number | null) => {
    setImportMapping((current) => {
      if (!current) return current;
      const next = { ...current, [field]: column };
      if (field === "locationStart" && column !== null && next.locationEnd === null) next.locationEnd = column;
      if (field === "locationEnd" && column !== null && next.locationStart === null) next.locationStart = column;
      if (next.locationStart !== null && next.locationEnd !== null && next.locationEnd < next.locationStart) {
        if (field === "locationStart") next.locationEnd = column;
        else next.locationStart = column;
      }
      return next;
    });
  };

  const changeImportStructure = (sheetName: string, headerRowIndex?: number) => {
    if (!importDraft) return;
    try {
      const nextDraft = reanalyzeUniversalDraft(importDraft, sheetName, headerRowIndex);
      setImportDraft(nextDraft);
      setImportMapping(loadRememberedMapping(nextDraft));
      setUploadErrors([]);
    } catch {
      setUploadErrors(["No pudimos interpretar la hoja o la fila seleccionada."]);
    }
  };

  const confirmUniversalImport = () => {
    if (!importDraft || !importMapping) return;
    setProcessing(true);
    setUploadErrors([]);
    try {
      if (importMode === "enrich") {
        const enriched = enrichWarehouseDataset(warehouse, importDraft, importMapping, {
          name: importFileName || "Documento complementario",
          format: importDocument?.formatLabel || "Documento",
        });
        if (enriched.errors.length || !enriched.dataset || !enriched.items.length) {
          setUploadErrors(enriched.errors.length ? enriched.errors : ["No se encontraron datos nuevos que pudieran unirse al inventario."]);
          return;
        }
        rememberMapping(importDraft, importMapping);
        setInventory(enriched.items);
        setWarehouse(enriched.dataset);
        if (enriched.appliedFields.includes("quantity")) {
          setCountEntriesByCampaign({});
          setCompletedCampaigns([]);
        }
        setUploadOpen(false);
        setImportDraft(null);
        setImportMapping(null);
        setImportDocument(null);
        setActiveView("resumen");
        showToast(enriched.updatedLocationCount
          ? `${enriched.updatedLocationCount} ubicaciones de conteo actualizadas${enriched.updatedSkuCount ? ` · ${enriched.updatedSkuCount} SKU complementados` : ""}`
          : `${enriched.updatedSkuCount} SKU complementados con ${enriched.appliedFields.length} tipos de datos`);
        return;
      }
      const parsed = translateUniversalDraft(importDraft, importMapping);
      if (parsed.errors.length || !parsed.items.length || !parsed.dataset) {
        setUploadErrors(parsed.errors.length ? parsed.errors : ["No se encontraron productos válidos."]);
        return;
      }
      rememberMapping(importDraft, importMapping);
      parsed.dataset.dataSources = [{
        name: importFileName || "Inventario importado",
        format: importDocument?.formatLabel || "Documento",
        mode: "replace",
        rows: parsed.dataset.importSummary?.dataRows ?? parsed.dataset.stocks.length,
        mappedFields: parsed.dataset.importSummary?.mappedFields ?? 2,
        importedAt: new Date().toISOString(),
      }];
      setInventory(parsed.items);
      setWarehouse(parsed.dataset);
      setDatasetName(importFileName || "Inventario importado");
      setCountEntriesByCampaign({});
      setCompletedCampaigns([]);
      setUploadOpen(false);
      setImportDraft(null);
      setImportMapping(null);
      setImportDocument(null);
      const translatedLocations = buildWarehouseLocations(parsed.dataset);
      setActiveView(parsed.dataset.capabilities?.location === false ? "inventario" : "almacen");
      const cycleCountMessage = parsed.dataset.cycleCount ? ` · ${parsed.dataset.cycleCount.records.length} ubicaciones de conteo` : "";
      showToast(parsed.dataset.capabilities?.location === false
        ? `${parsed.items.length} SKU traducidos; las ubicaciones no estaban incluidas`
        : `${parsed.items.length} SKU y ${translatedLocations.length} ubicaciones traducidas${cycleCountMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const exportResults = () => {
    downloadTextFile("stockflow_analisis.csv", exportAnalysisCsv(analysis.items));
    showToast("Informe CSV preparado");
  };

  const exportWarehouse = () => {
    downloadTextFile("stockflow_mapa_almacen.csv", exportWarehouseCsv(buildWarehouseLocations(warehouse)));
    showToast("Mapa completo de ubicaciones preparado");
  };

  const exportExecutiveWorkbook = async () => {
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    const locations = buildWarehouseLocations(warehouse);
    const moves = calculateWarehouseMoves(warehouse, analysis.items);
    const locationCountProgress = calculateLocationCountProgress(warehouse.cycleCount);
    const headerRow = (headers: string[]) => headers.map((value) => ({ value, fontWeight: "bold" as const, backgroundColor: "#0B4A5A", textColor: "#FFFFFF", wrap: true }));
    const dataRows = (rows: Array<Array<string | number>>) => rows.map((row) => row.map((value) => ({ value, wrap: true })));
    const summaryRows: Array<Array<string | number>> = [
      ["Indicador", "Resultado"],
      ["Conjunto de datos", datasetName],
      ["Preparación operativa", `${readiness.score}/100 · ${readiness.level}`],
      ["Fuentes integradas", warehouse.dataSources?.length ?? 1],
      ["SKU analizados", analysis.items.length],
      ["Unidades en inventario", analysis.items.reduce((sum, item) => sum + item.currentStock, 0)],
      ["Valor conocido del inventario", analysis.summary.totalStockValue],
      ["SKU críticos", analysis.summary.riskCount],
      ["SKU con sobrestock", analysis.summary.overstockCount],
      ["Ubicaciones confirmadas", locations.length],
      ["Ubicaciones ocupadas", locations.filter((location) => location.contents.length).length],
      ["Picking pendiente conocido", locations.reduce((sum, location) => sum + location.pendingPicking, 0)],
      ["Movimientos recomendados", moves.length],
    ];
    if (locationCountProgress) {
      summaryRows.push(
        ["Campaña de conteo", locationCountProgress.campaign],
        ["Avance por ubicación", `${decimal.format(locationCountProgress.progressPct)} % (${locationCountProgress.counted}/${locationCountProgress.total})`],
        ["Ubicaciones pendientes", locationCountProgress.pending],
        ["Objetivo un mes antes", locationCountProgress.targetDate || "Falta fecha final"],
        ["Ritmo diario necesario", locationCountProgress.dailyTarget ? `${locationCountProgress.dailyTarget} ubicaciones/día` : "Falta fecha final"],
      );
    }
    const inventoryRows = analysis.items.map((item) => [
      item.sku, item.product, item.category, item.abcAvailable ? item.abcClass : "No disponible", item.currentStock,
      item.demandAvailable ? item.averageMonthlyDemand : "No disponible", item.demandAvailable ? item.coverageDays : "No disponible",
      item.demandAvailable ? item.reorderPoint : "No disponible", item.demandAvailable ? item.suggestedOrder : "No disponible",
      item.statusLabel, item.situation, item.recommendation, item.unitCostAvailable ? item.stockValue : "No disponible",
    ]);
    const locationRows = locations.map((location) => [
      location.sourceCode || location.code, location.zone, location.family, location.aisle, location.bay, location.level,
      location.quantity, location.capacity, location.pendingPicking,
      location.contents.map((stock) => stock.sku).join(" | "), location.contents.map((stock) => stock.batch || "Sin lote").join(" | "),
      location.contents.map((stock) => stock.expiryDate || "No informado").join(" | "),
    ]);
    const movementRows = moves.map((move) => [move.type, move.priority, move.sku, move.product, move.quantity, move.from, move.to || "Sin destino", move.reason, move.lotRule]);
    const qualityRows = readiness.capabilities.map((capability) => [
      capability.label,
      capability.status === "complete" ? "Completo" : capability.status === "partial" ? "Parcial" : "Pendiente",
      `${capability.coverage}%`,
      capability.weight,
      capability.helper,
      capability.status === "complete" ? "" : capability.nextStep,
    ]);
    const campaignRows = createCountCampaigns(countPlan).map((campaign) => [countPlan.clientName, campaign.label, campaign.date, completedCampaigns.includes(campaign.id) ? "Completado" : "Programado", countPlan.tolerancePct]);
    const locationCountRows = (warehouse.cycleCount?.records ?? []).map((record) => [
      warehouse.cycleCount?.campaign || "Conteo importado",
      record.sourceLocationCode || record.locationCode,
      record.zone,
      record.family,
      record.aisle,
      record.bay,
      record.level,
      record.skus.join(" | "),
      record.systemQuantity,
      record.physicalCount ?? "",
      record.countedAt,
      record.pendingPicking,
      record.status === "counted" ? "Contado" : record.status === "excluded" ? "Excluido" : "Pendiente",
      warehouse.cycleCount?.deadline || "",
      locationCountProgress?.targetDate || "",
      locationCountProgress?.dailyTarget ?? 0,
    ]);
    await writeExcelFile([
      { sheet: "Resumen ejecutivo", data: [headerRow(summaryRows[0] as string[]), ...dataRows(summaryRows.slice(1))], columns: [{ width: 35 }, { width: 42 }], stickyRowsCount: 1 },
      { sheet: "Inventario", data: [headerRow(["SKU", "Producto", "Familia", "ABC", "Stock", "Demanda mes", "Cobertura días", "Punto pedido", "Pedido sugerido", "Estado", "Situación", "Acción", "Valor stock"]), ...dataRows(inventoryRows)], columns: [16, 32, 22, 12, 12, 16, 16, 16, 18, 14, 24, 48, 18].map((width) => ({ width })), stickyRowsCount: 1 },
      { sheet: "Ubicaciones", data: [headerRow(["Ubicación", "Zona", "Familia", "Pasillo", "Módulo", "Altura", "Cantidad", "Capacidad", "Picking", "SKU", "Lotes", "Vencimientos"]), ...dataRows(locationRows)], columns: [24, 14, 24, 10, 10, 10, 14, 14, 14, 28, 28, 28].map((width) => ({ width })), stickyRowsCount: 1 },
      { sheet: "Movimientos", data: [headerRow(["Tipo", "Prioridad", "SKU", "Producto", "Cantidad", "Origen", "Destino", "Motivo", "Control de lote"]), ...dataRows(movementRows)], columns: [16, 12, 16, 28, 14, 22, 22, 55, 55].map((width) => ({ width })), stickyRowsCount: 1 },
      { sheet: "Calidad de datos", data: [headerRow(["Capacidad", "Estado", "Cobertura", "Peso", "Uso", "Próximo paso"]), ...dataRows(qualityRows)], columns: [24, 16, 14, 10, 38, 55].map((width) => ({ width })), stickyRowsCount: 1 },
      { sheet: "Plan de conteos", data: [headerRow(["Cliente", "Campaña", "Fecha", "Estado", "Tolerancia %"]), ...dataRows(campaignRows)], columns: [30, 22, 16, 16, 16].map((width) => ({ width })), stickyRowsCount: 1 },
      { sheet: "Avance conteo ubicaciones", data: [headerRow(["Campaña", "Ubicación", "Zona", "Familia", "Pasillo", "Módulo", "Altura", "SKU", "Stock sistema", "Conteo físico", "Fecha conteo", "Picking", "Estado", "Fecha final", "Objetivo anticipado", "Meta diaria"]), ...dataRows(locationCountRows)], columns: [25, 22, 14, 24, 10, 10, 10, 26, 16, 16, 16, 12, 15, 16, 18, 14].map((width) => ({ width })), stickyRowsCount: 1 },
    ]).toFile(`stockflow_informe_${datasetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "inventario"}.xlsx`);
    showToast("Informe ejecutivo Excel preparado con 7 hojas");
  };

  const downloadWarehouseTemplate = async () => {
    const { default: writeExcelFile } = await import("write-excel-file/browser");
    const inventoryRows = createWarehouseTemplateRows().map((row, rowIndex) => row.map((value) => rowIndex === 0
      ? { value, fontWeight: "bold" as const, backgroundColor: "#DFF8F6", textColor: "#063B48", wrap: true }
      : value));
    const inventoryColumns = [
      { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
      { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 22 }, { wch: 18 },
      { wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
    ].map((column) => ({ width: column.wch }));
    const instructionsRows = [
      [{ value: "STOCKFLOW IA — PLANTILLA DE UBICACIONES", fontWeight: "bold" as const, fontSize: 16, textColor: "#063B48" }],
      ["Utiliza una fila por ubicación ocupada. Repite el SKU si está distribuido en varias ubicaciones."],
      ["total_pasillos, modulos_por_pasillo y alturas_almacen pueden informarse solo en la primera fila."],
      ["Las alturas admitidas son de 5 a 7. La altura 1 se considera suelo/picking; de 2 en adelante, reserva."],
      ["Marca APQ=SI para mercancía peligrosa. Nunca se mezcla con ubicaciones generales."],
      ["La fusión solo se recomienda cuando coinciden SKU, lote, fecha de fabricación y fecha de vencimiento."],
      ["picking_pendiente indica las unidades comprometidas en pedidos próximos."],
      ["Para medir el conteo por ubicación, informa campana_conteo y estado_conteo como CONTADO, PENDIENTE o EXCLUIDO."],
      ["fecha_limite_conteo es el compromiso final del cliente. StockFlow fijará el objetivo un mes antes y calculará ubicaciones por día."],
      ["dias_conteo_semana admite 5, 6 o 7 y determina qué días se consideran operativos."],
      ["No incluyas datos personales ni información real sensible en la demostración del hackathon."],
    ];
    await writeExcelFile([
      { data: inventoryRows, sheet: "Inventario", columns: inventoryColumns, stickyRowsCount: 1 },
      { data: instructionsRows, sheet: "Instrucciones", columns: [{ width: 115 }] },
    ]).toFile("stockflow_plantilla_ubicaciones.xlsx");
    showToast("Plantilla Excel preparada");
  };

  const restoreDemo = () => {
    setInventory(SAMPLE_INVENTORY);
    setWarehouse(SAMPLE_WAREHOUSE);
    setDatasetName("Inventario de demostración");
    setCountEntriesByCampaign({});
    setCompletedCampaigns(["2026-1"]);
    setActiveView("resumen");
    showToast("Datos de demostración restaurados");
  };

  const fillCountSample = () => {
    const sampleEntries = Object.fromEntries(analysis.items.map((item, index) => {
      const physical = index % 5 === 0
        ? Math.round(item.currentStock * 0.94)
        : index % 7 === 0
          ? Math.round(item.currentStock * 1.04)
          : item.currentStock;
      return [item.sku, String(Math.max(0, physical))];
    }));
    setCountEntriesByCampaign((current) => ({ ...current, [activeCampaignId]: sampleEntries }));
    showToast("Conteo de ejemplo cargado");
  };

  const resetCount = () => {
    setCountEntriesByCampaign((current) => {
      const next = { ...current };
      delete next[activeCampaignId];
      return next;
    });
    setCompletedCampaigns((current) => current.filter((id) => id !== activeCampaignId));
    showToast("Conteo reiniciado");
  };

  const completeCount = (campaignId: string) => {
    setCompletedCampaigns((current) => current.includes(campaignId) ? current : [...current, campaignId]);
    showToast("Conteo completado y listo para exportar");
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark" aria-hidden="true"><span /><span /></span><span>StockFlow <em>IA</em></span></div>
        <nav aria-label="Navegación principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => navigate(item.id)} type="button"><Icon size={22} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="sidebar-foot"><span className="status-dot" /><div><strong>Motor operativo</strong><span>Datos procesados en local</span></div></div>
      </aside>

      <div className="mobile-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><span /><span /></span><span>StockFlow <em>IA</em></span></div>
        <button aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMobileOpen((value) => !value)} type="button">{mobileOpen ? <X /> : <Menu />}</button>
      </div>

      {mobileOpen && <button className="nav-backdrop" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} type="button" />}

      <section className="workspace">
        <div className="topbar">
          <div className="dataset-label"><Database size={15} /><span>{datasetName}</span><strong>{inventory.length} SKU</strong></div>
          {datasetName !== "Inventario de demostración" && <button className="reset-data" onClick={restoreDemo} type="button"><RefreshCw size={14} /> Restaurar demo</button>}
          <button aria-label="Ver alertas" className="notification-button" onClick={() => navigate("acciones")} type="button"><Bell size={21} /><span>{analysis.summary.riskCount}</span></button>
        </div>

        {activeView === "resumen" && <Dashboard analysis={analysis} readiness={readiness} warehouse={warehouse} onAnalyze={() => openUpload("replace")} onCompleteData={() => openUpload("enrich")} onExportExecutive={exportExecutiveWorkbook} onViewAll={() => navigate("acciones")} onSelect={setSelectedItem} />}
        {activeView === "inventario" && <InventoryView items={analysis.items} onUpload={() => openUpload("replace")} onExport={exportResults} onSelect={setSelectedItem} />}
        {activeView === "almacen" && <WarehouseView dataset={warehouse} analysis={analysis} onUpload={() => openUpload("replace")} onExport={exportWarehouse} />}
        {activeView === "acciones" && <ActionsView items={analysis.items} onExport={exportResults} onSelect={setSelectedItem} />}
        {activeView === "simulador" && <SimulatorView inventory={inventory} baseline={analysis} onSelect={setSelectedItem} />}
        {activeView === "conteos" && <CyclicCountsView items={analysis.items} warehouse={warehouse} plan={countPlan} entries={countEntriesByCampaign[activeCampaignId] ?? {}} activeCampaignId={activeCampaignId} completedCampaigns={completedCampaigns} onPlanChange={setCountPlan} onEntryChange={(sku, value) => setCountEntriesByCampaign((current) => ({ ...current, [activeCampaignId]: { ...(current[activeCampaignId] ?? {}), [sku]: value } }))} onCampaignChange={setActiveCampaignId} onFillSample={fillCountSample} onReset={resetCount} onComplete={completeCount} onNotify={showToast} />}
      </section>

      <UploadModal
        open={uploadOpen}
        processing={processing}
        errors={uploadErrors}
        draft={importDraft}
        mapping={importMapping}
        mode={importMode}
        canEnrich={datasetName !== "Inventario de demostración"}
        documentMeta={importDocument}
        onClose={closeUpload}
        onImport={importFile}
        onModeChange={setImportMode}
        onStructureChange={changeImportStructure}
        onMappingChange={changeImportMapping}
        onConfirm={confirmUniversalImport}
        onDownloadTemplate={downloadWarehouseTemplate}
      />
      <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </main>
  );
}
