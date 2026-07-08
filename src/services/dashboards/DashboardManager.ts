import { createLogger } from "@/services/logger/Logger";
import { createId } from "@/utils/ids";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import type { Dashboard, DashboardId } from "@/models/dashboard";
import { createDashboard } from "@/models/dashboard";
import type { DashboardLayouts } from "@/models/layout";
import { createEmptyLayouts } from "@/models/layout";
import type { WidgetInstance } from "@/models/widgetInstance";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { dashboardEvents } from "./DashboardEvents";
import { dashboardCache } from "./DashboardCache";
import { widgetManager } from "@/services/widgets/WidgetManager";

const log = createLogger("dashboard-manager");

const DASHBOARD_SCHEMA = 1;

export interface DashboardExport {
  schemaVersion: number;
  dashboard: Dashboard;
  widgets: WidgetInstance[];
  layouts: DashboardLayouts;
}

class DashboardManagerImpl {
  create(input: Partial<Dashboard> & { name: string }): Dashboard {
    const id = input.id ?? createId("dash");
    const order = useDashboardsStore.getState().order.length;
    const d = createDashboard({ ...input, id, order: input.order ?? order });
    useDashboardsStore.getState().upsert(d);
    useLayoutsStore.getState().ensure(id);
    dashboardEvents.emit("dashboardCreated", { dashboard: d });
    this.persist();
    return d;
  }

  update(id: DashboardId, patch: Partial<Dashboard>): void {
    const cur = useDashboardsStore.getState().getById(id);
    if (!cur) return;
    const next: Dashboard = {
      ...cur,
      ...patch,
      id: cur.id,
      meta: { ...cur.meta, updatedAt: Date.now() },
    };
    useDashboardsStore.getState().upsert(next);
    dashboardEvents.emit("dashboardUpdated", { dashboard: next });
    this.persist();
  }

  remove(id: DashboardId): void {
    const cur = useDashboardsStore.getState().getById(id);
    if (!cur) return;
    // Widgets erst entfernen
    const widgets = useWidgetInstancesStore.getState().byDashboard(id);
    for (const w of widgets) widgetManager.remove(w.id);
    useLayoutsStore.getState().removeDashboard(id);
    useDashboardsStore.getState().remove(id);
    dashboardEvents.emit("dashboardDeleted", { id });
    this.persist();
  }

  duplicate(id: DashboardId): Dashboard | null {
    const cur = useDashboardsStore.getState().getById(id);
    if (!cur) return null;
    const newId = createId("dash");
    const copy = createDashboard({
      ...cur,
      id: newId,
      name: `${cur.name} (Kopie)`,
      order: useDashboardsStore.getState().order.length,
      widgetInstanceIds: [],
      favorite: false,
    });
    useDashboardsStore.getState().upsert(copy);
    useLayoutsStore.getState().ensure(newId);
    // Widgets kopieren
    const widgets = useWidgetInstancesStore.getState().byDashboard(id);
    const idMap = new Map<string, string>();
    for (const w of widgets) {
      const created = widgetManager.create({
        dashboardId: newId,
        widgetType: w.widgetType,
        overrides: {
          title: w.title,
          subtitle: w.subtitle,
          icon: w.icon,
          layer: w.layer,
          visible: w.visible,
          animation: w.animation,
          styling: { ...w.styling },
          placements: { ...w.placements },
          dataSource: { ...w.dataSource },
          config: { ...w.config },
        },
      });
      if (created) idMap.set(w.id, created.id);
    }
    // Layouts kopieren + IDs mappen
    const srcLayouts = useLayoutsStore.getState().getLayouts(id);
    if (srcLayouts) {
      const cloned = JSON.parse(JSON.stringify(srcLayouts)) as DashboardLayouts;
      for (const bp of Object.keys(cloned) as (keyof DashboardLayouts)[]) {
        const grid = cloned[bp];
        const remapped: typeof grid.placements = {};
        for (const [oldId, p] of Object.entries(grid.placements)) {
          const newWid = idMap.get(oldId);
          if (newWid) remapped[newWid] = p;
        }
        grid.placements = remapped;
        useLayoutsStore.getState().setGrid(newId, bp, grid);
      }
    }
    dashboardEvents.emit("dashboardCreated", { dashboard: copy });
    this.persist();
    return copy;
  }

  export(id: DashboardId): DashboardExport | null {
    const d = useDashboardsStore.getState().getById(id);
    if (!d) return null;
    const widgets = useWidgetInstancesStore.getState().byDashboard(id);
    const layouts = useLayoutsStore.getState().getLayouts(id) ?? createEmptyLayouts();
    return { schemaVersion: DASHBOARD_SCHEMA, dashboard: d, widgets, layouts };
  }

