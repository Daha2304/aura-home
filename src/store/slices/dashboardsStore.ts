import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Dashboard, DashboardId } from "@/models/dashboard";

interface DashboardsState {
  dashboards: Map<DashboardId, Dashboard>;
  order: DashboardId[];
  activeId: DashboardId | null;
  hydrated: boolean;

  upsert: (d: Dashboard) => void;
  remove: (id: DashboardId) => void;
  setOrder: (ids: DashboardId[]) => void;
  setActive: (id: DashboardId | null) => void;
  bulkSet: (list: Dashboard[], order: DashboardId[], activeId: DashboardId | null) => void;
  markHydrated: () => void;

  // Selectors
  getById: (id: DashboardId) => Dashboard | undefined;
  listOrdered: () => Dashboard[];
  favorites: () => Dashboard[];
  visible: () => Dashboard[];
}

export const useDashboardsStore = create<DashboardsState>()(
  subscribeWithSelector((set, get) => ({
    dashboards: new Map(),
    order: [],
    activeId: null,
    hydrated: false,

    upsert: (d) => {
      const next = new Map(get().dashboards);
      const isNew = !next.has(d.id);
      next.set(d.id, d);
      const order = isNew && !get().order.includes(d.id) ? [...get().order, d.id] : get().order;
      set({ dashboards: next, order });
    },
    remove: (id) => {
      const next = new Map(get().dashboards);
      next.delete(id);
      set({
        dashboards: next,
        order: get().order.filter((x) => x !== id),
        activeId: get().activeId === id ? null : get().activeId,
      });
    },
    setOrder: (ids) => set({ order: ids }),
    setActive: (id) => set({ activeId: id }),
    bulkSet: (list, order, activeId) => {
      const m = new Map<DashboardId, Dashboard>();
      for (const d of list) m.set(d.id, d);
      set({ dashboards: m, order, activeId });
    },
    markHydrated: () => set({ hydrated: true }),

    getById: (id) => get().dashboards.get(id),
    listOrdered: () => {
      const map = get().dashboards;
      return get()
        .order.map((id) => map.get(id))
        .filter((d): d is Dashboard => !!d);
    },
    favorites: () =>
      Array.from(get().dashboards.values()).filter((d) => d.favorite && d.visibility === "visible"),
    visible: () =>
      Array.from(get().dashboards.values()).filter((d) => d.visibility === "visible"),
  })),
);
