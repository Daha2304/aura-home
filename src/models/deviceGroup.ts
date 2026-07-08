import type { ID, IconName, Timestamp } from "./common";

export type DeviceGroupKind =
  | "light"
  | "outlet"
  | "blind"
  | "thermostat"
  | "sensor"
  | "media"
  | "mixed"
  | "virtual"
  | "dynamic";

export type DeviceGroupStatus = "active" | "inactive" | "partial" | "unknown";

/**
 * A virtual device group. Groups can contain other groups; the
 * GroupManager guarantees cycles are rejected on write and the
 * GroupResolver expands membership cycle-safely.
 */
export interface DeviceGroup {
  id: ID;
  uuid: string;
  name: string;
  description?: string;
  icon: IconName;
  color?: string;
  category?: string;
  kind: DeviceGroupKind;
  favorite: boolean;
  tags: string[];
  version: number;
  /** Direct device children. */
  deviceIds: ID[];
  /** Nested group children — cycle-checked on write. */
  groupIds: ID[];
  /** Capability ids this group exposes (intersection over members). */
  capabilities: string[];
  status: DeviceGroupStatus;
  custom?: Record<string, unknown>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  order: number;
}
