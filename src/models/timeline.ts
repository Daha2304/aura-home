import type { ID, Timestamp } from "./common";
import type { Severity } from "./severity";
import type { EventCategory } from "./eventCategory";

/**
 * Datenmodell + Erweiterungspunkt für die Timeline (Teil 10).
 *
 * Alle Event-Quellen der App registrieren sich ausschließlich über
 * {@link TimelineSourceDescriptor} bei der TimelineSourceRegistry. Die
 * Timeline-Engine selbst enthält keinerlei quellenspezifische Logik –
 * kein Switch, kein If auf `source`. Neue Quellen (z. B. Notifications
 * in Teil 11) benötigen ausschließlich einen weiteren Descriptor.
 */
export type TimelineSourceKind =
  | "automation"
  | "scene"
  | "device"
  | "notification"
  | "group"
  | "system"
  | "user"
  | "custom";

/**
 * Ein Eintrag in der zentralen Timeline. Bestehende Erzeuger aus Teil 9
 * bleiben kompatibel – alle neuen Felder sind optional.
 */
export interface TimelineEntry {
  id: ID;
  source: TimelineSourceKind;
  /** Optionaler Bezug (z. B. Automation-ID, Szenen-ID, Geräte-ID). */
  refId?: ID;
  /** Fein granulierter Ereignistyp aus Sicht der Quelle. */
  kind: string;
  timestamp: Timestamp;
  title?: string;
  detail?: string;
  icon?: string;
  color?: string;
  payload?: unknown;

  // ---- Ergänzungen (Teil 10) — alle optional ---------------------------

  /** Gemeinsames Severity-Modell, siehe {@link Severity}. */
  severity?: Severity;
  /** Gemeinsame Event-Kategorie, siehe {@link EventCategory}. */
  category?: EventCategory;
  /** Vom Benutzer bestätigt (Event Center / Notifications). */
  acknowledged?: boolean;
  /** Vom Benutzer angepinnt. */
  pinned?: boolean;
  /** Aus der Live-Ansicht archiviert. */
  archived?: boolean;
  /** Version des erzeugenden Sources (Migrations-/Format-Kompatibilität). */
  sourceVersion?: string;
}

export interface TimelineFilter {
  source?: TimelineSourceKind | TimelineSourceKind[];
  refId?: ID;
  deviceId?: ID;
  roomId?: ID;
  groupId?: ID;
  sceneId?: ID;
  automationId?: ID;
  category?: EventCategory | EventCategory[];
  severity?: Severity | Severity[];
  minSeverity?: Severity;
  since?: Timestamp;
  until?: Timestamp;
  kind?: string | string[];
  acknowledged?: boolean;
  pinned?: boolean;
  archived?: boolean;
  search?: string;
  limit?: number;
}

/**
 * Deskriptor einer Timeline-Quelle. Wird bei der TimelineSourceRegistry
 * registriert. Alles, was die Timeline-Engine über eine Quelle wissen
 * muss, steht hier — es gibt keinen weiteren Sonderweg.
 */
export interface TimelineSourceDescriptor {
  id: string;
  label: string;
  source: TimelineSourceKind;
  /** Standard-Kategorie für Einträge dieser Quelle (überschreibbar). */
  category?: EventCategory;
  /** Standard-Severity für Einträge dieser Quelle (überschreibbar). */
  defaultSeverity?: Severity;
  icon?: string;
  color?: string;
  /** Versionierung des Descriptors, wird in TimelineEntry.sourceVersion gespiegelt. */
  sourceVersion?: string;
  /** Quelle standardmäßig aktiv? Kann in der UI umgeschaltet werden. */
  enabled?: boolean;
  /**
   * Liefert historische Einträge (Snapshot). Live-Updates kommen über
   * {@link subscribe}.
   */
  list?(): TimelineEntry[];
  /** Meldet neue Einträge. Rückgabewert deabonniert. */
  subscribe(emit: (entry: TimelineEntry) => void): () => void;
}

/**
 * Persistenter Timeline-Historien-Eintrag — strukturell identisch zu
 * {@link TimelineEntry}. Nicht zu verwechseln mit dem Geräte-Historien-Eintrag
 * aus `models/history.ts`, der einzelne Zustands-Deltas beschreibt.
 */
export type TimelineHistoryEntry = TimelineEntry;
