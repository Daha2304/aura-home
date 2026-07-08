import { memo } from "react";
import type { Device } from "@/models/device";
import type { DevicePropertyGroup } from "@/models/deviceProperty";
import { devicePropertyRegistry } from "@/services/deviceProperties/DevicePropertyRegistry";

export interface PropertyListProps {
  device: Device;
  group: DevicePropertyGroup;
  emptyLabel?: string;
}

export const PropertyList = memo(function PropertyList({
  device,
  group,
  emptyLabel,
}: PropertyListProps) {
  const rows = devicePropertyRegistry.readGroup(group, device);
  if (rows.length === 0) {
    return emptyLabel ? (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    ) : null;
  }
  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map(({ descriptor, value }) => {
        const Icon = descriptor.icon;
        return (
          <div
            key={descriptor.id}
            className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1 last:border-b-0"
          >
            <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              {Icon && <Icon className="h-3 w-3" />}
              {descriptor.label}
            </dt>
            <dd className="max-w-[60%] truncate text-sm font-medium">{value}</dd>
          </div>
        );
      })}
    </dl>
  );
});
