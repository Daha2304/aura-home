import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget, type WidgetDescriptor } from "@/models/widgetDescriptor";
import { History, Activity, BarChart3, Zap, Bug, ListChecks, Cpu } from "lucide-react";
import { useTimelineStore } from "@/store/slices/timelineStore";
import { useStatisticsStore } from "@/store/slices/statisticsStore";
import { useEnergyStore } from "@/store/slices/statisticsStore";
import { severityRegistry } from "@/services/timeline/SeverityRegistry";
import type { Severity } from "@/models/severity";

const ALL_LAYOUTS = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
] as const;

function severityDot(sev: Severity | undefined): string {
  if (!sev) return "bg-white/40";
  switch (sev) {
    case "success": return "bg-emerald-400";
    case "warning": return "bg-amber-400";
    case "error":
    case "critical": return "bg-red-500";
    default: return "bg-sky-400";
  }
}

function TimelineWidget() {
  const entries = useTimelineStore((s) => s.entries).slice(0, 8);
  if (entries.length === 0) {
    return (
      <div className="grid h-full place-items-center p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><History className="h-4 w-4" /> Timeline (leer)</div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-hidden p-3" aria-live="polite">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <History className="h-4 w-4" /> Timeline
      </div>
      <ul className="space-y-1.5 overflow-y-auto text-xs">
        {entries.map((e) => (
          <li key={e.id} className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${severityDot(e.severity)}`} aria-hidden />
            <span className="truncate">{e.title ?? e.kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentActivityWidget() {
  const entries = useTimelineStore((s) => s.entries).slice(0, 5);
  return (
    <div className="h-full p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-4 w-4" /> Letzte Aktivität
      </div>
      {entries.length === 0 ? (
        <div className="text-xs text-muted-foreground">Noch keine Ereignisse.</div>
      ) : (
        <ul className="space-y-1 text-xs">
          {entries.map((e) => (
            <li key={e.id} className="truncate">
              <span className="text-muted-foreground">{severityRegistry.get(e.severity ?? "info").label}:</span>{" "}
              {e.title ?? e.kind}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatisticsWidget() {
  const items = useStatisticsStore((s) => Object.values(s.snapshots)).slice(0, 4);
  return (
    <div className="h-full p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="h-4 w-4" /> Kennzahlen
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">Wird berechnet…</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((s) => (
            <div key={s.id} className="rounded-xl bg-white/5 p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-lg font-semibold">{s.value}{s.unit ? ` ${s.unit}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EnergyWidget() {
  const items = useEnergyStore((s) => Object.values(s.entries));
  return (
    <div className="h-full p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-4 w-4" /> Energie
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground">Vorbereitet (Teil 10).</div>
      ) : (
        <div className="text-lg font-semibold">
          {items.reduce((n, e) => n + e.energyWh, 0)} Wh
        </div>
      )}
    </div>
  );
}

function AutomationDebugWidget() {
  const traces = useTimelineStore((s) =>
    s.entries.filter((e) => e.kind.startsWith("debug.")),
  ).slice(0, 6);
  return (
    <div className="h-full p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Bug className="h-4 w-4" /> Automation-Debug
      </div>
      {traces.length === 0 ? (
        <div className="text-xs text-muted-foreground">Keine Traces.</div>
      ) : (
        <ul className="space-y-1 text-xs">
          {traces.map((t) => <li key={t.id} className="truncate">{t.title}</li>)}
        </ul>
      )}
    </div>
  );
}

function ExecutionHistoryWidget() {
  const entries = useTimelineStore((s) =>
    s.entries.filter((e) =>
      (e.source === "automation" || e.source === "scene") &&
      (e.kind === "completed" || e.kind === "failed"),
    ),
  ).slice(0, 6);
  return (
    <div className="h-full p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <ListChecks className="h-4 w-4" /> Ausführungen
      </div>
      {entries.length === 0 ? (
        <div className="text-xs text-muted-foreground">Noch keine Ausführungen.</div>
      ) : (
        <ul className="space-y-1 text-xs">
          {entries.map((e) => <li key={e.id} className="truncate">{e.title}</li>)}
        </ul>
      )}
    </div>
  );
}

function SystemStatusWidget() {
  const errors = useTimelineStore((s) =>
    s.entries.filter((e) => e.severity === "error" || e.severity === "critical"),
  ).length;
  return (
    <div className="h-full p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Cpu className="h-4 w-4" /> System
      </div>
      <div className="text-lg font-semibold">{errors} Fehler</div>
      <div className="text-xs text-muted-foreground">seit App-Start</div>
    </div>
  );
}

const descriptors: WidgetDescriptor[] = [
  defineWidget({
    id: "timeline",
    name: "Timeline",
    category: "system",
    description: "Zentrale Ereignis-Timeline (alle Quellen).",
    icon: "history",
    defaultSize: { w: 6, h: 4 }, minSize: { w: 4, h: 3 }, maxSize: { w: 12, h: 8 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <TimelineWidget />,
  }),
  defineWidget({
    id: "recent.activity",
    name: "Letzte Aktivität",
    category: "system",
    description: "Kompakter Ausschnitt der letzten Ereignisse.",
    icon: "activity",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 5 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <RecentActivityWidget />,
  }),
  defineWidget({
    id: "statistics",
    name: "Statistik",
    category: "statistics",
    description: "Aggregierte Kennzahlen aus der StatisticsRegistry.",
    icon: "bar-chart-3",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 4 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <StatisticsWidget />,
  }),
  defineWidget({
    id: "energy",
    name: "Energie",
    category: "energy",
    description: "Energieverbrauch (Vorbereitung).",
    icon: "zap",
    defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 4 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <EnergyWidget />,
  }),
  defineWidget({
    id: "automation.debug",
    name: "Automation-Debug",
    category: "automations",
    description: "Debug-Traces des AutomationDebuggers.",
    icon: "bug",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 6 },
    supportedLayouts: ["tablet-portrait", "tablet-landscape", "desktop"],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <AutomationDebugWidget />,
  }),
  defineWidget({
    id: "execution.history",
    name: "Ausführungshistorie",
    category: "system",
    description: "Abgeschlossene Szenen- und Automation-Läufe.",
    icon: "list-checks",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <ExecutionHistoryWidget />,
  }),
  defineWidget({
    id: "system.status",
    name: "Systemstatus",
    category: "system",
    description: "Kompakter System-Zustand (Fehler seit Start).",
    icon: "cpu",
    defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 3 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <SystemStatusWidget />,
  }),
];

let registered = false;
export function registerAnalyticsWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const ANALYTICS_WIDGET_IDS = descriptors.map((d) => d.id);
