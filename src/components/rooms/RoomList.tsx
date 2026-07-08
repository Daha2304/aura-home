import { memo } from "react";
import type { Room } from "@/models/room";
import { RoomCard } from "./RoomCard";
import { SharedLayout } from "@/components/ds/motion/SharedLayout";

interface Props {
  rooms: Room[];
  className?: string;
}

function RoomListImpl({ rooms, className }: Props) {
  return (
    <SharedLayout id="rooms-grid">
      <div className={className ?? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"}>
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} />
        ))}
      </div>
    </SharedLayout>
  );
}

export const RoomList = memo(RoomListImpl);