  import(payload: unknown): Dashboard | null {
    if (!payload || typeof payload !== "object") {
      errorBus.report(new AppError("parse", "Import: ungültige Datenstruktur", { code: "invalid_import" }));
      return null;
    }
    const p = payload as Partial<DashboardExport>;
    if (!p.dashboard || !p.layouts) {
      errorBus.report(new AppError("parse", "Import: fehlende Felder", { code: "invalid_import" }));
      return null;
    }
    const newId = createId("dash");
    const d = createDashboard({
      ...p.dashboard,
      id: newId,
      order: useDashboardsStore.getState().order.length,
    });
    useDashboardsStore.getState().upsert(d);
    // Widgets importieren mit ID-Remap
    const idMap = new Map<string, string>();
    for (const w of p.widgets ?? []) {
      const created = widgetManager.create({
        dashboardId: newId,
        widgetType: w.widgetType,
        overrides: {
          title: w.title,
          subtitle: w.subtitle,
          icon: w.icon,
          layer: w.layer,
          visible: w.visible,
          animation: w.animation,
          styling: w.styling,
          placements: w.placements,
          dataSource: w.dataSource,
          config: w.config,
        },
      });
      if (created) idMap.set(w.id, created.id);
    }
    // Layouts + ID-Remap
    for (const bp of Object.keys(p.layouts) as (keyof DashboardLayouts)[]) {
      const grid = p.layouts[bp];
      if (!grid) continue;
      const remapped: typeof grid.placements = {};
      for (const [oldId, plc] of Object.entries(grid.placements)) {
        const newWid = idMap.get(oldId);
        if (newWid) remapped[newWid] = plc;
      }
      useLayoutsStore.getState().setGrid(newId, bp, { ...grid, placements: remapped });
    }
    dashboardEvents.emit("dashboardCreated", { dashboard: d });
    this.persist();
    return d;
  }

  activate(id: DashboardId | null): void {
    if (id && !useDashboardsStore.getState().getById(id)) return;
    useDashboardsStore.getState().setActive(id);
    dashboardEvents.emit("dashboardSelected", { id });
    this.persist();
  }

  reorder(ids: DashboardId[]): void {
    useDashboardsStore.getState().setOrder(ids);
    // order-Feld synchron halten
    ids.forEach((id, order) => {
      const d = useDashboardsStore.getState().getById(id);
      if (d && d.order !== order) {
        useDashboardsStore.getState().upsert({ ...d, order });
      }
    });
    dashboardEvents.emit("dashboardReordered", { order: ids });
    this.persist();
  }

  hydrate(): void {
    const snap = dashboardCache.hydrate();
    if (!snap) return;
    useDashboardsStore.getState().bulkSet(snap.dashboards, snap.order, snap.activeId);
    useWidgetInstancesStore.getState().bulkSet(widgetManager.import(snap.widgets));
    const grouped = new Map<DashboardId, DashboardLayouts>();
    for (const entry of snap.layouts) {
      let l = grouped.get(entry.dashboardId);
      if (!l) {
        l = createEmptyLayouts();
        grouped.set(entry.dashboardId, l);
      }
      l[entry.breakpoint] = entry.grid;
    }
    useLayoutsStore.getState().bulkSet(
      Array.from(grouped.entries()).map(([dashboardId, layouts]) => ({ dashboardId, layouts })),
    );
    useDashboardsStore.getState().markHydrated();
    log.debug("hydrated", snap.dashboards.length, "dashboards");
  }

  /** Persistiert den aktuellen Store-Stand debounced. */
  persist(): void {
    const dashboards = Array.from(useDashboardsStore.getState().dashboards.values());
    const order = useDashboardsStore.getState().order;
    const activeId = useDashboardsStore.getState().activeId;
    const widgets = Array.from(useWidgetInstancesStore.getState().instances.values());
    const layouts: Array<{ dashboardId: DashboardId; breakpoint: keyof DashboardLayouts; grid: DashboardLayouts[keyof DashboardLayouts] }> = [];
    for (const [dashboardId, dl] of useLayoutsStore.getState().layouts) {
      for (const bp of Object.keys(dl) as (keyof DashboardLayouts)[]) {
        layouts.push({ dashboardId, breakpoint: bp, grid: dl[bp] });
      }
    }
    dashboardCache.persistDebounced({ dashboards, order, activeId, widgets, layouts });
  }

  /** Sorgt dafür, dass mindestens ein leeres "Home"-Dashboard existiert. */
  ensureBootstrapDashboard(): Dashboard {
    const existing = useDashboardsStore.getState().listOrdered();
    if (existing.length > 0) {
      if (!useDashboardsStore.getState().activeId) {
        useDashboardsStore.getState().setActive(existing[0].id);
      }
      return existing[0];
    }
    const d = this.create({ name: "Home", icon: "home", favorite: true });
    this.activate(d.id);
    return d;
  }
}

export const dashboardManager = new DashboardManagerImpl();
export const DASHBOARD_SCHEMA_VERSION = DASHBOARD_SCHEMA;
