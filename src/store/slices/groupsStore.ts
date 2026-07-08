import { create } from "zustand";
import type { DeviceGroup, DeviceGroupKind } from "@/models/deviceGroup";

interface GroupsState {
  groups: DeviceGroup[];
  byId: Record<string, DeviceGroup>;
  byKind: Record<string, string[]>;
  /** Cached, cycle-safe expansion of a group into concrete device ids. */
  expandedById: Record<string, string[]>;
  revision: number;

  setGroups: (g: DeviceGroup[]) => void;
  upsertGroup: (g: DeviceGroup) => void;
  removeGroup: (id: string) => void;
  reorder: (ids: string[]) => void;
  setExpanded: (id: string, deviceIds: string[]) => void;
  clearExpanded: () => void;
}

function index(list: DeviceGroup[]): {
  byId: Record<string, DeviceGroup>;
  byKind: Record<string, string[]>;
} {
  const byId: Record<string, DeviceGroup> = {};
  const byKind: Record<string, string[]> = {};
  for (const g of list) {
    byId[g.id] = g;
    (byKind[g.kind] ??= []).push(g.id);
  }
  return { byId, byKind };
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  byId: {},
  byKind: {},
  expandedById: {},
  revision: 0,

  setGroups: (groups) => {
    const { byId, byKind } = index(groups);
    set({
      groups,
      byId,
      byKind,
      expandedById: {},
      revision: get().revision + 1,
    });
  },
  upsertGroup: (g) => {
    const list = get().groups;
    const idx = list.findIndex((x) => x.id === g.id);
    const next = idx === -1 ? [...list, g] : list.map((x) => (x.id === g.id ? g : x));
    const { byId, byKind } = index(next);
    set({
      groups: next,
      byId,
      byKind,
      expandedById: {},
      revision: get().revision + 1,
    });
  },
  removeGroup: (id) => {
    const next = get().groups.filter((g) => g.id !== id);
    const { byId, byKind } = index(next);
    set({
      groups: next,
      byId,
      byKind,
      expandedById: {},
      revision: get().revision + 1,
    });
  },
  reorder: (ids) => {
    const map = get().byId;
    const next: DeviceGroup[] = [];
    ids.forEach((id, i) => {
      const g = map[id];
      if (g) next.push({ ...g, order: i });
    });
    for (const g of get().groups) if (!ids.includes(g.id)) next.push(g);
    const { byId, byKind } = index(next);
    set({ groups: next, byId, byKind, revision: get().revision + 1 });
  },
  setExpanded: (id, deviceIds) =>
    set({ expandedById: { ...get().expandedById, [id]: deviceIds } }),
  clearExpanded: () => set({ expandedById: {} }),
}));

// -------- Selectors --------
export const selectGroups = (s: GroupsState) => s.groups;
export const selectGroupById = (id: string) => (s: GroupsState) => s.byId[id];
export const selectFavoriteGroups = (s: GroupsState) => s.groups.filter((g) => g.favorite);
export const selectGroupsByKind = (k: DeviceGroupKind) => (s: GroupsState) =>
  (s.byKind[k] ?? []).map((id) => s.byId[id]).filter(Boolean) as DeviceGroup[];
