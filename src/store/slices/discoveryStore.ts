import { create } from "zustand";
import type { AppErrorPayload } from "@/services/errors/AppError";

export type DiscoveryState = "idle" | "discovering" | "syncing" | "ready";

interface DiscoveryStoreState {
  state: DiscoveryState;
  lastSyncAt?: number;
  lastSyncRequest?: string;
  errors: AppErrorPayload[];
  stats: {
    fullSyncs: number;
    deltaSyncs: number;
    devices: number;
  };

  setState: (s: DiscoveryState) => void;
  setLastSyncRequest: (id: string) => void;
  markSynced: () => void;
  incFullSync: () => void;
  incDeltaSync: () => void;
  setDeviceCount: (n: number) => void;
  pushError: (e: AppErrorPayload) => void;
  clearErrors: () => void;
}

const MAX_ERRORS = 50;

export const useDiscoveryStore = create<DiscoveryStoreState>((set, get) => ({
  state: "idle",
  lastSyncAt: undefined,
  lastSyncRequest: undefined,
  errors: [],
  stats: { fullSyncs: 0, deltaSyncs: 0, devices: 0 },

  setState: (state) => set({ state }),
  setLastSyncRequest: (lastSyncRequest) => set({ lastSyncRequest }),
  markSynced: () => set({ state: "ready", lastSyncAt: Date.now() }),
  incFullSync: () =>
    set({ stats: { ...get().stats, fullSyncs: get().stats.fullSyncs + 1 } }),
  incDeltaSync: () =>
    set({ stats: { ...get().stats, deltaSyncs: get().stats.deltaSyncs + 1 } }),
  setDeviceCount: (n) => set({ stats: { ...get().stats, devices: n } }),
  pushError: (e) =>
    set((s) => ({ errors: [e, ...s.errors].slice(0, MAX_ERRORS) })),
  clearErrors: () => set({ errors: [] }),
}));
