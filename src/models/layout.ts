import type { DashboardId } from "./dashboard";

export type LayoutBreakpoint =
  | "phone-portrait"
  | "phone-landscape"
  | "tablet-portrait"
  | "tablet-landscape"
  | "desktop";

export const ALL_BREAKPOINTS: LayoutBreakpoint[] = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
];

export type LayoutMode = "grid" | "snap" | "free" | "responsive";

export interface WidgetPlacement {
  gridX: number;
  gridY: number;
  w: number;
  h: number;
  zIndex?: number;
  rotation?: number; // Grad, vorbereitet
}

export interface LayoutGrid {
  breakpoint: LayoutBreakpoint;
  mode: LayoutMode;
  columns: number;
  rowHeight: number; // px
  gap: number; // px
  placements: Record<string /* widget instance id */, WidgetPlacement>;
}

export type DashboardLayouts = Record<LayoutBreakpoint, LayoutGrid>;

export const DEFAULT_GRID_BY_BREAKPOINT: Record<LayoutBreakpoint, { columns: number; rowHeight: number; gap: number }> = {
  "phone-portrait": { columns: 4, rowHeight: 80, gap: 12 },
  "phone-landscape": { columns: 8, rowHeight: 72, gap: 12 },
  "tablet-portrait": { columns: 8, rowHeight: 88, gap: 14 },
  "tablet-landscape": { columns: 12, rowHeight: 88, gap: 14 },
  desktop: { columns: 16, rowHeight: 96, gap: 16 },
};

export function createEmptyLayout(breakpoint: LayoutBreakpoint, mode: LayoutMode = "grid"): LayoutGrid {
  const cfg = DEFAULT_GRID_BY_BREAKPOINT[breakpoint];
  return {
    breakpoint,
    mode,
    columns: cfg.columns,
    rowHeight: cfg.rowHeight,
    gap: cfg.gap,
    placements: {},
  };
}

export function createEmptyLayouts(): DashboardLayouts {
  return {
    "phone-portrait": createEmptyLayout("phone-portrait"),
    "phone-landscape": createEmptyLayout("phone-landscape"),
    "tablet-portrait": createEmptyLayout("tablet-portrait"),
    "tablet-landscape": createEmptyLayout("tablet-landscape"),
    desktop: createEmptyLayout("desktop"),
  };
}

export interface LayoutBinding {
  dashboardId: DashboardId;
  layouts: DashboardLayouts;
}
