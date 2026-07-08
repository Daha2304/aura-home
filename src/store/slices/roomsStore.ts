import { create } from "zustand";
import type { Room } from "@/models/room";

interface RoomsState {
  rooms: Room[];
  setRooms: (r: Room[]) => void;
  upsertRoom: (r: Room) => void;
  removeRoom: (id: string) => void;
}

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  upsertRoom: (r) => {
    const exists = get().rooms.some((x) => x.id === r.id);
    set({
      rooms: exists
        ? get().rooms.map((x) => (x.id === r.id ? r : x))
        : [...get().rooms, r],
    });
  },
  removeRoom: (id) => set({ rooms: get().rooms.filter((r) => r.id !== id) }),
}));
