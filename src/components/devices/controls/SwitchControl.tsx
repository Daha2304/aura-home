import type { Device } from "@/models/device";
import type { OnOffCapability } from "@/models/capability";
import { ControlPanel } from "./_shared";
import { Switch } from "@/components/ui/switch";

export function SwitchControl({
  capability,
}: {
  device: Device;
  capability: OnOffCapability;
}) {
  return (
    <ControlPanel label={capability.label ?? "Ein / Aus"}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {capability.value ? "An" : "Aus"}
        </span>
        <Switch checked={capability.value} disabled />
      </div>
    </ControlPanel>
  );
}
