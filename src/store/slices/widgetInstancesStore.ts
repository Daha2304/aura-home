import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { DashboardId } from "@/models/dashboard";
import type { WidgetInstance, WidgetInstanceId, WidgetTypeId } from "@/models/widgetInstance";
import type { WidgetLifecycle } from "@/models/widgetLifecycle";

interface WidgetInstancesState {
  instances: Map<WidgetInstanceId, WidgetInstance>;

  upsert: (w: WidgetInstance) => void;
  remove: (id: WidgetInstanceId) => void;
  bulkSet: (list: WidgetInstance[]) => void;
  patch: (id: WidgetInstanceId, patch: Partial<WidgetInstance>) => void;

  getById: (id: WidgetInstanceId) => WidgetInstance | undefined;
  byDashboard: (dashboardId: DashboardId) => WidgetInstance[];
  byType: (type: WidgetTypeId) => WidgetInstance[];
  byLifecycle: (lc: WidgetLifecycle) => WidgetInstance[];
}

export const useWidgetInstancesStore = create<WidgetInstancesState>()(
  subscribeWithSelector((set, get) => ({
    instances: new Map(),

    upsert: (w) => {
      const next = new Map(get().instances);
      next.set(w.id, w);
      set({ instances: next });
    },
    remove: (id) => {
      const next = new Map(get().instances);
      next.delete(id);
      set({ instances: next });
    },
    bulkSet: (list) => {
      const m = new Map<WidgetInstanceId, WidgetInstance>();
      for (const w of list) m.set(w.id, w);
      set({ instances: m });
    },
    patch: (id, patch) => {
      const cur = get().instances.get(id);
      if (!cur) return;
      const next = new Map(get().instances);
      next.set(id, { ...cur, ...patch, updatedAt: Date.now() });
      set({ instances: next });
    },

    getById: (id) => get().instances.get(id),
    byDashboard: (dashboardId) =>
      Array.from(get().instances.values()).filter((w) => w.dashboardId === dashboardId),
    byType: (type) =>
      Array.from(get().instances.values()).filter((w) => w.widgetType === type),
    byLifecycle: (lc) =>
      Array.from(get().instances.values()).filter((w) => w.lifecycle === lc),
  })),
);
