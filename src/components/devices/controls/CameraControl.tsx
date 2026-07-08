import type { Device } from "@/models/device";
import type { StreamCapability } from "@/models/capability";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { CameraOff } from "lucide-react";

export function CameraControl({
  capability,
}: {
  device: Device;
  capability: StreamCapability;
}) {
  return (
    <GlassPanel className="space-y-3">
      <div className="text-sm font-medium">{capability.label ?? "Kamera"}</div>
      <div className="grid aspect-video w-full place-items-center rounded-xl bg-black/70 text-white/60">
        <div className="flex flex-col items-center gap-2 text-xs">
          <CameraOff className="h-6 w-6" />
          <span>Kein Stream</span>
        </div>
      </div>
    </GlassPanel>
  );
}
