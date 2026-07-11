import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Device } from "@/models/device";
import { GlassCard } from "@/components/glass/GlassCard";
import { DeviceIconTile } from "@/components/devices/renderer/DeviceIconTile";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { IconButton } from "@/components/ds/controls/IconButton";
import { layoutIds } from "@/components/ds/motion/SharedLayout";
import { cardTransition } from "@/themes/motion";
import { cn } from "@/lib/utils";
import type { DeviceCardProps } from "./DeviceCardLarge";
import { memo } from "react";

export const DeviceCardCompact = memo(function DeviceCardCompact({
  device,
  onFavoriteToggle,
}: DeviceCardProps) {
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
            <div className="line-clamp-2 break-words text-sm font-semibold leading-tight">
              {device.name}
            </div>
            <div className="mt-0.5">
              <StatusBadge tone={device.online ? "success" : "neutral"}>
                {device.online ? "Online" : "Offline"}
              </StatusBadge>
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
