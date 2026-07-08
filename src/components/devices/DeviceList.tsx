import type { Device } from "@/models/device";
import { DeviceCard } from "./DeviceCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Cpu } from "lucide-react";

export function DeviceList({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return (
      <EmptyState
        icon={Cpu}
        title="Noch keine Geräte"
        description="Verbinde dich mit einem Server, um Geräte zu entdecken."
      />
    );
  }
  return (
    <div className="space-y-2">
      {devices.map((d) => (
        <DeviceCard key={d.id} device={d} />
      ))}
    </div>
  );
}
