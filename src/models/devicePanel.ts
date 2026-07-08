import type { ComponentType } from "react";
import type { Device } from "./device";

export type DevicePanelGroup =
  | "hero"
  | "status"
  | "controls"
  | "information"
  | "network"
  | "sensors"
  | "diagnostics"
  | "firmware"
  | "developer"
  | "custom";

export interface DevicePanelDescriptor {
  id: string;
  title?: string;
  icon?: ComponentType<{ className?: string }>;
  group: DevicePanelGroup;
  /** Higher = appears earlier. */
  priority: number;
  /** Return true to render this panel for the given device. */
  isVisible: (device: Device) => boolean;
  component: ComponentType<DevicePanelProps>;
}

export interface DevicePanelProps {
  device: Device;
}
