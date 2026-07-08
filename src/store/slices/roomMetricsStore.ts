import { create } from "zustand";
import type { RoomMetrics } from "@/models/roomMetrics";

interface RoomMetricsState {
  byId: Map<string, RoomMetrics>;
  revision: number;
  setRoom: (roomId: string, metrics: RoomMetrics) => void;
  removeRoom: (roomId: string) => void;
  clear: () => void;
  get: (roomId: string) => RoomMetrics | undefined;
}

export const useRoomMetricsStore = create<RoomMetricsState>((set, get) => ({
  byId: new Map(),
  revision: 0,
  setRoom: (roomId, metrics) => {
    const next = new Map(get().byId);
    next.set(roomId, metrics);
    set({ byId: next, revision: get().revision + 1 });
  },
  removeRoom: (roomId) => {
    if (!get().byId.has(roomId)) return;
    const next = new Map(get().byId);
    next.delete(roomId);
    set({ byId: next, revision: get().revision + 1 });
  },
  clear: () => set({ byId: new Map(), revision: get().revision + 1 }),
  get: (roomId) => get().byId.get(roomId),
}));

export const selectRoomMetrics = (roomId: string) => (s: RoomMetricsState) =>
  s.byId.get(roomId);
