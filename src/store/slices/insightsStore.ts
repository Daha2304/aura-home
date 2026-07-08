import { create } from "zustand";
import type { Insight } from "@/models/insight";

interface InsightsState {
  house: Insight[];
  byRoom: Map<string, Insight[]>;
  revision: number;
  setHouse: (list: Insight[]) => void;
  setRoom: (roomId: string, list: Insight[]) => void;
  clearRoom: (roomId: string) => void;
  clear: () => void;
}

export const useInsightsStore = create<InsightsState>((set, get) => ({
  house: [],
  byRoom: new Map(),
  revision: 0,
  setHouse: (list) => set({ house: list, revision: get().revision + 1 }),
  setRoom: (roomId, list) => {
    const next = new Map(get().byRoom);
    next.set(roomId, list);
    set({ byRoom: next, revision: get().revision + 1 });
  },
  clearRoom: (roomId) => {
    if (!get().byRoom.has(roomId)) return;
    const next = new Map(get().byRoom);
    next.delete(roomId);
    set({ byRoom: next, revision: get().revision + 1 });
  },
  clear: () => set({ house: [], byRoom: new Map(), revision: get().revision + 1 }),
}));
