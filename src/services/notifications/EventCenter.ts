import { notificationRegistry } from "./NotificationRegistry";
import { notificationManager } from "./NotificationManager";
import { BUILTIN_NOTIFICATION_PRODUCERS } from "./producers";
import { registerBuiltinNotificationActions } from "./actions";
import {
  timelineSourceRegistry,
} from "@/services/timeline/TimelineSourceRegistry";
import type { TimelineSourceDescriptor, TimelineEntry } from "@/models/timeline";
import { useNotificationPreferencesStore } from "@/store/slices/notificationPreferencesStore";
import { createLogger } from "@/services/logger/Logger";
import { createId } from "@/utils/ids";
import type { AppNotification } from "@/models/notification";

const log = createLogger("event-center");

let started = false;
let unsubs: Array<() => void> = [];

function toTimelineEntry(n: AppNotification): TimelineEntry {
  return {
    id: `nt_${n.id}`,
    source: "notification",
    kind: n.severity,
    timestamp: n.createdAt,
    title: n.title,
    detail: n.message,
    icon: n.icon ?? "bell",
    color: n.color,
    refId: n.refId,
    severity: n.severity,
    category: n.category,
    payload: { notificationId: n.id, refType: n.refType },
    sourceVersion: "1",
  };
}

/**
 * Aktivierter Timeline-Adapter für Notifications. Ersetzt den in Teil 10
 * angelegten Platzhalter — Notifications erscheinen ausschließlich hierüber
 * in der Timeline, kein Producer schreibt selbst.
 */
function makeNotificationTimelineSource(): TimelineSourceDescriptor {
  return {
    id: "timeline.source.notification",
    label: "Benachrichtigungen",
    source: "notification",
    category: "system",
    defaultSeverity: "info",
    icon: "bell",
    enabled: true,
    sourceVersion: "1",
    subscribe(emit) {
      const offPushed = notificationManager.events.on(
        "pushed",
        ({ notification, muted }) => {
          const prefs = useNotificationPreferencesStore.getState().preferences;
          if (muted && !prefs.archiveMutedInTimeline) return;
          emit(toTimelineEntry(notification));
        },
      );
      return () => offPushed();
    },
  };
}

export function startEventCenter(): void {
  if (started) return;
  if (typeof window === "undefined") return;
  started = true;

  registerBuiltinNotificationActions();

  // Producer registrieren und starten.
  for (const p of BUILTIN_NOTIFICATION_PRODUCERS) {
    notificationRegistry.registerProducer(p);
    if (p.enabled === false) continue;
    const off = p.subscribe((input) => {
      notificationManager.push({
        ...input,
        severity: input.severity ?? p.defaultSeverity ?? "info",
        category: input.category ?? p.category,
        icon: input.icon ?? p.icon,
        color: input.color ?? p.color,
        source: input.source ?? p.id,
      });
    });
    unsubs.push(off);
  }

  // Notification-Timeline-Source registrieren (ersetzt Placeholder aus Teil 10).
  const existing = timelineSourceRegistry.get("timeline.source.notification");
  if (existing) timelineSourceRegistry.unregister(existing.id);
  const off = timelineSourceRegistry.register(makeNotificationTimelineSource());
  unsubs.push(off);

  // Producer, die später hinzukommen, ebenfalls automatisch starten.
  const offReg = notificationRegistry.events.on("registered", ({ descriptor }) => {
    if (descriptor.enabled === false) return;
    const stop = descriptor.subscribe((input) =>
      notificationManager.push({
        ...input,
        severity: input.severity ?? descriptor.defaultSeverity ?? "info",
        category: input.category ?? descriptor.category,
        source: input.source ?? descriptor.id,
      }),
    );
    unsubs.push(stop);
  });
  unsubs.push(offReg);

  log.info(
    "event center started, producers:",
    notificationRegistry.listProducers().map((p) => p.id).join(", "),
  );
}

export function stopEventCenter(): void {
  if (!started) return;
  for (const off of unsubs) off();
  unsubs = [];
  started = false;
}

/** Hilfsfunktion, damit externe Aufrufer bequem Notifications erzeugen. */
export function notify(
  ...args: Parameters<typeof notificationManager.push>
): AppNotification {
  return notificationManager.push(...args);
}

export function _nextId(): string {
  return createId("n");
}
