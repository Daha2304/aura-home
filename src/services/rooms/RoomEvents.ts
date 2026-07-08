import { TypedEmitter } from "@/services/events/EventEmitter";
import type { RoomEvents } from "@/models/roomEvents";

export const roomEvents = new TypedEmitter<RoomEvents>();
