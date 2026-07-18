import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { UniversalControlRenderer } from "@/components/devices/controls";

const ControlsPanelComponent = memo(function ControlsPanel({ device }: DevicePanelProps) {
  return <UniversalControlRenderer deviceId={device.id} mode="writable" />;
});

export const controlsPanelDescriptor: DevicePanelDescriptor = {
  id: "controls",
  title: "Steuerung",
  group: "controls",
  priority: 800,
  isVisible: () => false,
  component: ControlsPanelComponent,
};

const SensorsPanelComponent = memo(function SensorsPanel({ device }: DevicePanelProps) {
  return <UniversalControlRenderer deviceId={device.id} mode="readonly" />;
});

export const sensorsPanelDescriptor: DevicePanelDescriptor = {
  id: "sensors",
  title: "Sensoren",
  group: "sensors",
  priority: 750,
  isVisible: () => false,
  component: SensorsPanelComponent,
};
