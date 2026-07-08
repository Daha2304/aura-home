import { Link } from "@tanstack/react-router";
import type { Room } from "@/models/room";
import { GlassCard } from "@/components/glass/GlassCard";
import { RoomIcon } from "./RoomIcon";
import { useDevicesStore } from "@/store/slices/devicesStore";

export function RoomCard({ room }: { room: Room }) {
  const deviceCount = useDevicesStore(
    (s) => s.devices.filter((d) => d.roomId === room.id).length,
  );
  const onlineCount = useDevicesStore(
    (s) =>
      s.devices.filter((d) => d.roomId === room.id && d.online).length,
  );

  return (
    <Link to="/rooms/$roomId" params={{ roomId: room.id }} className="block">
      <GlassCard
        interactive
        accent={room.color}
        className="flex h-32 flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent/20 text-accent">
            <RoomIcon type={room.type} className="h-5 w-5" />
          </div>
          {room.floor !== undefined && (
            <span className="text-xs text-muted-foreground">
              Etage {room.floor}
            </span>
          )}
        </div>
        <div>
          <div className="truncate text-base font-semibold">{room.name}</div>
          <div className="text-xs text-muted-foreground">
            {deviceCount === 0
              ? "Keine Geräte"
              : `${onlineCount}/${deviceCount} online`}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
