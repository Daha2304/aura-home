import { create } from "zustand";
import type { HistoryEntry, HistoryQuery } from "@/models/history";

interface HistoryState {
  entries: HistoryEntry[];
  push: (e: HistoryEntry) => void;
  query: (q: HistoryQuery) => HistoryEntry[];
  clear: () => void;
  clearForDevice: (deviceId: string) => void;
}

/**
 * Ring-Buffer. Diagramme kommen später — hier nur die Datenstruktur.
 */
const MAX_ENTRIES = 5000;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  push: (e) =>
    set((s) => {
      const next = s.entries.length >= MAX_ENTRIES ? s.entries.slice(1) : s.entries;
      return { entries: [...next, e] };
    }),
  query: ({ deviceId, key, from, to, limit }) => {
    let out = get().entries;
    if (deviceId) out = out.filter((e) => e.deviceId === deviceId);
    if (key) out = out.filter((e) => e.key === key);
    if (from) out = out.filter((e) => e.timestamp >= from);
    if (to) out = out.filter((e) => e.timestamp <= to);
    if (limit) out = out.slice(-limit);
    return out;
  },
  clear: () => set({ entries: [] }),
  clearForDevice: (deviceId) =>
    set((s) => ({ entries: s.entries.filter((e) => e.deviceId !== deviceId) })),
}));
