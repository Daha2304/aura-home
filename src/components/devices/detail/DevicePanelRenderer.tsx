import { memo, useMemo } from "react";
import type { Device } from "@/models/device";
import { devicePanelRegistry } from "@/services/devicePanels/DevicePanelRegistry";
import { SectionCard } from "@/components/ds/cards/SectionCard";

export interface DevicePanelRendererProps {
  device: Device;
}

export const DevicePanelRenderer = memo(function DevicePanelRenderer({
  device,
}: DevicePanelRendererProps) {
  const panels = useMemo(
    () => devicePanelRegistry.visibleFor(device),
    [device],
  );

  return (
    <div className="flex flex-col gap-4">
      {panels.map((panel) => {
        const Component = panel.component;
        return (
          <div key={panel.id}>
            {panel.group === "hero" ? (
              <Component device={device} />
            ) : (
              <SectionCard
                title={panel.title}
                role="region"
                aria-label={panel.title}
              >
                <Component device={device} />
              </SectionCard>
            )}
          </div>
        );
      })}
    </div>
  );
});
