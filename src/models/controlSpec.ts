import type { Capability } from "./capability";
import type { CapabilityDescriptor, CapabilityCategory } from "./capabilityDescriptor";

export interface ControlSpec {
  /** Stable id: `${deviceId}:${capabilityId}:${controlType}` */
  id: string;
  deviceId: string;
  capabilityId: string;
  capabilityKind: string;
  controlType: string;
  descriptor: CapabilityDescriptor;
  currentValue: unknown;
  /** Wire key used by CommandQueue — equals capability.id. */
  commandKey: string;
  group: CapabilityCategory;
  priority: number;
  readOnly: boolean;
  capability: Capability;
}
