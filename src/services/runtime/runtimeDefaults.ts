import type { Dashboard, DashboardId } from "@/models/dashboard";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { layoutEngine } from "@/services/dashboards/LayoutEngine";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { ALL_BREAKPOINTS } from "@/models/layout";

/**
 * Legt Standard-System-Widgets auf einem leeren Dashboard an. Idempotent.
 * Voraussetzung: registerSystemWidgets() wurde bereits aufgerufen.
 */
export function ensureRuntimeDefaults(dashboard: Dashboard): void {
  const existing = useWidgetInstancesStore.getState().byDashboard(dashboard.id);
  if (existing.length > 0) return;

  const layouts = useLayoutsStore.getState().ensure(dashboard.id);

  // Vorgeschlagene Startaufteilung (auf 8-Spalten-Grid gedacht).
  const plan: Array<{ type: string; x: number; y: number; w: number; h: number }> = [
    { type: "system.hero-greeting", x: 0, y: 0, w: 8, h: 3 },
    { type: "system.clock", x: 0, y: 3, w: 4, h: 2 },
    { type: "system.date", x: 4, y: 3, w: 4, h: 2 },
    { type: "system.server-status", x: 0, y: 5, w: 4, h: 2 },
    { type: "system.connection-status", x: 4, y: 5, w: 4, h: 2 },
    { type: "system.sync-status", x: 0, y: 7, w: 4, h: 2 },
    { type: "system.app-version", x: 4, y: 7, w: 4, h: 2 },
  ];

  const createdIds: string[] = [];

  for (const step of plan) {
    if (!widgetRegistry.has(step.type)) continue;
    const w = widgetManager.create({ dashboardId: dashboard.id, widgetType: step.type });
    if (!w) continue;
    createdIds.push(w.id);
    // Placements auf allen Breakpoints setzen (mit Spalten-Ratio).
    for (const bp of ALL_BREAKPOINTS) {
      const grid = layouts[bp];
      const ratio = grid.columns / 8;
      const p = {
        gridX: Math.max(0, Math.min(grid.columns - 1, Math.floor(step.x * ratio))),
        gridY: step.y,
        w: Math.max(1, Math.min(grid.columns, Math.round(step.w * ratio))),
        h: step.h,
      };
      // Auto-Fit falls Descriptor engere Grenzen hat.
      const desc = widgetRegistry.get(step.type);
      const fit = desc ? layoutEngine.autoFit({ w: p.w, h: p.h }, grid) : { w: p.w, h: p.h };
      const snapped = layoutEngine.snap({ ...p, w: fit.w, h: fit.h });
      useLayoutsStore.getState().setPlacement(dashboard.id, bp, w.id, snapped);
      useWidgetInstancesStore.getState().patch(w.id, {
        placements: { ...w.placements, [bp]: snapped },
      });
    }
  }

  // widgetInstanceIds im Dashboard aktualisieren.
  if (createdIds.length > 0) {
    const cur = useDashboardsStore.getState().getById(dashboard.id);
    if (cur) {
      useDashboardsStore.getState().upsert({
        ...cur,
        widgetInstanceIds: [...cur.widgetInstanceIds, ...createdIds],
      });
    }
  }
}

export function ensureRuntimeDefaultsForId(id: DashboardId): void {
  const d = useDashboardsStore.getState().getById(id);
  if (d) ensureRuntimeDefaults(d);
}
