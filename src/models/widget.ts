import type { ID } from "./common";

export type WidgetType =
  | "favorites"
  | "quickActions"
  | "status"
  | "rooms"
  | "scenes"
  | "energy"
  | "climate"
  | "security";

export type WidgetSize = "sm" | "md" | "lg" | "xl";

export interface Widget {
  id: ID;
  type: WidgetType;
  size: WidgetSize;
  visible: boolean;
  order: number;
  config?: Record<string, unknown>;
}
