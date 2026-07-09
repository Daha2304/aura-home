import { create } from "zustand";
import type { StatisticsSnapshot, EnergyStatistics } from "@/models/statistics";

interface StatisticsState {
  snapshots: Record<string, StatisticsSnapshot>;
  set: (snap: StatisticsSnapshot) => void;
  remove: (id: string) => void;
  clear: () => void;
  list: () => StatisticsSnapshot[];
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  snapshots: {},
  set: (snap) =>
    set((s) => ({ snapshots: { ...s.snapshots, [snap.id]: snap } })),
  remove: (id) =>
    set((s) => {
      const next = { ...s.snapshots };
      delete next[id];
      return { snapshots: next };
    }),
  clear: () => set({ snapshots: {} }),
  list: () => Object.values(get().snapshots),
}));

interface EnergyState {
  entries: Record<string, EnergyStatistics>;
  set: (e: EnergyStatistics) => void;
  clear: () => void;
  list: () => EnergyStatistics[];
}

export const useEnergyStore = create<EnergyState>((set, get) => ({
  entries: {},
  set: (e) => set((s) => ({ entries: { ...s.entries, [e.id]: e } })),
  clear: () => set({ entries: {} }),
  list: () => Object.values(get().entries),
}));
