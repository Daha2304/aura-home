import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { PropertyList } from "@/components/devices/properties/PropertyList";
import { devicePropertyRegistry } from "@/services/deviceProperties/DevicePropertyRegistry";

const NetworkPanelComponent = memo(function NetworkPanel({ device }: DevicePanelProps) {
  return <PropertyList device={device} group="network" />;
});

export const networkPanelDescriptor: DevicePanelDescriptor = {
  id: "network",
  title: "Netzwerk",
  group: "network",
  priority: 600,
  isVisible: () => false,
  component: NetworkPanelComponent,
};

const FirmwarePanelComponent = memo(function FirmwarePanel({ device }: DevicePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <PropertyList device={device} group="firmware" />
      <PropertyList device={device} group="hardware" />
    </div>
  );
});

export const firmwarePanelDescriptor: DevicePanelDescriptor = {
  id: "firmware",
  title: "Firmware & Hardware",
  group: "firmware",
  priority: 500,
  isVisible: () => false,
  component: FirmwarePanelComponent,
};
