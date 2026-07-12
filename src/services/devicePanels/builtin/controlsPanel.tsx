import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { UniversalControlRenderer } from "@/components/devices/controls";
import { controlFactory } from "@/services/controls/ControlFactory";

const ControlsPanelComponent = memo(function ControlsPanel({ device }: DevicePanelProps) {
  return <UniversalControlRenderer deviceId={device.id} mode="writable" />;
});

export const controlsPanelDescriptor: DevicePanelDescriptor = {
  id: "controls",
  title: "Steuerung",
  group: "controls",
  priority: 800,
  isVisible: (device) =>
    controlFactory.buildForDevice(device).some((s) => !s.readOnly),
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
  isVisible: (device) => {
    const specs = controlFactory.buildForDevice(device);
    return specs.some((s) => s.readOnly);
  },
  component: SensorsPanelComponent,
};
