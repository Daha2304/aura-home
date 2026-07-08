import type { Dashboard, DashboardId } from "./dashboard";
import type { LayoutBreakpoint, WidgetPlacement } from "./layout";
import type { WidgetInstance, WidgetInstanceId } from "./widgetInstance";

export interface DashboardEventMap {
  dashboardCreated: { dashboard: Dashboard };
  dashboardDeleted: { id: DashboardId };
  dashboardUpdated: { dashboard: Dashboard };
  dashboardSelected: { id: DashboardId | null };
  dashboardReordered: { order: DashboardId[] };
  widgetCreated: { widget: WidgetInstance };
  widgetDeleted: { id: WidgetInstanceId; dashboardId: DashboardId };
  widgetMoved: {
    id: WidgetInstanceId;
    dashboardId: DashboardId;
    breakpoint: LayoutBreakpoint;
    placement: WidgetPlacement;
  };
  widgetResized: {
    id: WidgetInstanceId;
    dashboardId: DashboardId;
    breakpoint: LayoutBreakpoint;
    placement: WidgetPlacement;
  };
  widgetUpdated: { widget: WidgetInstance };
  layoutChanged: { dashboardId: DashboardId; breakpoint: LayoutBreakpoint };
  registryChanged: void;
}
