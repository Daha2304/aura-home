import { create } from "zustand";
import type { Device, DeviceGroup } from "@/models/device";

interface DevicesState {
  devices: Device[];
  groups: DeviceGroup[];
  setDevices: (d: Device[]) => void;
  upsertDevice: (d: Device) => void;
  removeDevice: (id: string) => void;
  updateOnline: (id: string, online: boolean) => void;
  setGroups: (g: DeviceGroup[]) => void;
  upsertGroup: (g: DeviceGroup) => void;
  removeGroup: (id: string) => void;
  // Selectors
  byRoom: (roomId: string) => Device[];
  byId: (id: string) => Device | undefined;
  favorites: () => Device[];
  online: () => Device[];
}

export const useDevicesStore = create<DevicesState>((set, get) => ({
  devices: [],
  groups: [],
  setDevices: (devices) => set({ devices }),
  upsertDevice: (d) => {
    const list = get().devices;
    const idx = list.findIndex((x) => x.id === d.id);
    if (idx === -1) {
      set({ devices: [...list, d] });
    } else {
      const next = list.slice();
      next[idx] = { ...list[idx], ...d };
      set({ devices: next });
    }
  },
  removeDevice: (id) =>
    set({ devices: get().devices.filter((d) => d.id !== id) }),
  updateOnline: (id, online) =>
    set({
      devices: get().devices.map((d) =>
        d.id === id ? { ...d, online, lastSeen: Date.now() } : d,
      ),
    }),
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
  byRoom: (roomId) => get().devices.filter((d) => d.roomId === roomId),
  byId: (id) => get().devices.find((d) => d.id === id),
  favorites: () => get().devices.filter((d) => d.favorite),
  online: () => get().devices.filter((d) => d.online),
}));
