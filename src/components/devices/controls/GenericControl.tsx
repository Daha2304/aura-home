import type { Device } from "@/models/device";
import type { Capability } from "@/models/capability";
import { ControlPanel } from "./_shared";

export function GenericControl({
  capability,
}: {
  device: Device;
  capability: Capability;
}) {
  return (
    <ControlPanel label={capability.label ?? capability.kind} value={capability.kind} />
  );
}
