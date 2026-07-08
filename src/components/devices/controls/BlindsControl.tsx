import type { Device } from "@/models/device";
import type { PositionCapability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { Slider } from "@/components/ui/slider";

export function BlindsControl({
  capability,
}: {
  device: Device;
  capability: PositionCapability;
}) {
  return (
    <ControlPanel
      label={capability.label ?? "Position"}
      value={`${Math.round(capability.value)}%`}
    >
      <Slider value={[capability.value]} min={0} max={100} disabled />
    </ControlPanel>
  );
}
