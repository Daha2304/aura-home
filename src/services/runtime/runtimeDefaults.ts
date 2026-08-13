import type { Dashboard, DashboardId } from "@/models/dashboard";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { layoutEngine } from "@/services/dashboards/LayoutEngine";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { ALL_BREAKPOINTS } from "@/models/layout";

const STATUS_SUMMARY_TYPE = "system.status-summary";
const CLOCK_TYPE = "system.clock";
const DATE_TYPE = "system.date";
const OPENINGS_ALERT_TYPE = "system.openings-alert";
const LOW_BATTERY_TYPE = "system.low-battery";
const HEATING_CONTROL_TYPE = "system.heating-control";
const TEMPERATURE_OVERVIEW_TYPE = "system.temperature-overview";
const CLIMATE_CONTROL_TYPE = "system.climate-control";
const MOTION_SENSORS_TYPE = "system.motion-sensors";
const MARANTZ_REMOTE_TYPE = "system.marantz-remote";
const LEGACY_STATUS_TYPES = new Set([
  "system.server-status",
  "system.connection-status",
  "system.sync-status",
  "system.app-version",
]);

/**
 * Legt Standard-System-Widgets auf einem leeren Dashboard an. Idempotent.
 * Voraussetzung: registerSystemWidgets() wurde bereits aufgerufen.
 */
export function ensureRuntimeDefaults(dashboard: Dashboard): void {
  const existing = useWidgetInstancesStore.getState().byDashboard(dashboard.id);
  if (existing.length > 0) {
    ensureCompactTimeWidgets(dashboard, existing);
    ensureCompactSystemStatus(dashboard, existing);
    ensureDashboardHealthAlerts(dashboard);
    ensureDashboardClimateWidgets(dashboard);
    return;
  }

  const layouts = useLayoutsStore.getState().ensure(dashboard.id);

  // Vorgeschlagene Startaufteilung (auf 8-Spalten-Grid gedacht).
  const plan: Array<{ type: string; x: number; y: number; w: number; h: number }> = [
    { type: "system.hero-greeting", x: 0, y: 0, w: 8, h: 3 },
    { type: CLOCK_TYPE, x: 0, y: 3, w: 4, h: 1 },
    { type: DATE_TYPE, x: 4, y: 3, w: 4, h: 1 },
    { type: OPENINGS_ALERT_TYPE, x: 0, y: 4, w: 4, h: 2 },
    { type: LOW_BATTERY_TYPE, x: 4, y: 4, w: 4, h: 2 },
    { type: HEATING_CONTROL_TYPE, x: 0, y: 6, w: 4, h: 2 },
    { type: TEMPERATURE_OVERVIEW_TYPE, x: 4, y: 6, w: 4, h: 2 },
    { type: CLIMATE_CONTROL_TYPE, x: 0, y: 8, w: 8, h: 2 },
    { type: MOTION_SENSORS_TYPE, x: 0, y: 10, w: 8, h: 2 },
    { type: MARANTZ_REMOTE_TYPE, x: 0, y: 12, w: 8, h: 2 },
    { type: STATUS_SUMMARY_TYPE, x: 0, y: 14, w: 8, h: 2 },
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

function ensureCompactTimeWidgets(
  dashboard: Dashboard,
  widgets = useWidgetInstancesStore.getState().byDashboard(dashboard.id),
): void {
  const clock = widgets.find((widget) => widget.widgetType === CLOCK_TYPE);
  const date = widgets.find((widget) => widget.widgetType === DATE_TYPE);
  if (!clock && !date) return;

  const layoutsStore = useLayoutsStore.getState();
  const layouts = layoutsStore.ensure(dashboard.id);

  for (const breakpoint of ALL_BREAKPOINTS) {
    const grid = layouts[breakpoint];
    const leftWidth = Math.max(1, Math.floor(grid.columns / 2));
    const rightWidth = Math.max(1, grid.columns - leftWidth);

    if (clock) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, clock.id, {
        gridX: 0,
        gridY: 3,
        w: leftWidth,
        h: 1,
      });
    }

    if (date) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, date.id, {
        gridX: leftWidth,
        gridY: 3,
        w: rightWidth,
        h: 1,
      });
    }
  }
}

