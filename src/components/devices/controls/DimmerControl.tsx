import type { Device } from "@/models/device";
import type { DimmerCapability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { Slider } from "@/components/ui/slider";

export function DimmerControl({
  capability,
}: {
  device: Device;
  capability: DimmerCapability;
}) {
  return (
    <ControlPanel
      label={capability.label ?? "Helligkeit"}
      value={`${Math.round(capability.value)}%`}
    >
      <Slider value={[capability.value]} min={0} max={100} disabled />
    </ControlPanel>
  );
}
