import type { Device } from "@/models/device";
import type { Capability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { formatPercent, formatTemperature } from "@/utils/format";

export function SensorControl({
  capability,
}: {
  device: Device;
  capability: Capability;
}) {
  let value = "—";
  if (capability.kind === "temperature") {
    value = formatTemperature(capability.value, capability.unit);
  } else if (capability.kind === "humidity") {
    value = formatPercent(capability.value);
  }
  return (
    <ControlPanel label={capability.label ?? capability.kind} value={value} />
  );
}
