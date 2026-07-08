import type { RoomType } from "@/models/room";
import { ROOM_CATEGORIES, type RoomCategoryMeta } from "@/models/roomCategory";
import { TypedEmitter } from "@/services/events/EventEmitter";

interface RoomRegistryEvents {
  registered: { type: RoomType };
  unregistered: { type: RoomType };
  changed: void;
}

/**
 * Plugin-fähige Registry für Raumtypen. Built-ins werden beim Bootstrap
 * registriert. Externe Plugins können weitere Typen ergänzen.
 */
export class RoomRegistry extends TypedEmitter<RoomRegistryEvents> {
  private readonly types = new Map<RoomType, RoomCategoryMeta>();

  register(meta: RoomCategoryMeta): void {
    this.types.set(meta.type, meta);
    this.emit("registered", { type: meta.type });
    this.emit("changed", undefined);
  }

  unregister(type: RoomType): boolean {
    const ok = this.types.delete(type);
    if (ok) {
      this.emit("unregistered", { type });
      this.emit("changed", undefined);
    }
    return ok;
  }

  get(type: RoomType): RoomCategoryMeta | undefined {
    return this.types.get(type);
  }

  has(type: RoomType): boolean {
    return this.types.has(type);
  }

  all(): RoomCategoryMeta[] {
    return Array.from(this.types.values());
  }

  clear(): void {
    this.types.clear();
    this.emit("changed", undefined);
  }
}

export const roomRegistry = new RoomRegistry();

let bootstrapped = false;
export function registerBuiltinRoomTypes(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  for (const meta of ROOM_CATEGORIES) roomRegistry.register(meta);
}
