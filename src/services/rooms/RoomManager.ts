import type { Room, RoomType } from "@/models/room";
import type { HexColor } from "@/models/common";
import { getRoomCategoryMeta } from "@/models/roomCategory";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { readJson, writeJson } from "@/services/storage/localStorage";
import { createLogger } from "@/services/logger/Logger";
import { isAliasRoomId } from "@/services/discovery/aliasFilter";
import { roomEvents } from "./RoomEvents";

const log = createLogger("room-manager");
const STORAGE_KEY = "rooms.v1";

function uid(): string {
  return "room_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export interface CreateRoomInput {
  name: string;
  type?: RoomType;
  icon?: string;
  color?: HexColor;
  image?: string;
  floor?: number;
  description?: string;
  tags?: string[];
  favorite?: boolean;
}

export class RoomManager {
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const stored = readJson<Room[]>(STORAGE_KEY);
    if (stored && Array.isArray(stored)) {
      const aliasRooms = stored.filter((room) => isAliasRoomId(room.id));
      useRoomsStore.getState().setRooms(aliasRooms);
      log.info("hydrated", aliasRooms.length, "rooms");
    }
    // Persist on every change.
    useRoomsStore.subscribe((s) => {
      writeJson(STORAGE_KEY, s.rooms);
    });
  }

  list(): Room[] {
    return useRoomsStore.getState().rooms;
  }

  get(id: string): Room | undefined {
    return useRoomsStore.getState().byId[id];
  }

  create(input: CreateRoomInput): Room {
    const type = input.type ?? "custom";
    const meta = getRoomCategoryMeta(type);
    const order = useRoomsStore.getState().rooms.length;
    const now = Date.now();
    const room: Room = {
      id: uid(),
      name: input.name.trim() || meta.label,
      icon: input.icon ?? meta.icon,
      color: (input.color ?? (meta.accent as HexColor)) as HexColor,
      image: input.image,
      floor: input.floor,
      order,
      type,
      category: type,
      description: input.description,
      tags: input.tags,
      favorite: input.favorite ?? false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    useRoomsStore.getState().upsertRoom(room);
    roomEvents.emit("roomCreated", { room });
    roomEvents.emit("changed", undefined);
    return room;
  }

  update(id: string, patch: Partial<Room>): Room | undefined {
    const previous = this.get(id);
    if (!previous) return undefined;
    const room: Room = { ...previous, ...patch, id, updatedAt: Date.now() };
    useRoomsStore.getState().upsertRoom(room);
    roomEvents.emit("roomUpdated", { room, previous });
    roomEvents.emit("changed", undefined);
    return room;
  }

  delete(id: string): boolean {
    const r = this.get(id);
    if (!r) return false;
    useRoomsStore.getState().removeRoom(id);
    roomEvents.emit("roomDeleted", { id });
    roomEvents.emit("changed", undefined);
    return true;
  }

  reorder(ids: string[]): void {
    useRoomsStore.getState().reorderRooms(ids);
    roomEvents.emit("roomsReordered", { ids });
    roomEvents.emit("changed", undefined);
  }

  move(id: string, toIndex: number): void {
    const rooms = [...this.list()].sort((a, b) => a.order - b.order);
    const from = rooms.findIndex((r) => r.id === id);
    if (from < 0) return;
    const [item] = rooms.splice(from, 1);
    rooms.splice(Math.max(0, Math.min(toIndex, rooms.length)), 0, item);
    this.reorder(rooms.map((r) => r.id));
  }

  toggleFavorite(id: string): void {
    useRoomsStore.getState().toggleFavorite(id);
    const r = this.get(id);
    if (r) roomEvents.emit("roomUpdated", { room: r, previous: r });
    roomEvents.emit("changed", undefined);
  }

  duplicate(id: string): Room | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    return this.create({
      name: `${src.name} (Kopie)`,
      type: src.type,
      icon: src.icon,
      color: src.color,
      image: src.image,
      floor: src.floor,
      description: src.description,
      tags: src.tags,
    });
  }

  /** Bereitet Zusammenführung vor. Führt sie noch nicht aus. */
  mergePrepare(sourceIds: string[], targetId: string): {
    source: Room[];
    target: Room | undefined;
  } {
    const map = useRoomsStore.getState().byId;
    return {
      source: sourceIds.map((id) => map[id]).filter(Boolean) as Room[],
      target: map[targetId],
    };
  }

  export(): string {
    return JSON.stringify({ version: 1, rooms: this.list() }, null, 2);
  }

  import(json: string): number {
    const parsed = JSON.parse(json) as { rooms?: Room[] };
    if (!parsed?.rooms || !Array.isArray(parsed.rooms)) {
      throw new Error("Ungültiges Import-Format");
    }
    useRoomsStore.getState().setRooms(parsed.rooms);
    roomEvents.emit("roomsImported", { count: parsed.rooms.length });
    roomEvents.emit("changed", undefined);
    return parsed.rooms.length;
  }
}

export const roomManager = new RoomManager();
