import type { ID } from "./common";

export type RelationshipKind =
  | "group"
  | "master"
  | "slave"
  | "child"
  | "parent"
  | "gateway"
  | "bridge"
  | "room"
  | "zone"
  | "virtual";

export interface DeviceRelationship {
  kind: RelationshipKind;
  targetId: ID;
  meta?: Record<string, unknown>;
}
