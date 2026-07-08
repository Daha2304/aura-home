import type { Device } from "@/models/device";
import type { RgbCapability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { rgbToHex } from "@/utils/color";

export function RgbControl({
  capability,
}: {
  device: Device;
  capability: RgbCapability;
}) {
  const hex = rgbToHex(capability.value.r, capability.value.g, capability.value.b);
  return (
    <ControlPanel label={capability.label ?? "Farbe"} value={hex}>
      <div
        className="h-10 w-full rounded-xl border border-glass-border"
        style={{ background: hex }}
      />
    </ControlPanel>
  );
}
