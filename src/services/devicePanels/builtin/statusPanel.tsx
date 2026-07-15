import { memo } from "react";
import { Battery, Cog, Radar, Signal } from "lucide-react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { MetricCard } from "@/components/ds/cards/MetricCard";
import { StatusCard } from "@/components/ds/cards/StatusCard";

const StatusPanelComponent = memo(function StatusPanel({ device }: DevicePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Signal"
          value={typeof device.signal === "number" ? device.signal : "—"}
          unit={typeof device.signal === "number" ? "%" : undefined}
          icon={<Signal className="h-4 w-4" />}
        />
        <MetricCard
          label="Batterie"
          value={typeof device.battery === "number" ? device.battery : "—"}
          unit={typeof device.battery === "number" ? "%" : undefined}
          icon={<Battery className="h-4 w-4" />}
        />
        <StatusCard
          label="Discovery"
          value={device.lifecycle ?? "—"}
          icon={<Radar className="h-4 w-4" />}
          tone={
            device.lifecycle === "error"
              ? "danger"
              : device.lifecycle === "ready"
                ? "success"
                : "info"
          }
        />
        <StatusCard
          label="Version"
          value={String(device.version ?? "—")}
          icon={<Cog className="h-4 w-4" />}
        />
      </div>
    </div>
  );
});

export const statusPanelDescriptor: DevicePanelDescriptor = {
  id: "status",
  title: "Status",
  group: "status",
  priority: 900,
  isVisible: () => false,
  component: StatusPanelComponent,
};
