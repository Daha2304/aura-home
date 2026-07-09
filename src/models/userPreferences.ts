import type { ID, Timestamp } from "./common";
import type { FavoriteRef } from "./user";

export interface RecentPageEntry {
  ref: string;
  label?: string;
  timestamp: Timestamp;
}

export interface AccessibilityPreferences {
  reduceMotion?: boolean;
  largeText?: boolean;
  highContrast?: boolean;
}

export interface UserPreferences {
  userId: ID;
  themeId?: string;
  dashboardId?: ID;
  homeRoute?: string;
  widgetLayoutId?: ID;
  notificationPreferencesId?: ID;
  language?: string;
  units?: "metric" | "imperial";
  animations?: "full" | "reduced" | "none";
  accessibility?: AccessibilityPreferences;
  favorites: FavoriteRef[];
  recentPages: RecentPageEntry[];
  updatedAt?: Timestamp;
}
