import type { ComponentType } from "react";
import type { Device } from "./device";
import type { StatusTone } from "@/components/ds/controls/StatusBadge";

export type DevicePropertyGroup =
  | "identity"
  | "network"
  | "firmware"
  | "hardware"
  | "diagnostics"
  | "custom";

export type DevicePropertyValue = string | number | boolean | null | undefined;

export interface DevicePropertyDescriptor {
  id: string;
  label: string;
  group: DevicePropertyGroup;
  /** Higher = shown first inside the group. */
  priority: number;
  icon?: ComponentType<{ className?: string }>;
  read: (device: Device) => DevicePropertyValue;
  format?: (value: DevicePropertyValue, device: Device) => string;
  sensitive?: boolean;
  tone?: StatusTone;
}
