import { create } from "zustand";
import type { Device } from "@/models/device";

interface DevicesState {
  devices: Device[];
  setDevices: (d: Device[]) => void;
  upsertDevice: (d: Device) => void;
  removeDevice: (id: string) => void;
  updateOnline: (id: string, online: boolean) => void;
  byRoom: (roomId: string) => Device[];
}

export const useDevicesStore = create<DevicesState>((set, get) => ({
  devices: [],
  setDevices: (devices) => set({ devices }),
  upsertDevice: (d) => {
    const exists = get().devices.some((x) => x.id === d.id);
    set({
      devices: exists
        ? get().devices.map((x) => (x.id === d.id ? d : x))
        : [...get().devices, d],
    });
  },
  removeDevice: (id) =>
    set({ devices: get().devices.filter((d) => d.id !== id) }),
  updateOnline: (id, online) =>
    set({
      devices: get().devices.map((d) =>
        d.id === id ? { ...d, online, lastSeen: Date.now() } : d,
      ),
    }),
  byRoom: (roomId) => get().devices.filter((d) => d.roomId === roomId),
}));
