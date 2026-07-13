"use client";

import {
  ArrowRight,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Database,
  Download,
  Euro,
  FileSpreadsheet,
  Info,
  LayoutDashboard,
  ListChecks,
  LineChart,
  Menu,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  SAMPLE_INVENTORY,
  analyzeInventory,
  createTemplateCsv,
  exportAnalysisCsv,
  parseInventoryCsv,
  simulateInventory,
  type AnalyzedInventoryItem,
  type InventoryAnalysis,
  type RawInventoryItem,
  type StockStatus,
} from "../lib/inventory";
import {
  addSixMonths,
  calculateCountMetrics,
  createCountCampaigns,
  exportCountCsv,
  type CycleCountPlan,
} from "../lib/cycle-counts";

type View = "resumen" | "inventario" | "acciones" | "simulador" | "conteos";

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "inventario", label: "Inventario", icon: Package },
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

const coverageLabel = (coverage: number) => coverage >= 999 ? "Sin consumo" : `${decimal.format(coverage)} días`;

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
                <span className="sku-line">{item.sku} · Clase {item.abcClass}</span>
                <span className="product-line">{item.product}</span>
              </td>
              <td className={`situation situation-${item.status}`}>{item.situation}</td>
              <td>{coverageLabel(item.coverageDays)}</td>
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
  onAnalyze,
  onViewAll,
  onSelect,
}: {
  analysis: InventoryAnalysis;
  onAnalyze: () => void;
  onViewAll: () => void;
  onSelect: (item: AnalyzedInventoryItem) => void;
}) {
  const { summary, items } = analysis;
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
        <StatCard label="Valor del inventario" value={currency.format(summary.totalStockValue)} helper={`${items.length} referencias analizadas`} tone="teal" icon={Euro} />
        <StatCard label="Riesgo de rotura" value={`${summary.riskCount} SKU`} helper={`${summary.actionTodayCount} clase A requieren acción`} tone="red" icon={CircleAlert} />
        <StatCard label="Sobrestock" value={`${summary.overstockCount} SKU`} helper={`${currency.format(summary.immobilizedValue)} inmovilizados`} tone="amber" icon={Boxes} />
        <StatCard label="Cobertura media" value={`${decimal.format(summary.averageCoverage)} días`} helper="Objetivo recomendado: 35–60 días" tone="blue" icon={CalendarDays} />
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
      const matchesAbc = abcFilter === "all" || item.abcClass === abcFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQuery && matchesAbc && matchesStatus;
    });
  }, [items, query, abcFilter, statusFilter]);

  const classSummary = (["A", "B", "C"] as const).map((abcClass) => ({
    abcClass,
    count: items.filter((item) => item.abcClass === abcClass).length,
    value: items.filter((item) => item.abcClass === abcClass).reduce((sum, item) => sum + item.consumptionValue, 0),
  }));

  return (
    <div className="view-enter section-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Datos operativos</p>
          <h1>Inventario</h1>
          <p>Consulta la clasificación ABC, cobertura, rotación y nivel de riesgo.</p>
        </div>
        <button className="primary-button compact" onClick={onUpload} type="button"><Upload size={18} /> Importar CSV</button>
      </div>

      <section className="abc-summary" aria-label="Resumen de clasificación ABC">
        {classSummary.map((item) => (
          <article key={item.abcClass}>
            <span className={`abc-badge abc-${item.abcClass.toLowerCase()}`}>{item.abcClass}</span>
            <div><strong>{item.count} SKU</strong><p>{currency.format(item.value)} de consumo mensual</p></div>
          </article>
        ))}
        <div className="abc-help"><Info size={18} /><span>A concentra el mayor valor; C, el menor.</span></div>
      </section>

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
                  <td><span className={`abc-badge abc-${item.abcClass.toLowerCase()}`}>{item.abcClass}</span></td>
                  <td><span className="sku-line">{item.sku}</span><span className="product-line">{item.product}</span></td>
                  <td>{item.category}</td><td>{decimal.format(item.currentStock)}</td><td>{decimal.format(item.averageMonthlyDemand)}</td>
                  <td>{coverageLabel(item.coverageDays)}</td><td>{decimal.format(item.rotationMonthly)}×</td>
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
  const classACritical = items.filter((item) => item.status === "critical" && item.abcClass === "A").length;

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
        <div><strong>{classACritical || "Ninguna"} decisiones clase A requieren atención inmediata</strong><p>La prioridad combina cobertura, plazo de entrega, valor de consumo y stock de seguridad.</p></div>
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
  const projected = useMemo(() => simulateInventory(inventory, demand, delay), [inventory, demand, delay]);
  const impactItems = projected.items.filter((item) => item.status !== "stable").slice(0, 6);
  const signedDemand = `${demand > 0 ? "+" : ""}${demand} %`;

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
  const campaigns = createCountCampaigns(plan);
  const campaign = campaigns.find((item) => item.id === activeCampaignId) ?? campaigns[0];
  const orderedItems = useMemo(() => {
    const abcOrder = { A: 0, B: 1, C: 2 };
    return [...items].sort((a, b) => abcOrder[a.abcClass] - abcOrder[b.abcClass] || b.priorityScore - a.priorityScore);
  }, [items]);
  const metrics = useMemo(
    () => calculateCountMetrics(orderedItems, entries, plan.tolerancePct),
    [orderedItems, entries, plan.tolerancePct],
  );
  const filteredRows = metrics.rows.filter((row) => {
    if (filter === "pending") return row.physicalCount === null;
    if (filter === "discrepancies") return row.hasDiscrepancy;
    return true;
  });
  const isCompleted = completedCampaigns.includes(campaign.id);
  const formatDate = (date: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

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
        <article><span className="count-metric-icon amber"><Euro size={20} /></span><div><small>Ajuste valorado</small><strong>{currency.format(metrics.valueDifference)}</strong><p>diferencia neta estimada</p></div></article>
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
        <div className="count-guidance"><Info size={16} /><span>Orden sugerido por criticidad ABC: cuenta primero las referencias A, después B y finalmente C.</span></div>
        <div className="table-scroll">
          <table className="count-table">
            <thead><tr><th>Orden</th><th>Clase</th><th>SKU / Producto</th><th>Stock sistema</th><th>Conteo físico</th><th>Diferencia</th><th>Variación</th><th>Resultado</th></tr></thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.item.sku}>
                  <td><span className="count-order">{index + 1}</span></td>
                  <td><span className={`abc-badge abc-${row.item.abcClass.toLowerCase()}`}>{row.item.abcClass}</span></td>
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
  onClose,
  onImport,
  onDownloadTemplate,
}: {
  open: boolean;
  processing: boolean;
  errors: string[];
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  onDownloadTemplate: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onImport(file);
  };

  const dropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void onImport(file);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="upload-title" aria-modal="true" className="modal-card" role="dialog">
        <button className="modal-close" aria-label="Cerrar importación" onClick={onClose} type="button"><X size={20} /></button>
        <span className="modal-icon"><FileSpreadsheet size={26} /></span>
        <h2 id="upload-title">Analiza tu inventario</h2>
        <p>Sube un CSV y StockFlow IA calculará automáticamente ABC, cobertura, rotación y acciones recomendadas.</p>
        <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={dropFile}>
          <Upload size={30} aria-hidden="true" />
          <strong>Arrastra aquí tu archivo CSV</strong>
          <span>o selecciónalo desde tu dispositivo</span>
          <button className="primary-button compact" disabled={processing} onClick={() => inputRef.current?.click()} type="button">{processing ? <RefreshCw className="spin" size={18} /> : <Upload size={18} />}{processing ? "Analizando…" : "Seleccionar archivo"}</button>
          <input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv,.txt" onChange={selectFile} />
        </div>
        {!!errors.length && <div className="upload-errors" role="alert"><strong>Revisa el archivo:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        <div className="modal-actions">
          <button className="template-button" onClick={onDownloadTemplate} type="button"><Download size={17} /> Descargar plantilla CSV</button>
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
        <div className="drawer-meta"><span>{item.sku}</span><span>Clase {item.abcClass}</span><PriorityBadge status={item.status} label={item.statusLabel} /></div>
        <section className="decision-card">
          <span>Acción recomendada</span><strong>{item.recommendation}</strong><p>{item.situation}. La recomendación se basa en demanda, cobertura, plazo de entrega y stock de seguridad.</p>
        </section>
        <div className="detail-metrics">
          <article><span>Stock actual</span><strong>{decimal.format(item.currentStock)} ud.</strong></article>
          <article><span>Demanda media</span><strong>{decimal.format(item.averageMonthlyDemand)} ud./mes</strong></article>
          <article><span>Cobertura</span><strong>{coverageLabel(item.coverageDays)}</strong></article>
          <article><span>Punto de pedido</span><strong>{decimal.format(item.reorderPoint)} ud.</strong></article>
          <article><span>Rotación mensual</span><strong>{decimal.format(item.rotationMonthly)}×</strong></article>
          <article><span>Valor en stock</span><strong>{currency.format(item.stockValue)}</strong></article>
        </div>
        <section className="formula-card">
          <h3>Cómo se calcula</h3>
          <p><strong>Cobertura:</strong> stock actual ÷ demanda diaria media.</p>
          <p><strong>Punto de pedido:</strong> demanda durante el plazo de entrega + stock de seguridad.</p>
          <p><strong>ABC:</strong> valor de consumo acumulado de cada referencia.</p>
        </section>
      </aside>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("resumen");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inventory, setInventory] = useState<RawInventoryItem[]>(SAMPLE_INVENTORY);
  const [datasetName, setDatasetName] = useState("Inventario de demostración");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AnalyzedInventoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [countPlan, setCountPlan] = useState<CycleCountPlan>({
    clientName: "Cliente Demo Logística",
    year: 2026,
    frequency: 2,
    firstDate: "2026-04-15",
    secondDate: "2026-10-15",
    tolerancePct: 2,
  });
  const [countEntriesByCampaign, setCountEntriesByCampaign] = useState<Record<string, Record<string, string>>>({});
  const [activeCampaignId, setActiveCampaignId] = useState("2026-2");
  const [completedCampaigns, setCompletedCampaigns] = useState<string[]>(["2026-1"]);

  const analysis = useMemo(() => analyzeInventory(inventory), [inventory]);

  const navigate = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3600);
  };

  const importFile = async (file: File) => {
    setProcessing(true);
    setUploadErrors([]);
    try {
      if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".txt")) {
        setUploadErrors(["Selecciona un archivo CSV válido."]);
        return;
      }
      if (file.size > 5_000_000) {
        setUploadErrors(["El archivo supera 5 MB. Divide el inventario en un archivo más pequeño."]);
        return;
      }
      const parsed = parseInventoryCsv(await file.text());
      if (parsed.errors.length || !parsed.items.length) {
        setUploadErrors(parsed.errors.length ? parsed.errors : ["No se encontraron productos válidos."]);
        return;
      }
      setInventory(parsed.items);
      setDatasetName(file.name.replace(/\.[^.]+$/, ""));
      setCountEntriesByCampaign({});
      setCompletedCampaigns([]);
      setUploadOpen(false);
      setActiveView("resumen");
      showToast(`${parsed.items.length} referencias analizadas correctamente`);
    } catch {
      setUploadErrors(["No pudimos leer el archivo. Comprueba su formato e inténtalo de nuevo."]);
    } finally {
      setProcessing(false);
    }
  };

  const exportResults = () => {
    downloadTextFile("stockflow_analisis.csv", exportAnalysisCsv(analysis.items));
    showToast("Informe CSV preparado");
  };

  const restoreDemo = () => {
    setInventory(SAMPLE_INVENTORY);
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

        {activeView === "resumen" && <Dashboard analysis={analysis} onAnalyze={() => { setUploadErrors([]); setUploadOpen(true); }} onViewAll={() => navigate("acciones")} onSelect={setSelectedItem} />}
        {activeView === "inventario" && <InventoryView items={analysis.items} onUpload={() => { setUploadErrors([]); setUploadOpen(true); }} onExport={exportResults} onSelect={setSelectedItem} />}
        {activeView === "acciones" && <ActionsView items={analysis.items} onExport={exportResults} onSelect={setSelectedItem} />}
        {activeView === "simulador" && <SimulatorView inventory={inventory} baseline={analysis} onSelect={setSelectedItem} />}
        {activeView === "conteos" && <CyclicCountsView items={analysis.items} plan={countPlan} entries={countEntriesByCampaign[activeCampaignId] ?? {}} activeCampaignId={activeCampaignId} completedCampaigns={completedCampaigns} onPlanChange={setCountPlan} onEntryChange={(sku, value) => setCountEntriesByCampaign((current) => ({ ...current, [activeCampaignId]: { ...(current[activeCampaignId] ?? {}), [sku]: value } }))} onCampaignChange={setActiveCampaignId} onFillSample={fillCountSample} onReset={resetCount} onComplete={completeCount} onNotify={showToast} />}
      </section>

      <UploadModal open={uploadOpen} processing={processing} errors={uploadErrors} onClose={() => setUploadOpen(false)} onImport={importFile} onDownloadTemplate={() => downloadTextFile("stockflow_plantilla.csv", createTemplateCsv())} />
      <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </main>
  );
}
