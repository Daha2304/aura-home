import type { ID, IconName, Timestamp } from "./common";
import type { PermissionAction, PermissionResource } from "./permission";

/**
 * Generic search & command platform (Teil 13).
 *
 * All external code speaks in these types. New search sources are added
 * ausschließlich über SearchProviderRegistry — keine Switch/If-Kaskaden.
 */

export type SearchCategory =
  | "device"
  | "room"
  | "scene"
  | "group"
  | "automation"
  | "user"
  | "dashboard"
  | "widget"
  | "timeline"
  | "history"
  | "analytics"
  | "notification"
  | "settings"
  | "logs"
  | "navigation"
  | "command"
  | "custom";

export type SearchResultType =
  | "entity"
  | "command"
  | "action"
  | "navigation"
  | "suggestion"
  | "history"
  | "favorite"
  | "custom";

export interface SearchAction {
  id: string;
  label: string;
  icon?: IconName;
  primary?: boolean;
  shortcut?: string;
  destructive?: boolean;
  run: (ctx: SearchContext) => void | Promise<void>;
}

export interface SearchResult {
  id: string;
  providerId: string;
  category: SearchCategory;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: IconName;
  color?: string;
  priority?: number;
  /** Provider-supplied base relevance in [0..1]. Combined with ranking factors. */
  relevance?: number;
  favorite?: boolean;
  recentlyUsed?: Timestamp;
  /** Optional permission gate. Filtered by SearchManager if user lacks access. */
  permission?: { resource: PermissionResource; action?: PermissionAction; refId?: ID };
  /** Optional in-app link. If set, the default action navigates here. */
  navigateTo?: string;
  /** Data ref for favorites / recent lookups (see FavoriteRef). */
  ref?: { refType: string; refId: ID };
  actions?: SearchAction[];
  custom?: Record<string, unknown>;
}

export interface SearchContext {
  query: string;
  userId?: ID;
  timestamp: Timestamp;
  /** Free-form flags providers may inspect (e.g. `paletteOpen: true`). */
  flags?: Record<string, unknown>;
  navigate?: (to: string) => void;
}

export interface SearchQuery {
  text: string;
  category?: SearchCategory;
  limit?: number;
}

export interface SearchScore {
  relevance: number;
  favorite: number;
  recency: number;
  frequency: number;
  priority: number;
  total: number;
}
