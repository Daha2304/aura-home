import type { HexColor, ID, IconName, Timestamp } from "./common";

export interface Profile {
  id: ID;
  name: string;
  icon: IconName;
  color: HexColor;
  description?: string;

  /** Optional defaults applied when this profile becomes active. */
  defaultDashboardId?: ID;
  homeRoute?: string;
  notificationPreferencesId?: ID;
  themeId?: string;

  /** Built-in profiles from the ProfileRegistry are marked here. */
  builtin?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
