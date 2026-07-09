import { create } from "zustand";
import type { ChartDescriptor } from "@/models/chart";

interface ChartState {
  charts: Record<string, ChartDescriptor>;
  set: (c: ChartDescriptor) => void;
  remove: (id: string) => void;
  clear: () => void;
  list: () => ChartDescriptor[];
}

export const useChartStore = create<ChartState>((set, get) => ({
  charts: {},
  set: (c) => set((s) => ({ charts: { ...s.charts, [c.id]: c } })),
  remove: (id) =>
    set((s) => {
      const next = { ...s.charts };
      delete next[id];
      return { charts: next };
    }),
  clear: () => set({ charts: {} }),
  list: () => Object.values(get().charts),
}));
