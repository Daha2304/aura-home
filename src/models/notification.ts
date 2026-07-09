import type { ID, Timestamp } from "./common";
import type { Severity } from "./severity";
import type { EventCategory } from "./eventCategory";

/**
 * Rückwärtskompatibler Alias — bestehende Erzeuger von Notifications
 * verwenden weiterhin diesen Typ. Intern wird `Severity` genutzt.
 */
export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationStatus = "active" | "resolved" | "dismissed";

export type NotificationRefType =
  | "device"
  | "room"
  | "scene"
  | "automation"
  | "group"
  | "system"
  | "custom";

export type NotificationActionKind =
  | "navigate"
  | "run-scene"
  | "run-automation"
  | "open-device"
  | "open-room"
  | "open-group"
  | "open-scene"
  | "open-automation"
  | "open-log"
  | "custom";

export interface NotificationAction {
  id: string;
  label: string;
  icon?: string;
  kind: NotificationActionKind;
  target?: string;
  payload?: Record<string, unknown>;
}

/**
 * Zentrale Notification. Der bestehende Store aus dem Onboarding und die
 * WebSocket-Push-Nachrichten füllen die Kernfelder — alle Ergänzungen sind
 * optional und werden vom Notification Manager gesetzt.
 */
export interface AppNotification {
  id: ID;
  uuid?: string;
  /** Rückwärtskompatibles Feld — akzeptiert alt und neu. */
  severity: Severity;
  title: string;
  message?: string;
  createdAt: Timestamp;
  read?: boolean;
  source?: string;
  meta?: Record<string, unknown>;

  // Ergänzungen (Teil 11) — alle optional
  category?: EventCategory;
  priority?: NotificationPriority;
  icon?: string;
  color?: string;
  refType?: NotificationRefType;
  refId?: ID;
  status?: NotificationStatus;
  acknowledged?: boolean;
  pinned?: boolean;
  archived?: boolean;
  favorite?: boolean;
  tags?: string[];
  actions?: NotificationAction[];
  custom?: Record<string, unknown>;
  /** Vorbereitung Teil 12 — Benutzerbindung. */
  userId?: ID;
  templateId?: string;
}

export interface NotificationInput {
  title: string;
  message?: string;
  severity?: Severity;
  category?: EventCategory;
  priority?: NotificationPriority;
  icon?: string;
  color?: string;
  refType?: NotificationRefType;
  refId?: ID;
  actions?: NotificationAction[];
  tags?: string[];
  source?: string;
  templateId?: string;
  userId?: ID;
  custom?: Record<string, unknown>;
}
