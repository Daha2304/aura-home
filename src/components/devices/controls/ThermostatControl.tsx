import type { Device } from "@/models/device";
import type { TemperatureCapability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { formatTemperature } from "@/utils/format";

export function ThermostatControl({
  capability,
}: {
  device: Device;
  capability: TemperatureCapability;
}) {
  return (
    <ControlPanel
      label={capability.label ?? "Thermostat"}
      value={formatTemperature(capability.value, capability.unit)}
    >
      {capability.target !== undefined && (
        <div className="text-sm text-muted-foreground">
          Ziel: {formatTemperature(capability.target, capability.unit)}
        </div>
      )}
    </ControlPanel>
  );
}
