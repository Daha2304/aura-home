import { AlertTriangle, BatteryLow, WifiOff, Radar } from "lucide-react";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import type { Device } from "@/models/device";

/**
 * Ableitung von Status-Chips ausschließlich aus Discovery/Intelligence-
 * relevanten Feldern des Geräts. Keine Steuerung.
 */
export function DeviceStatusChips({ device }: { device: Device }) {
  const chips: Array<{ key: string; node: React.ReactNode }> = [];
  if (!device.online) {
    chips.push({
      key: "offline",
      node: (
        <StatusBadge tone="neutral" icon={<WifiOff className="h-3 w-3" />}>
          Offline
        </StatusBadge>
      ),
    });
  }
  if (device.lifecycle === "error") {
    chips.push({
      key: "error",
      node: (
        <StatusBadge tone="danger" icon={<AlertTriangle className="h-3 w-3" />}>
          Fehler
        </StatusBadge>
      ),
    });
  } else if (device.lifecycle === "discovering" || device.lifecycle === "new") {
    chips.push({
      key: "discovering",
      node: (
        <StatusBadge tone="info" icon={<Radar className="h-3 w-3" />}>
          Neu
        </StatusBadge>
      ),
    });
  }
  if (typeof device.battery === "number" && device.battery <= 15) {
    chips.push({
      key: "battery",
      node: (
        <StatusBadge tone="warning" icon={<BatteryLow className="h-3 w-3" />}>
          {device.battery}%
        </StatusBadge>
      ),
    });
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span key={c.key}>{c.node}</span>
      ))}
    </div>
  );
}
