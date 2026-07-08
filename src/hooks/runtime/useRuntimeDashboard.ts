import { useMemo } from "react";
import type { DashboardId } from "@/models/dashboard";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { layoutEngine } from "@/services/dashboards/LayoutEngine";
import { useBreakpoint } from "./useBreakpoint";
import type { WidgetInstance } from "@/models/widgetInstance";
import type { WidgetPlacement } from "@/models/layout";

export interface RuntimeWidgetView {
  instance: WidgetInstance;
  placement: WidgetPlacement;
}

/**
 * Bündelt Dashboard, sichtbare Widgets + aufgelöste Placements für den
 * aktuellen Breakpoint.
 */
export function useRuntimeDashboard(dashboardId: DashboardId | null | undefined) {
  const dashboard = useDashboardsStore((s) => (dashboardId ? s.dashboards.get(dashboardId) : undefined));
  const instances = useWidgetInstancesStore((s) => s.instances);
  const layouts = useLayoutsStore((s) => s.layouts);
  const breakpoint = useBreakpoint();

  const widgets: RuntimeWidgetView[] = useMemo(() => {
    if (!dashboard) return [];
    const gridLayouts = layouts.get(dashboard.id);
    const grid = gridLayouts?.[breakpoint];
    const result: RuntimeWidgetView[] = [];
    for (const wid of dashboard.widgetInstanceIds) {
      const inst = instances.get(wid);
      if (!inst || !inst.visible) continue;
      const placement =
        grid?.placements[inst.id] ??
        layoutEngine.resolvePlacement(inst.placements, breakpoint) ?? {
          gridX: 0,
          gridY: 0,
          w: 2,
          h: 2,
        };
      result.push({ instance: inst, placement });
    }
    // Fallback: falls widgetInstanceIds leer, aber Instanzen existieren, alle vom Dashboard.
    if (result.length === 0) {
      for (const inst of instances.values()) {
        if (inst.dashboardId !== dashboard.id || !inst.visible) continue;
        const placement =
          grid?.placements[inst.id] ??
          layoutEngine.resolvePlacement(inst.placements, breakpoint) ?? {
            gridX: 0,
            gridY: 0,
            w: 2,
            h: 2,
          };
        result.push({ instance: inst, placement });
      }
    }
    return result;
  }, [dashboard, instances, layouts, breakpoint]);

  const grid = useMemo(() => {
    if (!dashboard) return undefined;
    return layouts.get(dashboard.id)?.[breakpoint];
  }, [dashboard, layouts, breakpoint]);

  return { dashboard, widgets, breakpoint, grid };
}
