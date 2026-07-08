import { Link } from "@tanstack/react-router";
import type { Device } from "@/models/device";
import { GlassCard } from "@/components/glass/GlassCard";
import { DeviceIcon } from "./DeviceIcon";
import { DeviceStatusBadge } from "./DeviceStatusBadge";

export function DeviceCard({ device }: { device: Device }) {
  return (
    <Link to="/devices/$deviceId" params={{ deviceId: device.id }} className="block">
      <GlassCard interactive className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
          <DeviceIcon type={device.type} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{device.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{device.type}</span>
          </div>
        </div>
        <DeviceStatusBadge online={device.online} />
      </GlassCard>
    </Link>
  );
}
