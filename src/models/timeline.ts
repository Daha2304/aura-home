import type { ID, Timestamp } from "./common";

/**
 * Datenmodell + Erweiterungspunkt für die spätere Timeline-Ansicht
 * (Teil 10). Automation-, Szenen-, Geräte- und Notification-Feeds werden
 * dann über TimelineSourceDescriptor-Instanzen zusammengeführt. Hier
 * wird noch keine Timeline gerendert.
 */
export type TimelineSourceKind =
  | "automation"
  | "scene"
  | "device"
  | "notification";

export interface TimelineEntry {
  id: ID;
  source: TimelineSourceKind;
  refId: ID;
  kind: string;
  timestamp: Timestamp;
  title?: string;
  detail?: string;
  payload?: unknown;
}

export interface TimelineSourceDescriptor {
  id: string;
  label: string;
  source: TimelineSourceKind;
  /**
   * Liefert die aktuell bekannten Einträge dieser Quelle. Neue
   * Einträge werden über {@link subscribe} nachgeschoben.
   */
  list(): TimelineEntry[];
  subscribe(cb: (entry: TimelineEntry) => void): () => void;
}
