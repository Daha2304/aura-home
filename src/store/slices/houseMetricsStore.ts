import { create } from "zustand";
import type { HouseMetrics } from "@/models/houseMetrics";

interface HouseMetricsState {
  metrics: HouseMetrics | null;
  revision: number;
  set: (m: HouseMetrics) => void;
  clear: () => void;
}

export const useHouseMetricsStore = create<HouseMetricsState>((set, get) => ({
  metrics: null,
  revision: 0,
  set: (m) => set({ metrics: m, revision: get().revision + 1 }),
  clear: () => set({ metrics: null, revision: get().revision + 1 }),
}));
