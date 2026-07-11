import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, MapPin } from "lucide-react";
import type { Device } from "@/models/device";
import { GlassCard } from "@/components/glass/GlassCard";
import { DeviceIconTile } from "@/components/devices/renderer/DeviceIconTile";
import { DeviceStatusChips } from "@/components/devices/renderer/DeviceStatusChips";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { IconButton } from "@/components/ds/controls/IconButton";
import { layoutIds } from "@/components/ds/motion/SharedLayout";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { cardTransition } from "@/themes/motion";
import { cn } from "@/lib/utils";
import type { DeviceCardProps } from "./DeviceCardLarge";
import { memo } from "react";

export const DeviceCardList = memo(function DeviceCardList({
  device,
  onFavoriteToggle,
}: DeviceCardProps) {
  const room = useRoomsStore((s) => (device.roomId ? s.byId[device.roomId] : undefined));
  return (
    <motion.div
      layoutId={layoutIds.deviceCard(device.id)}
      variants={cardTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Link to="/devices/$deviceId" params={{ deviceId: device.id }} className="block">
        <GlassCard interactive className="flex items-center gap-3 p-2.5">
          <DeviceIconTile device={device} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="min-w-0 flex-1 break-words text-sm font-semibold leading-tight">
                {device.name}
              </div>
              <StatusBadge tone={device.online ? "success" : "neutral"}>
                {device.online ? "Online" : "Offline"}
              </StatusBadge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{device.type}</span>
              {room && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {room.name}
                </span>
              )}
              <DeviceStatusChips device={device} />
            </div>
          </div>
          {onFavoriteToggle && (
            <IconButton
              aria-label="Favorit"
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle(device.id);
              }}
            >
              <Heart
                className={cn("h-4 w-4", device.favorite && "fill-current text-destructive")}
              />
            </IconButton>
          )}
        </GlassCard>
      </Link>
    </motion.div>
  );
});
