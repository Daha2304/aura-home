import { create } from "zustand";
import type { Room } from "@/models/room";

interface RoomsState {
  rooms: Room[];
  byId: Record<string, Room>;
  setRooms: (r: Room[]) => void;
  upsertRoom: (r: Room) => void;
  removeRoom: (id: string) => void;
  reorderRooms: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
}

function indexBy(rooms: Room[]): Record<string, Room> {
  const out: Record<string, Room> = {};
  for (const r of rooms) out[r.id] = r;
  return out;
}

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [],
  byId: {},
  setRooms: (rooms) => set({ rooms, byId: indexBy(rooms) }),
  upsertRoom: (r) => {
    const rooms = get().rooms;
    const exists = rooms.some((x) => x.id === r.id);
    const next = exists ? rooms.map((x) => (x.id === r.id ? r : x)) : [...rooms, r];
    set({ rooms: next, byId: indexBy(next) });
  },
  removeRoom: (id) => {
    const next = get().rooms.filter((r) => r.id !== id);
    set({ rooms: next, byId: indexBy(next) });
  },
  reorderRooms: (ids) => {
    const map = get().byId;
    const next: Room[] = [];
    ids.forEach((id, i) => {
      const r = map[id];
      if (r) next.push({ ...r, order: i });
    });
    // Append any rooms not in the ids list (defensive)
    for (const r of get().rooms) {
      if (!ids.includes(r.id)) next.push(r);
    }
    set({ rooms: next, byId: indexBy(next) });
  },
  toggleFavorite: (id) => {
    const r = get().byId[id];
    if (!r) return;
    const updated: Room = { ...r, favorite: !r.favorite, updatedAt: Date.now() };
    get().upsertRoom(updated);
  },
}));

// -------- Selectors (memo-friendly, use with useRoomsStore(selector, shallow)) --------

export const selectRooms = (s: RoomsState) => s.rooms;
export const selectRoomById = (id: string) => (s: RoomsState) => s.byId[id];
export const selectFavoriteRooms = (s: RoomsState) =>
  s.rooms.filter((r) => r.favorite);
