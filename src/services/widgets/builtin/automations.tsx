import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget, type WidgetDescriptor } from "@/models/widgetDescriptor";
import { Play, Star, Workflow, Activity, History } from "lucide-react";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import {
  useAutomationExecutionsStore,
  selectLatestAutomationExecution,
} from "@/store/slices/automationExecutionsStore";
import { automationExecutor } from "@/services/automations";

function AutomationButtonWidget({ automationId }: { automationId?: string }) {
  const a = useAutomationsStore((s) => (automationId ? s.byId[automationId] : undefined));
  const latest = useAutomationExecutionsStore(selectLatestAutomationExecution(automationId ?? ""));
  if (!a) {
    return (
      <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">
        Automation wählen
      </div>
    );
  }
  const running = latest?.status === "running" || latest?.status === "planned";
  return (
    <button
      type="button"
      onClick={() => automationExecutor.run(a.id, { triggerId: "manual" })}
      disabled={running || !a.enabled}
      className="flex h-full w-full flex-col items-start justify-between p-4 text-left"
      aria-label={`Automation ${a.name} ausführen`}
    >
      <div className="inline-grid h-10 w-10 place-items-center rounded-2xl bg-accent/20 text-accent">
        <Workflow className="h-5 w-5" />
      </div>
      <div>
        <div className="text-base font-semibold">{a.name}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Play className="h-3 w-3" /> {running ? "läuft…" : a.enabled ? "tippen zum Auslösen" : "deaktiviert"}
        </div>
      </div>
    </button>
  );
}

function AutomationStatusWidget() {
  const active = useAutomationExecutionsStore((s) => s.active);
  const total = useAutomationsStore((s) => s.automations.filter((a) => a.enabled && !a.archived).length);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" /> Automationen
      </div>
      <div>
        <div className="text-3xl font-semibold">{active.length}</div>
        <div className="text-xs text-muted-foreground">laufend · {total} aktiv</div>
      </div>
    </div>
  );
}

function AutomationFavoritesWidget() {
  const favs = useAutomationsStore((s) => s.automations.filter((a) => a.favorite));
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4" /> Automation-Favoriten
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {favs.length === 0 && <div className="text-xs text-muted-foreground">Keine Favoriten</div>}
        {favs.slice(0, 4).map((a) => (
          <button
            key={a.id}
            onClick={() => automationExecutor.run(a.id, { triggerId: "manual" })}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/5"
          >
            <Workflow className="h-3.5 w-3.5 text-accent" />
            <span className="truncate">{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AutomationRunningWidget() {
  const active = useAutomationExecutionsStore((s) => s.active);
  const byId = useAutomationsStore((s) => s.byId);
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" /> Aktiv
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {active.length === 0 && <div className="text-xs text-muted-foreground">Keine laufenden Automationen</div>}
        {active.slice(0, 4).map((e) => {
          const a = byId[e.automationId];
          const total = e.progress.total;
          const done = e.progress.completed + e.progress.failed + e.progress.cancelled;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={e.id} className="rounded-lg px-2 py-1 text-sm">
              <div className="truncate">{a?.name ?? e.automationId}</div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AutomationTimelineWidget() {
  // Timeline UI folgt in Teil 10; Widget bleibt registriert als Placeholder.
  return (
    <div className="grid h-full place-items-center p-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4" /> Timeline (vorbereitet)
      </div>
    </div>
  );
}

const descriptors: WidgetDescriptor[] = [
  defineWidget({
    id: "automation.button",
    name: "Automation-Button",
    category: "automations",
    description: "Löst eine Automation manuell aus.",
    icon: "workflow",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: ["phone-portrait", "phone-landscape", "tablet-portrait", "tablet-landscape", "desktop"],
    settings: [{ key: "automationId", label: "Automation", type: "custom" }],
    capabilities: ["themeable", "movable", "resizable", "configurable"],
    version: 1,
    render: ({ instance }) => (
      <AutomationButtonWidget automationId={instance.config?.automationId as string | undefined} />
    ),
  }),
  defineWidget({
    id: "automation.status",
    name: "Automation-Status",
    category: "automations",
    description: "Anzahl laufender und aktiver Automationen.",
    icon: "activity",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: ["phone-portrait", "phone-landscape", "tablet-portrait", "tablet-landscape", "desktop"],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <AutomationStatusWidget />,
  }),
  defineWidget({
    id: "automation.favorites",
    name: "Automation-Favoriten",
    category: "automations",
    description: "Bevorzugte Automationen im Schnellzugriff.",
    icon: "star",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 4 },
    supportedLayouts: ["phone-portrait", "phone-landscape", "tablet-portrait", "tablet-landscape", "desktop"],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <AutomationFavoritesWidget />,
  }),
  defineWidget({
    id: "automation.running",
    name: "Laufende Automationen",
    category: "automations",
    description: "Live-Fortschritt aktueller Ausführungen.",
    icon: "activity",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 4 },
    supportedLayouts: ["phone-portrait", "phone-landscape", "tablet-portrait", "tablet-landscape", "desktop"],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <AutomationRunningWidget />,
  }),
  defineWidget({
    id: "automation.timeline",
    name: "Automation-Timeline",
    category: "automations",
    description: "Vorbereitet für Teil 10.",
    icon: "history",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 12, h: 6 },
    supportedLayouts: ["tablet-portrait", "tablet-landscape", "desktop"],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <AutomationTimelineWidget />,
  }),
];

let registered = false;
export function registerAutomationWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const AUTOMATION_WIDGET_IDS = descriptors.map((d) => d.id);
