import { create } from "zustand";
import type { Device, DeviceGroup } from "@/models/device";
import type { CapabilityFlag } from "@/models/deviceCapability";
import type { DeviceCategory } from "@/models/deviceCategory";
import type { DeviceTypeId } from "@/models/deviceType";
import type { LifecycleState } from "@/models/deviceLifecycle";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";

interface DevicesState {
  devices: Device[];
  groups: DeviceGroup[];
  /** O(1)-Lookup — wird bei jeder Mutation aktualisiert. */
  index: Map<string, Device>;
  /** Monotoner Zähler, primär für Debug/Devtools. */
  revision: number;

  setDevices: (d: Device[]) => void;
  upsertDevice: (d: Device) => void;
  removeDevice: (id: string) => void;
  updateOnline: (id: string, online: boolean) => void;

  setGroups: (g: DeviceGroup[]) => void;
  upsertGroup: (g: DeviceGroup) => void;
  removeGroup: (id: string) => void;

  // Selectors
  byId: (id: string) => Device | undefined;
  byRoom: (roomId: string) => Device[];
  byType: (type: DeviceTypeId) => Device[];
  byCategory: (category: DeviceCategory) => Device[];
  byLifecycle: (state: LifecycleState) => Device[];
  byCapability: (flag: CapabilityFlag) => Device[];
  favorites: () => Device[];
  online: () => Device[];
}

function rebuildIndex(devices: Device[]): Map<string, Device> {
  const m = new Map<string, Device>();
  for (const d of devices) m.set(d.id, d);
  return m;
}

function effectiveFlags(d: Device): readonly CapabilityFlag[] {
  return d.capabilityFlags ?? deviceRegistry.getCapabilities(d.type);
}

export const useDevicesStore = create<DevicesState>((set, get) => ({
  devices: [],
  groups: [],
  index: new Map(),
  revision: 0,

  setDevices: (devices) =>
    set({
      devices,
      index: rebuildIndex(devices),
      revision: get().revision + 1,
    }),

  upsertDevice: (d) => {
    const list = get().devices;
    const idx = list.findIndex((x) => x.id === d.id);
    let devices: Device[];
    let merged: Device;
    if (idx === -1) {
      merged = { ...d, version: d.version ?? 1 };
      devices = [...list, merged];
    } else {
      const prev = list[idx];
      merged = { ...prev, ...d, version: (prev.version ?? 0) + 1 };
      devices = list.slice();
      devices[idx] = merged;
    }
    const index = new Map(get().index);
    index.set(merged.id, merged);
    set({ devices, index, revision: get().revision + 1 });
  },

  removeDevice: (id) => {
    const list = get().devices;
    if (!list.some((d) => d.id === id)) return;
    const index = new Map(get().index);
    index.delete(id);
    set({
      devices: list.filter((d) => d.id !== id),
      index,
      revision: get().revision + 1,
    });
  },

  updateOnline: (id, online) => {
    const list = get().devices;
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return;
    const next = list.slice();
    next[idx] = { ...next[idx], online, lastSeen: Date.now() };
    const index = new Map(get().index);
    index.set(id, next[idx]);
    set({ devices: next, index, revision: get().revision + 1 });
  },

  setGroups: (groups) => set({ groups }),
  upsertGroup: (g) => {
    const list = get().groups;
    const idx = list.findIndex((x) => x.id === g.id);
    if (idx === -1) set({ groups: [...list, g] });
    else {
      const next = list.slice();
      next[idx] = g;
      set({ groups: next });
    }
  },
  removeGroup: (id) => set({ groups: get().groups.filter((g) => g.id !== id) }),

  byId: (id) => get().index.get(id),
  byRoom: (roomId) => get().devices.filter((d) => d.roomId === roomId),
  byType: (type) => get().devices.filter((d) => d.type === type),
  byCategory: (category) => {
    const ids = new Set(deviceRegistry.byCategory(category).map((d) => d.id));
    return get().devices.filter((d) => ids.has(d.type));
  },
  byLifecycle: (state) => get().devices.filter((d) => d.lifecycle === state),
  byCapability: (flag) =>
    get().devices.filter((d) => effectiveFlags(d).includes(flag)),
  favorites: () => get().devices.filter((d) => d.favorite),
  online: () => get().devices.filter((d) => d.online),
}));
