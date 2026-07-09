import type { HexColor, ID, IconName, Timestamp } from "./common";

/** @deprecated Legacy string alias. Real roles come from RoleRegistry / roleIds. */
export type UserRole = "admin" | "user" | "guest" | "technician" | string;

export type FavoriteRefType =
  | "device"
  | "room"
  | "scene"
  | "group"
  | "automation"
  | "dashboard"
  | "widget";

export interface FavoriteRef {
  refType: FavoriteRefType;
  refId: ID;
  addedAt?: Timestamp;
}

export interface User {
  id: ID;
  uuid?: string;

  /** Legacy display name (kept for backwards compatibility). */
  name: string;
  firstName?: string;
  lastName?: string;

  avatarUrl?: string;
  email?: string;
  phone?: string;
  description?: string;
  color?: HexColor;
  icon?: IconName;
  language?: string;
  timezone?: string;

  active: boolean;
  isGuest?: boolean;
  isAdmin?: boolean;

  /**
   * @deprecated Kept for backwards compatibility. `roleIds` is authoritative;
   * this string mirrors the first built-in role.
   */
  role: UserRole;
  roleIds: ID[];
  profileId?: ID;

  favorites?: FavoriteRef[];
  custom?: Record<string, unknown>;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
