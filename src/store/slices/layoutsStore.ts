import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DashboardId } from "@/models/dashboard";
import type { DashboardLayouts, LayoutBreakpoint, LayoutGrid, WidgetPlacement } from "@/models/layout";
import { createEmptyLayouts } from "@/models/layout";

interface LayoutsState {
  /** Pro Dashboard: alle Breakpoints. */
  layouts: Map<DashboardId, DashboardLayouts>;

  ensure: (dashboardId: DashboardId) => DashboardLayouts;
  setGrid: (dashboardId: DashboardId, breakpoint: LayoutBreakpoint, grid: LayoutGrid) => void;
  setPlacement: (
    dashboardId: DashboardId,
    breakpoint: LayoutBreakpoint,
    widgetId: string,
    placement: WidgetPlacement,
  ) => void;
  removePlacement: (dashboardId: DashboardId, widgetId: string) => void;
  removeDashboard: (dashboardId: DashboardId) => void;
  bulkSet: (entries: Array<{ dashboardId: DashboardId; layouts: DashboardLayouts }>) => void;

  getLayouts: (dashboardId: DashboardId) => DashboardLayouts | undefined;
  getGrid: (dashboardId: DashboardId, breakpoint: LayoutBreakpoint) => LayoutGrid | undefined;
}

export const useLayoutsStore = create<LayoutsState>()(
  subscribeWithSelector((set, get) => ({
    layouts: new Map(),

    ensure: (dashboardId) => {
      const existing = get().layouts.get(dashboardId);
      if (existing) return existing;
      const created = createEmptyLayouts();
      const next = new Map(get().layouts);
      next.set(dashboardId, created);
      set({ layouts: next });
      return created;
    },
    setGrid: (dashboardId, breakpoint, grid) => {
      const next = new Map(get().layouts);
      const cur = next.get(dashboardId) ?? createEmptyLayouts();
      next.set(dashboardId, { ...cur, [breakpoint]: grid });
      set({ layouts: next });
    },
    setPlacement: (dashboardId, breakpoint, widgetId, placement) => {
      const next = new Map(get().layouts);
      const cur = next.get(dashboardId) ?? createEmptyLayouts();
      const grid = cur[breakpoint];
      const updated: LayoutGrid = {
        ...grid,
        placements: { ...grid.placements, [widgetId]: placement },
      };
      next.set(dashboardId, { ...cur, [breakpoint]: updated });
      set({ layouts: next });
    },
    removePlacement: (dashboardId, widgetId) => {
      const next = new Map(get().layouts);
      const cur = next.get(dashboardId);
      if (!cur) return;
      const updated = { ...cur } as DashboardLayouts;
      for (const bp of Object.keys(updated) as LayoutBreakpoint[]) {
        const grid = updated[bp];
        if (!(widgetId in grid.placements)) continue;
        const { [widgetId]: _drop, ...rest } = grid.placements;
        void _drop;
        updated[bp] = { ...grid, placements: rest };
      }
      next.set(dashboardId, updated);
      set({ layouts: next });
    },
    removeDashboard: (dashboardId) => {
      const next = new Map(get().layouts);
      next.delete(dashboardId);
      set({ layouts: next });
    },
    bulkSet: (entries) => {
      const m = new Map<DashboardId, DashboardLayouts>();
      for (const e of entries) m.set(e.dashboardId, e.layouts);
      set({ layouts: m });
    },

    getLayouts: (dashboardId) => get().layouts.get(dashboardId),
    getGrid: (dashboardId, breakpoint) => get().layouts.get(dashboardId)?.[breakpoint],
  })),
);
