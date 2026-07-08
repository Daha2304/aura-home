import { createLogger } from "@/services/logger/Logger";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createId } from "@/utils/ids";
import { canTransitionWidget } from "@/models/widgetLifecycle";
import type { WidgetLifecycle } from "@/models/widgetLifecycle";
import type { WidgetInstance, WidgetInstanceId, WidgetTypeId } from "@/models/widgetInstance";
import type { DashboardId } from "@/models/dashboard";
import type { LayoutBreakpoint, WidgetPlacement } from "@/models/layout";
import { DEFAULT_ANIMATION } from "@/models/widgetAnimation";
import { widgetRegistry } from "./WidgetRegistry";
import { dashboardEvents } from "@/services/dashboards/DashboardEvents";
import { layoutEngine } from "@/services/dashboards/LayoutEngine";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";

const log = createLogger("widget-manager");

const CURRENT_INSTANCE_VERSION = 1;

/** Migrationen alter Instance-Schemata auf CURRENT_INSTANCE_VERSION. */
const INSTANCE_MIGRATIONS: Record<number, (w: WidgetInstance) => WidgetInstance> = {};

export interface CreateWidgetInput {
  dashboardId: DashboardId;
  widgetType: WidgetTypeId;
  overrides?: Partial<Omit<WidgetInstance, "id" | "dashboardId" | "widgetType">>;
}

class WidgetManagerImpl {
  create(input: CreateWidgetInput): WidgetInstance | null {
    const descriptor = widgetRegistry.get(input.widgetType);
    if (!descriptor) {
      errorBus.report(
        new AppError("invalid_message", `Unbekannter Widget-Typ: ${input.widgetType}`, {
          code: "unknown_widget_type",
        }),
      );
      return null;
    }
    const now = Date.now();
    const id = createId("wi");
    const defaults = descriptor.createDefaults?.() ?? {};
    const widget: WidgetInstance = {
      id,
      dashboardId: input.dashboardId,
      widgetType: descriptor.id,
      title: descriptor.name,
      icon: descriptor.icon,
      layer: 0,
      visible: true,
      animation: DEFAULT_ANIMATION,
      styling: {},
      placements: {},
      dataSource: { kind: "none" },
      config: {},
      lifecycle: "new",
      version: CURRENT_INSTANCE_VERSION,
      createdAt: now,
      updatedAt: now,
      ...defaults,
      ...input.overrides,
    };
    useWidgetInstancesStore.getState().upsert(widget);
    dashboardEvents.emit("widgetCreated", { widget });
    log.debug("created", widget.id, widget.widgetType);
    return widget;
  }

  update(id: WidgetInstanceId, patch: Partial<WidgetInstance>): void {
    const cur = useWidgetInstancesStore.getState().getById(id);
    if (!cur) return;
    useWidgetInstancesStore.getState().patch(id, patch);
    const next = useWidgetInstancesStore.getState().getById(id);
    if (next) dashboardEvents.emit("widgetUpdated", { widget: next });
  }

  remove(id: WidgetInstanceId): void {
    const cur = useWidgetInstancesStore.getState().getById(id);
    if (!cur) return;
    useLayoutsStore.getState().removePlacement(cur.dashboardId, id);
    useWidgetInstancesStore.getState().remove(id);
    dashboardEvents.emit("widgetDeleted", { id, dashboardId: cur.dashboardId });
  }

  duplicate(id: WidgetInstanceId): WidgetInstance | null {
    const cur = useWidgetInstancesStore.getState().getById(id);
    if (!cur) return null;
    return this.create({
      dashboardId: cur.dashboardId,
      widgetType: cur.widgetType,
      overrides: {
        title: cur.title ? `${cur.title} (Kopie)` : undefined,
        subtitle: cur.subtitle,
        icon: cur.icon,
        layer: cur.layer,
        visible: cur.visible,
        animation: cur.animation,
        styling: { ...cur.styling },
        placements: { ...cur.placements },
        dataSource: { ...cur.dataSource },
        config: { ...cur.config },
      },
    });
  }

  move(
    id: WidgetInstanceId,
    breakpoint: LayoutBreakpoint,
    placement: WidgetPlacement,
  ): void {
    const cur = useWidgetInstancesStore.getState().getById(id);
    if (!cur) return;
    const snapped = layoutEngine.snap(placement);
    useLayoutsStore.getState().setPlacement(cur.dashboardId, breakpoint, id, snapped);
    useWidgetInstancesStore.getState().patch(id, {
      placements: { ...cur.placements, [breakpoint]: snapped },
    });
    dashboardEvents.emit("widgetMoved", {
      id,
      dashboardId: cur.dashboardId,
      breakpoint,
      placement: snapped,
    });
    dashboardEvents.emit("layoutChanged", { dashboardId: cur.dashboardId, breakpoint });
  }

  resize(
    id: WidgetInstanceId,
    breakpoint: LayoutBreakpoint,
    placement: WidgetPlacement,
  ): void {
    const cur = useWidgetInstancesStore.getState().getById(id);
    if (!cur) return;
    const snapped = layoutEngine.snap(placement);
    useLayoutsStore.getState().setPlacement(cur.dashboardId, breakpoint, id, snapped);
    useWidgetInstancesStore.getState().patch(id, {
      placements: { ...cur.placements, [breakpoint]: snapped },
    });
    dashboardEvents.emit("widgetResized", {
      id,
      dashboardId: cur.dashboardId,
      breakpoint,
      placement: snapped,
    });
    dashboardEvents.emit("layoutChanged", { dashboardId: cur.dashboardId, breakpoint });
  }

  setLifecycle(id: WidgetInstanceId, next: WidgetLifecycle): boolean {
    const cur = useWidgetInstancesStore.getState().getById(id);
    if (!cur) return false;
    if (!canTransitionWidget(cur.lifecycle, next)) {
      log.debug("blocked lifecycle transition", cur.lifecycle, "→", next);
      return false;
    }
    this.update(id, { lifecycle: next });
    return true;
  }

  /** Import einer Instance-Liste (z. B. aus Backup); wendet Migrationen an. */
  import(list: WidgetInstance[]): WidgetInstance[] {
    const migrated = list.map((w) => this.migrateInstance(w)).filter((w): w is WidgetInstance => !!w);
    for (const w of migrated) useWidgetInstancesStore.getState().upsert(w);
    return migrated;
  }

  export(dashboardId?: DashboardId): WidgetInstance[] {
    const all = Array.from(useWidgetInstancesStore.getState().instances.values());
    return dashboardId ? all.filter((w) => w.dashboardId === dashboardId) : all;
  }

  private migrateInstance(w: WidgetInstance): WidgetInstance | null {
    let cur = w;
    while (cur.version < CURRENT_INSTANCE_VERSION) {
      const m = INSTANCE_MIGRATIONS[cur.version];
      if (!m) {
        errorBus.report(
          new AppError("parse", `Widget-Instance ${w.id}: keine Migration ${cur.version}`, {
            code: "widget_migration_missing",
          }),
        );
        return null;
      }
      cur = m(cur);
    }
    return cur;
  }
}

export const widgetManager = new WidgetManagerImpl();
export const WIDGET_INSTANCE_VERSION = CURRENT_INSTANCE_VERSION;
