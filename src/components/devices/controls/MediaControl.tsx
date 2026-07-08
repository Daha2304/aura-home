import type { Device } from "@/models/device";
import type { MediaTransportCapability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { Pause, Play, Square } from "lucide-react";

export function MediaControl({
  capability,
}: {
  device: Device;
  capability: MediaTransportCapability;
}) {
  const Icon =
    capability.state === "play"
      ? Pause
      : capability.state === "pause"
        ? Play
        : Square;
  return (
    <ControlPanel
      label={capability.label ?? "Wiedergabe"}
      value={capability.title ?? capability.state}
    >
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent"
        disabled
      >
        <Icon className="h-5 w-5" />
      </button>
    </ControlPanel>
  );
}
