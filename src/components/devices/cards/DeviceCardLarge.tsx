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
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { cardTransition } from "@/themes/motion";
import { cn } from "@/lib/utils";
import { memo } from "react";

export interface DeviceCardProps {
  device: Device;
  onFavoriteToggle?: (id: string) => void;
  onOpenActions?: (id: string) => void;
}

/** Große Präsentationskarte (Hero-Layout). */
export const DeviceCardLarge = memo(function DeviceCardLarge({
  device,
  onFavoriteToggle,
  onOpenActions,
}: DeviceCardProps) {
  const room = useRoomsStore((s) => (device.roomId ? s.byId[device.roomId] : undefined));
  const desc = deviceRegistry.get(device.type);
  return (
    <motion.div
      layoutId={layoutIds.deviceCard(device.id)}
      variants={cardTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Link
        to="/devices/$deviceId"
        params={{ deviceId: device.id }}
        className="block focus-visible:outline-none"
        onContextMenu={(e) => {
          if (onOpenActions) {
            e.preventDefault();
            onOpenActions(device.id);
          }
        }}
      >
        <GlassCard interactive className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <DeviceIconTile device={device} size="lg" />
            <div className="flex items-center gap-1">
              {onFavoriteToggle && (
                <IconButton
                  aria-label={device.favorite ? "Favorit entfernen" : "Als Favorit markieren"}
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
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{device.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {desc && <span className="capitalize">{desc.name}</span>}
              {room && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {room.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone={device.online ? "success" : "neutral"}>
              {device.online ? "Online" : "Offline"}
            </StatusBadge>
            <DeviceStatusChips device={device} />
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
});
