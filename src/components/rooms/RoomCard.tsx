import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { memo } from "react";
import type { Room } from "@/models/room";
import { RoomIcon } from "./RoomIcon";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { layoutIds } from "@/components/ds/motion/SharedLayout";
import { Heart } from "lucide-react";
import { cardTransition, springSnappy } from "@/themes/motion";

interface Props {
  room: Room;
  className?: string;
}

function RoomCardImpl({ room, className }: Props) {
  const deviceCount = useDevicesStore(
    (s) => s.devices.filter((d) => d.roomId === room.id).length,
  );
  const onlineCount = useDevicesStore(
    (s) => s.devices.filter((d) => d.roomId === room.id && d.online).length,
  );

  return (
    <Link
      to="/rooms/$roomId"
      params={{ roomId: room.id }}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl"
      aria-label={`Raum öffnen: ${room.name}`}
    >
      <motion.div
        layoutId={layoutIds.roomCard(room.id)}
        variants={cardTransition}
        initial="initial"
        animate="animate"
        whileTap={{ scale: 0.98 }}
        transition={springSnappy}
        className={cn(
          "glass-card hairline relative flex h-40 flex-col justify-between overflow-hidden p-4",
          className,
        )}
        style={
          {
            "--accent": room.color,
            contentVisibility: "auto",
          } as React.CSSProperties
        }
      >
        {room.image && (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-70"
            style={{
              backgroundImage: `linear-gradient(180deg, transparent 30%, color-mix(in oklab, var(--accent) 35%, transparent) 100%), url(${room.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        {!room.image && (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-40"
            style={{
              background:
                "radial-gradient(120% 100% at 0% 0%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 65%)",
            }}
          />
        )}
        <div className="flex items-start justify-between">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/25 text-foreground backdrop-blur-sm">
            <RoomIcon type={room.type} className="h-5 w-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {room.favorite && <Heart className="h-4 w-4 fill-red-500 text-red-500" />}
            {room.floor !== undefined && (
              <StatusBadge tone="neutral">Etage {room.floor}</StatusBadge>
            )}
          </div>
        </div>
        <div>
          <div className="truncate text-base font-semibold">{room.name}</div>
          <div className="text-xs text-muted-foreground">
            {deviceCount === 0 ? "Bereit für Geräte" : `${onlineCount}/${deviceCount} online`}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export const RoomCard = memo(RoomCardImpl);
