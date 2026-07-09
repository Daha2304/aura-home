import type { HexColor, ID, IconName, Timestamp } from "./common";
import type { PermissionGrant } from "./permission";

export interface Role {
  id: ID;
  /** Stable machine key (e.g. "admin", "user", "guest", "technician"). */
  key: string;
  name: string;
  description?: string;
  icon?: IconName;
  color?: HexColor;
  builtin: boolean;
  permissions: PermissionGrant[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
