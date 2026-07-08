import { memo } from "react";
import { Battery, Cog, Radar, Signal } from "lucide-react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { MetricCard } from "@/components/ds/cards/MetricCard";
import { StatusCard } from "@/components/ds/cards/StatusCard";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { useCommandsStore } from "@/store/slices/commandsStore";
import { AnimatePresence, motion } from "framer-motion";

const StatusPanelComponent = memo(function StatusPanel({ device }: DevicePanelProps) {
  const active = useCommandsStore((s) => s.active).filter(
    (c) => c.deviceId === device.id,
  );

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
      <AnimatePresence>
        {active.length > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-1.5"
          >
            {active.map((c) => (
              <StatusBadge key={c.id} tone="info">
                {c.state} · {c.key}
              </StatusBadge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const statusPanelDescriptor: DevicePanelDescriptor = {
  id: "status",
  title: "Status",
  group: "status",
  priority: 900,
  isVisible: () => true,
  component: StatusPanelComponent,
};
