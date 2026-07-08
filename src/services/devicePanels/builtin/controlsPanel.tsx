import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { UniversalControlRenderer } from "@/components/devices/controls";
import { controlFactory } from "@/services/controls/ControlFactory";

const ControlsPanelComponent = memo(function ControlsPanel({ device }: DevicePanelProps) {
  return <UniversalControlRenderer deviceId={device.id} />;
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
  // Universal renderer shows all specs; if only readonly exist, this is
  // effectively the sensors view. When mixed, the controls panel already
  // renders them once, so we hide this panel to avoid duplication.
  return <UniversalControlRenderer deviceId={device.id} />;
});

export const sensorsPanelDescriptor: DevicePanelDescriptor = {
  id: "sensors",
  title: "Sensoren",
  group: "sensors",
  priority: 750,
  isVisible: (device) => {
    const specs = controlFactory.buildForDevice(device);
    return specs.length > 0 && specs.every((s) => s.readOnly);
  },
  component: SensorsPanelComponent,
};
