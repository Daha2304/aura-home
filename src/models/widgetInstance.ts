import type { ID } from "./common";
import type { DashboardId } from "./dashboard";
import type { LayoutBreakpoint, WidgetPlacement } from "./layout";
import type { WidgetLifecycle } from "./widgetLifecycle";
import type { WidgetAnimationConfig } from "./widgetAnimation";

export type WidgetInstanceId = ID;
export type WidgetTypeId = string;

export interface WidgetStyling {
  color?: string;
  theme?: "auto" | "light" | "dark" | "glass";
  padding?: number;
  margin?: number;
  borderRadius?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  blur?: number; // backdrop blur px
  opacity?: number; // 0..1
}

export interface WidgetDataSource {
  kind: "none" | "device" | "room" | "scene" | "group" | "query" | "static" | "custom";
  ref?: string; // ID des referenzierten Objekts
  query?: Record<string, unknown>;
}

export interface WidgetInstance {
  id: WidgetInstanceId;
  dashboardId: DashboardId;
  widgetType: WidgetTypeId;
  title?: string;
  subtitle?: string;
  icon?: string;
  layer: number; // Z-Ebene
  visible: boolean;
  animation: WidgetAnimationConfig;
  styling: WidgetStyling;
  /** Position pro Breakpoint — LayoutStore hält Placements ebenfalls, hier
   *  bleibt der Instance-Default für schnellen Zugriff. */
  placements: Partial<Record<LayoutBreakpoint, WidgetPlacement>>;
  refreshIntervalMs?: number;
  dataSource: WidgetDataSource;
  config: Record<string, unknown>;
  lifecycle: WidgetLifecycle;
  version: number;
  custom?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
