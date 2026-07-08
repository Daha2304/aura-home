import type { ID } from "./common";
import type { DeviceGroup } from "./deviceGroup";

export interface GroupEvents {
  groupCreated: { group: DeviceGroup };
  groupUpdated: { group: DeviceGroup; previous: DeviceGroup };
  groupDeleted: { id: ID };
  groupsImported: { count: number };
  changed: void;
}
