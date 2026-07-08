import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { useSettingsStore } from "@/store/slices/settingsStore";

const DeveloperPanelComponent = memo(function DeveloperPanel({ device }: DevicePanelProps) {
  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-foreground/5 p-3 text-[11px] leading-relaxed">
      {JSON.stringify(device, null, 2)}
    </pre>
  );
});

export const developerPanelDescriptor: DevicePanelDescriptor = {
  id: "developer",
  title: "Entwickler",
  group: "developer",
  priority: 100,
  isVisible: () => useSettingsStore.getState().debugWebSocket === true,
  component: DeveloperPanelComponent,
};