function ensureCompactSystemStatus(
  dashboard: Dashboard,
  widgets = useWidgetInstancesStore.getState().byDashboard(dashboard.id),
): void {
  const summary = widgets.find((widget) => widget.widgetType === STATUS_SUMMARY_TYPE);
  const legacy = widgets.filter((widget) => LEGACY_STATUS_TYPES.has(widget.widgetType));
  const anchor =
    summary ?? legacy.find((widget) => widget.widgetType === "system.server-status") ?? legacy[0];

  if (!anchor) return;

  const removeIds = legacy.filter((widget) => widget.id !== anchor.id).map((widget) => widget.id);
  const widgetStore = useWidgetInstancesStore.getState();
  const layoutsStore = useLayoutsStore.getState();

  if (anchor.widgetType !== STATUS_SUMMARY_TYPE) {
    widgetStore.patch(anchor.id, {
      widgetType: STATUS_SUMMARY_TYPE,
      title: "Systemstatus",
    });
  }

  for (const id of removeIds) {
    widgetStore.remove(id);
    layoutsStore.removePlacement(dashboard.id, id);
  }

  const layouts = layoutsStore.ensure(dashboard.id);
  for (const breakpoint of ALL_BREAKPOINTS) {
    const grid = layouts[breakpoint];
    layoutsStore.setPlacement(dashboard.id, breakpoint, anchor.id, {
      gridX: 0,
      gridY: 14,
      w: grid.columns,
      h: 2,
    });
  }

  const currentDashboard = useDashboardsStore.getState().getById(dashboard.id);
  if (currentDashboard) {
    useDashboardsStore.getState().upsert({
      ...currentDashboard,
      widgetInstanceIds: currentDashboard.widgetInstanceIds.filter((id) => !removeIds.includes(id)),
    });
  }
}

function ensureDashboardClimateWidgets(dashboard: Dashboard): void {
  const widgetStore = useWidgetInstancesStore.getState();
  const existing = widgetStore.byDashboard(dashboard.id);
  const createdIds: string[] = [];

  let heating = existing.find((widget) => widget.widgetType === HEATING_CONTROL_TYPE);
  let temperatures = existing.find((widget) => widget.widgetType === TEMPERATURE_OVERVIEW_TYPE);
  let climate = existing.find((widget) => widget.widgetType === CLIMATE_CONTROL_TYPE);
  let motionSensors = existing.find((widget) => widget.widgetType === MOTION_SENSORS_TYPE);
  let marantz = existing.find((widget) => widget.widgetType === MARANTZ_REMOTE_TYPE);

  if (!heating && widgetRegistry.has(HEATING_CONTROL_TYPE)) {
    heating =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: HEATING_CONTROL_TYPE }) ??
      undefined;
    if (heating) createdIds.push(heating.id);
  }

  if (!temperatures && widgetRegistry.has(TEMPERATURE_OVERVIEW_TYPE)) {
    temperatures =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: TEMPERATURE_OVERVIEW_TYPE }) ??
      undefined;
    if (temperatures) createdIds.push(temperatures.id);
  }

  if (!climate && widgetRegistry.has(CLIMATE_CONTROL_TYPE)) {
    climate =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: CLIMATE_CONTROL_TYPE }) ??
      undefined;
    if (climate) createdIds.push(climate.id);
  }

  if (!motionSensors && widgetRegistry.has(MOTION_SENSORS_TYPE)) {
    motionSensors =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: MOTION_SENSORS_TYPE }) ??
      undefined;
    if (motionSensors) createdIds.push(motionSensors.id);
  }

  if (!marantz && widgetRegistry.has(MARANTZ_REMOTE_TYPE)) {
    marantz =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: MARANTZ_REMOTE_TYPE }) ??
      undefined;
    if (marantz) createdIds.push(marantz.id);
  }

  const layoutsStore = useLayoutsStore.getState();
  const layouts = layoutsStore.ensure(dashboard.id);

  for (const breakpoint of ALL_BREAKPOINTS) {
    const grid = layouts[breakpoint];
    const leftWidth = Math.max(1, Math.floor(grid.columns / 2));
    const rightWidth = Math.max(1, grid.columns - leftWidth);

    if (heating) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, heating.id, {
        gridX: 0,
        gridY: 6,
        w: leftWidth,
        h: 2,
      });
    }

    if (temperatures) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, temperatures.id, {
        gridX: leftWidth,
        gridY: 6,
        w: rightWidth,
        h: 2,
      });
    }

    if (climate) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, climate.id, {
        gridX: 0,
        gridY: 8,
        w: grid.columns,
        h: 2,
      });
    }

    if (motionSensors) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, motionSensors.id, {
        gridX: 0,
        gridY: 10,
        w: grid.columns,
        h: 2,
      });
    }

    if (marantz) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, marantz.id, {
        gridX: 0,
        gridY: 12,
        w: grid.columns,
        h: 2,
      });
    }
  }

  if (createdIds.length > 0) {
    const currentDashboard = useDashboardsStore.getState().getById(dashboard.id);
    if (currentDashboard) {
      useDashboardsStore.getState().upsert({
        ...currentDashboard,
        widgetInstanceIds: [...currentDashboard.widgetInstanceIds, ...createdIds],
      });
    }
  }
}

