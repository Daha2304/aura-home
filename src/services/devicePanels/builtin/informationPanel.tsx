import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { PropertyList } from "@/components/devices/properties/PropertyList";
import { devicePropertyRegistry } from "@/services/deviceProperties/DevicePropertyRegistry";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";

const InformationPanelComponent = memo(function InformationPanel({
  device,
}: DevicePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <PropertyList device={device} group="identity" />
      {device.customProperties && Object.keys(device.customProperties).length > 0 && (
        <CustomProperties device={device} />
      )}
    </div>
  );
});

function CustomProperties({ device }: DevicePanelProps) {
  const entries = Object.entries(device.customProperties ?? {});
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Benutzerdefiniert
      </p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, v]) => (
          <StatusBadge key={k} tone="neutral">
            {k}: {formatCustom(v)}
          </StatusBadge>
        ))}
      </div>
    </div>
  );
}

function formatCustom(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "[?]";
    }
  }
  return String(v);
}

export const informationPanelDescriptor: DevicePanelDescriptor = {
  id: "information",
  title: "Informationen",
  group: "information",
  priority: 700,
  isVisible: () => false,
  component: InformationPanelComponent,
};
