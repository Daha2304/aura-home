import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Widget, WidgetType } from "@/models/widget";
import { createId } from "@/utils/ids";

const defaultWidgets: Widget[] = [
  { id: createId("w"), type: "favorites", size: "lg", visible: true, order: 0 },
  { id: createId("w"), type: "quickActions", size: "md", visible: true, order: 1 },
  { id: createId("w"), type: "status", size: "md", visible: true, order: 2 },
  { id: createId("w"), type: "rooms", size: "lg", visible: true, order: 3 },
  { id: createId("w"), type: "scenes", size: "md", visible: true, order: 4 },
  { id: createId("w"), type: "climate", size: "md", visible: true, order: 5 },
  { id: createId("w"), type: "energy", size: "md", visible: false, order: 6 },
  { id: createId("w"), type: "security", size: "md", visible: false, order: 7 },
];

interface DashboardState {
  widgets: Widget[];
  favoriteDeviceIds: string[];
  favoriteSceneIds: string[];
  setWidgets: (w: Widget[]) => void;
  toggleWidget: (id: string) => void;
  reorder: (ids: string[]) => void;
  resetLayout: () => void;
  addFavoriteDevice: (id: string) => void;
  removeFavoriteDevice: (id: string) => void;
  hasWidget: (type: WidgetType) => boolean;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      favoriteDeviceIds: [],
      favoriteSceneIds: [],
      setWidgets: (widgets) => set({ widgets }),
      toggleWidget: (id) =>
        set({
          widgets: get().widgets.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w,
          ),
        }),
      reorder: (ids) => {
        const map = new Map(get().widgets.map((w) => [w.id, w]));
        const next: Widget[] = ids
          .map((id, order) => {
            const w = map.get(id);
            return w ? { ...w, order } : null;
          })
          .filter((v): v is Widget => v !== null);
        set({ widgets: next });
      },
      resetLayout: () => set({ widgets: defaultWidgets }),
      addFavoriteDevice: (id) =>
        set((s) =>
          s.favoriteDeviceIds.includes(id)
            ? s
            : { favoriteDeviceIds: [...s.favoriteDeviceIds, id] },
        ),
      removeFavoriteDevice: (id) =>
        set((s) => ({
          favoriteDeviceIds: s.favoriteDeviceIds.filter((x) => x !== id),
        })),
      hasWidget: (type) => get().widgets.some((w) => w.type === type),
    }),
    {
      name: "smarthome.dashboard",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
