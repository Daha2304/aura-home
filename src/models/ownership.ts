import type { ID } from "./common";

export type OwnershipRefType =
  | "device"
  | "room"
  | "scene"
  | "group"
  | "automation";

/**
 * Generic sharing/ownership descriptor. Not persisted directly — the
 * OwnershipRegistry reads it out of the domain stores per refType.
 */
export interface Ownership {
  refType: OwnershipRefType;
  refId: ID;
  ownerUserId?: ID;
  memberUserIds?: ID[];
  guestUserIds?: ID[];
  sharedRoleIds?: ID[];
  editorUserIds?: ID[];
}
