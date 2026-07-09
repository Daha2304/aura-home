import type { ID } from "./common";

export type PermissionResource =
  | "device"
  | "room"
  | "group"
  | "scene"
  | "automation"
  | "dashboard"
  | "widget"
  | "notification"
  | "timeline"
  | "analytics"
  | "history"
  | "settings"
  | "user";

export type PermissionAction =
  | "read"
  | "control"
  | "edit"
  | "delete"
  | "manage";

export type PermissionScope =
  | "all"
  | "own"
  | "shared"
  | { refIds: ID[] };

export interface PermissionGrant {
  resource: PermissionResource;
  action: PermissionAction;
  scope?: PermissionScope;
}

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "read",
  "control",
  "edit",
  "delete",
  "manage",
];

export const PERMISSION_RESOURCES: PermissionResource[] = [
  "device",
  "room",
  "group",
  "scene",
  "automation",
  "dashboard",
  "widget",
  "notification",
  "timeline",
  "analytics",
  "history",
  "settings",
  "user",
];
