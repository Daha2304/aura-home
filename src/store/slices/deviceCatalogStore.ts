import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeviceFilterCriteria } from "@/services/intelligence";
import type { SortDirection, SortKey } from "@/services/devices/catalog/sortStrategies";
import type { GroupKey } from "@/services/devices/catalog/groupStrategies";

export type ViewMode = "large" | "grid" | "list" | "compact";

interface DeviceCatalogState {
  view: ViewMode;
  sortKey: SortKey;
  sortDirection: SortDirection;
  group: GroupKey;
  criteria: DeviceFilterCriteria;

  setView: (v: ViewMode) => void;
  setSort: (k: SortKey, d?: SortDirection) => void;
  toggleSortDirection: () => void;
  setGroup: (g: GroupKey) => void;
  setCriteria: (c: DeviceFilterCriteria) => void;
  patchCriteria: (patch: Partial<DeviceFilterCriteria>) => void;
  reset: () => void;
}

const defaults = {
  view: "list" as ViewMode,
  sortKey: "name" as SortKey,
  sortDirection: "asc" as SortDirection,
  group: "none" as GroupKey,
  criteria: {} as DeviceFilterCriteria,
};

export const useDeviceCatalogStore = create<DeviceCatalogState>()(
  persist(
    (set, get) => ({
      ...defaults,
      setView: (view) => set({ view }),
      setSort: (sortKey, sortDirection) =>
        set({ sortKey, sortDirection: sortDirection ?? get().sortDirection }),
      toggleSortDirection: () =>
        set({ sortDirection: get().sortDirection === "asc" ? "desc" : "asc" }),
      setGroup: (group) => set({ group }),
      setCriteria: (criteria) => set({ criteria }),
      patchCriteria: (patch) => set({ criteria: { ...get().criteria, ...patch } }),
      reset: () => set(defaults),
    }),
    {
      name: "device-catalog",
      partialize: (s) => ({
        view: s.view,
        sortKey: s.sortKey,
        sortDirection: s.sortDirection,
        group: s.group,
      }),
    },
  ),
);