function ensureDashboardHealthAlerts(dashboard: Dashboard): void {
  const widgetStore = useWidgetInstancesStore.getState();
  const existing = widgetStore.byDashboard(dashboard.id);
  const createdIds: string[] = [];

  let openings = existing.find((widget) => widget.widgetType === OPENINGS_ALERT_TYPE);
  let lowBattery = existing.find((widget) => widget.widgetType === LOW_BATTERY_TYPE);

  if (!openings && widgetRegistry.has(OPENINGS_ALERT_TYPE)) {
    openings =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: OPENINGS_ALERT_TYPE }) ??
      undefined;
    if (openings) createdIds.push(openings.id);
  }

  if (!lowBattery && widgetRegistry.has(LOW_BATTERY_TYPE)) {
    lowBattery =
      widgetManager.create({ dashboardId: dashboard.id, widgetType: LOW_BATTERY_TYPE }) ??
      undefined;
    if (lowBattery) createdIds.push(lowBattery.id);
  }

  const layoutsStore = useLayoutsStore.getState();
  const layouts = layoutsStore.ensure(dashboard.id);

  for (const breakpoint of ALL_BREAKPOINTS) {
    const grid = layouts[breakpoint];
    const leftWidth = Math.max(1, Math.floor(grid.columns / 2));
    const rightWidth = Math.max(1, grid.columns - leftWidth);

    if (openings) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, openings.id, {
        gridX: 0,
        gridY: 4,
        w: leftWidth,
        h: 2,
      });
    }

    if (lowBattery) {
      layoutsStore.setPlacement(dashboard.id, breakpoint, lowBattery.id, {
        gridX: leftWidth,
        gridY: 4,
        w: rightWidth,
        h: 2,
      });
    }
  }

  if (createdIds.length > 0) {
    const currentDashboard = useDashboardsStore.getState().getById(dashboard.id);
    if (currentDashboard) {
      useDashboardsStore.getState().upsert({
        ...currentDashboard,
        widgetInstanceIds: [...currentDashboard.widgetInstanceIds, ...createdIds],
      });
    }
  }
}

export function ensureRuntimeDefaultsForId(id: DashboardId): void {
  const d = useDashboardsStore.getState().getById(id);
  if (d) ensureRuntimeDefaults(d);
}
