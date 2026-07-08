import { TypedEmitter } from "@/services/events/EventEmitter";
import type { DashboardId } from "@/models/dashboard";
import type { LayoutBreakpoint } from "@/models/layout";

export type RuntimeOverlayId =
  | "discovery"
  | "server-offline"
  | "sync"
  | "auth"
  | "update";

export interface RuntimeEventMap {
  dashboardChanged: { id: DashboardId | null };
  breakpointChanged: { breakpoint: LayoutBreakpoint };
  overlayChanged: { overlays: RuntimeOverlayId[] };
  themeChanged: { theme: "light" | "dark" };
}

export const runtimeEvents = new TypedEmitter<RuntimeEventMap>();
