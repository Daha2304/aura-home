import type { Room } from "@/models/room";
import { RoomCard } from "./RoomCard";

export function RoomList({ rooms }: { rooms: Room[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {rooms.map((r) => (
        <RoomCard key={r.id} room={r} />
      ))}
    </div>
  );
}
