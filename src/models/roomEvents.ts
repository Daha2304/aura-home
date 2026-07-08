import type { Room } from "./room";

export interface RoomEvents {
  roomCreated: { room: Room };
  roomUpdated: { room: Room; previous: Room };
  roomDeleted: { id: string };
  roomsReordered: { ids: string[] };
  roomsImported: { count: number };
  changed: void;
}
