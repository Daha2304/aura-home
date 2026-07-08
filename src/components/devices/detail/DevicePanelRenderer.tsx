import { memo, useMemo } from "react";
import { motion } from "framer-motion";
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
      {panels.map((panel, i) => {
        const Component = panel.component;
        return (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.28, ease: "easeOut" }}
          >
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
          </motion.div>
        );
      })}
    </div>
  );
});
