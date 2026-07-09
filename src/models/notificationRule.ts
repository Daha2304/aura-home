import type { ID, Timestamp } from "./common";
import type { Severity } from "./severity";
import type { EventCategory } from "./eventCategory";
import type { AppNotification } from "./notification";
import { SEVERITY_ORDER } from "./severity";

export interface QuietHours {
  /** Startzeit `HH:MM` (24h). */
  start: string;
  /** Endzeit `HH:MM` (24h). */
  end: string;
  /** Ausnahmen — Severities, die trotzdem durchgelassen werden. */
  bypassSeverities?: Severity[];
}

export interface NotificationRule {
  id: ID;
  label: string;
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  quietHours?: QuietHours;
  muteCategories?: EventCategory[];
  muteSeverityBelow?: Severity;
  mutedRefs?: Array<{ refType: string; refId: ID }>;
  /** Vorbereitung Teil 12 — benutzerabhängige Regeln. */
  userId?: ID;
}

function inQuietHours(now: Date, hours: QuietHours): boolean {
  const [sh, sm] = hours.start.split(":").map(Number);
  const [eh, em] = hours.end.split(":").map(Number);
  const t = now.getHours() * 60 + now.getMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? t >= s && t < e : t >= s || t < e;
}

/**
 * Reine Auswertungsfunktion — kein Nebeneffekt. Liefert `true`, wenn die
 * Notification durch die Regel gestoppt (gemutet) wird.
 */
export function isMutedByRule(
  n: AppNotification,
  rule: NotificationRule,
  now: Date = new Date(),
): boolean {
  if (!rule.enabled) return false;

  if (rule.muteSeverityBelow) {
    if (SEVERITY_ORDER[n.severity] < SEVERITY_ORDER[rule.muteSeverityBelow]) {
      return true;
    }
  }

  if (rule.muteCategories?.length && n.category) {
    if (rule.muteCategories.includes(n.category)) return true;
  }

  if (rule.mutedRefs?.length && n.refType && n.refId) {
    for (const r of rule.mutedRefs) {
      if (r.refType === n.refType && r.refId === n.refId) return true;
    }
  }

  if (rule.quietHours && inQuietHours(now, rule.quietHours)) {
    const bypass = rule.quietHours.bypassSeverities ?? ["critical"];
    if (!bypass.includes(n.severity)) return true;
  }

  if (rule.userId && n.userId && rule.userId !== n.userId) return false;

  return false;
}
