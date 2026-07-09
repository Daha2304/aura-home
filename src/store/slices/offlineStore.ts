import { create } from "zustand";

interface OfflineState {
  online: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
  pendingCount: number;
  syncing: boolean;
  lastSyncAt: number | null;
  setOnline: (online: boolean) => void;
  setPendingCount: (n: number) => void;
  setSyncing: (v: boolean) => void;
  markSynced: () => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  lastOnlineAt: null,
  lastOfflineAt: null,
  pendingCount: 0,
  syncing: false,
  lastSyncAt: null,
  setOnline: (online) => {
    const prev = get().online;
    if (prev === online) return;
    set({
      online,
      lastOnlineAt: online ? Date.now() : get().lastOnlineAt,
      lastOfflineAt: !online ? Date.now() : get().lastOfflineAt,
    });
  },
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setSyncing: (syncing) => set({ syncing }),
  markSynced: () => set({ lastSyncAt: Date.now(), syncing: false }),
}));

export const selectOnline = (s: OfflineState) => s.online;
export const selectPending = (s: OfflineState) => s.pendingCount;
