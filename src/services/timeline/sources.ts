import type {
  TimelineEntry,
  TimelineSourceDescriptor,
} from "@/models/timeline";
import { createId } from "@/utils/ids";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { sceneEvents, groupEvents } from "@/services/scenes/SceneEvents";
import { automationEvents } from "@/services/automations/AutomationEvents";

function now(): number {
  return Date.now();
}

function makeEntry(
  partial: Omit<TimelineEntry, "id" | "timestamp"> & {
    id?: string;
    timestamp?: number;
  },
): TimelineEntry {
  return {
    id: partial.id ?? createId("tl"),
    timestamp: partial.timestamp ?? now(),
    ...partial,
  };
}

/* -------------------------------------------------------------------------- */
/* Devices                                                                    */
/* -------------------------------------------------------------------------- */

export const deviceTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.device",
  label: "Geräte",
  source: "device",
  category: "device",
  defaultSeverity: "info",
  icon: "plug",
  enabled: true,
  sourceVersion: "1",
  subscribe(emit) {
    const d = wsManager.dispatcher;
    const offs: Array<() => void> = [
      d.on("device.added", (e) =>
        emit(makeEntry({
          source: "device", kind: "added", refId: e.device.id,
          title: `Gerät hinzugefügt: ${e.device.name ?? e.device.id}`,
          category: "device", severity: "success",
          payload: { deviceId: e.device.id },
        })),
      ),
      d.on("device.removed", (e) =>
        emit(makeEntry({
          source: "device", kind: "removed", refId: e.deviceId,
          title: `Gerät entfernt: ${e.deviceId}`,
          category: "device", severity: "warning",
          payload: { deviceId: e.deviceId },
        })),
      ),
      d.on("device.online", (e) =>
        emit(makeEntry({
          source: "device", kind: e.online ? "online" : "offline",
          refId: e.deviceId,
          title: `${e.deviceId} ${e.online ? "online" : "offline"}`,
          category: "device",
          severity: e.online ? "success" : "warning",
          payload: { deviceId: e.deviceId, online: e.online },
        })),
      ),
    ];
    return () => offs.forEach((o) => o());
  },
};

/* -------------------------------------------------------------------------- */
/* Scenes                                                                     */
/* -------------------------------------------------------------------------- */

export const sceneTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.scene",
  label: "Szenen",
  source: "scene",
  category: "scene",
  defaultSeverity: "info",
  icon: "sparkles",
  enabled: true,
  sourceVersion: "1",
  subscribe(emit) {
    const offs: Array<() => void> = [
      sceneEvents.on("sceneExecutionStarted", ({ execution }) =>
        emit(makeEntry({
          source: "scene", kind: "started", refId: execution.sceneId,
          title: "Szene gestartet", category: "scene", severity: "info",
          payload: { sceneId: execution.sceneId, executionId: execution.id },
        })),
      ),
      sceneEvents.on("sceneExecutionCompleted", ({ execution }) =>
        emit(makeEntry({
          source: "scene", kind: "completed", refId: execution.sceneId,
          title: "Szene abgeschlossen", category: "scene", severity: "success",
          payload: { sceneId: execution.sceneId, executionId: execution.id },
        })),
      ),
      sceneEvents.on("sceneExecutionFailed", ({ execution, reason }) =>
        emit(makeEntry({
          source: "scene", kind: "failed", refId: execution.sceneId,
          title: "Szene fehlgeschlagen", detail: reason,
          category: "scene", severity: "error",
          payload: { sceneId: execution.sceneId, executionId: execution.id },
        })),
      ),
      sceneEvents.on("sceneCreated", ({ scene }) =>
        emit(makeEntry({
          source: "scene", kind: "created", refId: scene.id,
          title: `Szene erstellt: ${scene.name}`,
          category: "scene", severity: "success",
          payload: { sceneId: scene.id },
        })),
      ),
      sceneEvents.on("sceneDeleted", ({ id }) =>
        emit(makeEntry({
          source: "scene", kind: "deleted", refId: id,
          title: `Szene gelöscht`, category: "scene", severity: "warning",
          payload: { sceneId: id },
        })),
      ),
    ];
    return () => offs.forEach((o) => o());
  },
};

/* -------------------------------------------------------------------------- */
/* Groups                                                                     */
/* -------------------------------------------------------------------------- */

export const groupTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.group",
  label: "Gerätegruppen",
  source: "group",
  category: "group",
  defaultSeverity: "info",
  icon: "layers",
  enabled: true,
  sourceVersion: "1",
  subscribe(emit) {
    const offs: Array<() => void> = [
      groupEvents.on("groupCreated", ({ group }) =>
        emit(makeEntry({
          source: "group", kind: "created", refId: group.id,
          title: `Gruppe erstellt: ${group.name}`,
          category: "group", severity: "success",
          payload: { groupId: group.id },
        })),
      ),
      groupEvents.on("groupUpdated", ({ group }) =>
        emit(makeEntry({
          source: "group", kind: "updated", refId: group.id,
          title: `Gruppe aktualisiert: ${group.name}`,
          category: "group", severity: "info",
          payload: { groupId: group.id },
        })),
      ),
      groupEvents.on("groupDeleted", ({ id }) =>
        emit(makeEntry({
          source: "group", kind: "deleted", refId: id,
          title: `Gruppe gelöscht`, category: "group", severity: "warning",
          payload: { groupId: id },
        })),
      ),
    ];
    return () => offs.forEach((o) => o());
  },
};

/* -------------------------------------------------------------------------- */
/* Automations                                                                */
/* -------------------------------------------------------------------------- */

export const automationTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.automation",
  label: "Automationen",
  source: "automation",
  category: "automation",
  defaultSeverity: "info",
  icon: "workflow",
  enabled: true,
  sourceVersion: "1",
  subscribe(emit) {
    const offs: Array<() => void> = [
      automationEvents.on("automationTriggered", ({ id, triggerId }) =>
        emit(makeEntry({
          source: "automation", kind: "triggered", refId: id,
          title: "Automation ausgelöst",
          category: "automation", severity: "info",
          payload: { automationId: id, triggerId },
        })),
      ),
      automationEvents.on("automationStarted", ({ execution }) =>
        emit(makeEntry({
          source: "automation", kind: "started", refId: execution.automationId,
          title: "Automation gestartet", category: "automation", severity: "info",
          payload: { automationId: execution.automationId, executionId: execution.id },
        })),
      ),
      automationEvents.on("automationCompleted", ({ execution }) =>
        emit(makeEntry({
          source: "automation", kind: "completed", refId: execution.automationId,
          title: "Automation abgeschlossen", category: "automation", severity: "success",
          payload: { automationId: execution.automationId, executionId: execution.id },
        })),
      ),
      automationEvents.on("automationFailed", ({ execution, reason }) =>
        emit(makeEntry({
          source: "automation", kind: "failed", refId: execution.automationId,
          title: "Automation fehlgeschlagen", detail: reason,
          category: "automation", severity: "error",
          payload: { automationId: execution.automationId, executionId: execution.id },
        })),
      ),
      automationEvents.on("automationCancelled", ({ execution }) =>
        emit(makeEntry({
          source: "automation", kind: "cancelled", refId: execution.automationId,
          title: "Automation abgebrochen", category: "automation", severity: "warning",
          payload: { automationId: execution.automationId, executionId: execution.id },
        })),
      ),
    ];
    return () => offs.forEach((o) => o());
  },
};

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export const systemTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.system",
  label: "System",
  source: "system",
  category: "system",
  defaultSeverity: "info",
  icon: "cpu",
  enabled: true,
  sourceVersion: "1",
  subscribe(emit) {
    const offs: Array<() => void> = [
      wsManager.on("connected", () =>
        emit(makeEntry({
          source: "system", kind: "ws.connected",
          title: "Verbindung hergestellt",
          category: "network", severity: "success",
        })),
      ),
      wsManager.on("disconnected", ({ code, reason }) =>
        emit(makeEntry({
          source: "system", kind: "ws.disconnected",
          title: "Verbindung getrennt",
          detail: reason ?? (code !== undefined ? `Code ${code}` : undefined),
          category: "network", severity: "warning",
        })),
      ),
      wsManager.on("authenticated", () =>
        emit(makeEntry({
          source: "system", kind: "auth.ok",
          title: "Authentifiziert",
          category: "security", severity: "success",
        })),
      ),
      wsManager.on("authentication_failed", ({ reason }) =>
        emit(makeEntry({
          source: "system", kind: "auth.failed",
          title: "Authentifizierung fehlgeschlagen",
          detail: reason,
          category: "security", severity: "error",
        })),
      ),
      wsManager.on("error", (payload) =>
        emit(makeEntry({
          source: "system", kind: "error",
          title: payload.message,
          category: "system", severity: "error",
          payload,
        })),
      ),
    ];
    return () => offs.forEach((o) => o());
  },
};

/* -------------------------------------------------------------------------- */
/* Descriptor-Platzhalter (deaktiviert)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Placeholder — wird in Teil 11 (Notification Engine) aktiviert.
 * Bereits als Descriptor registriert, damit die Erweiterungspunkt-Garantie
 * (keine Switch/If-Ergänzung) sichtbar bewiesen ist.
 */
export const notificationTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.notification",
  label: "Benachrichtigungen",
  source: "notification",
  category: "system",
  defaultSeverity: "info",
  icon: "bell",
  enabled: false,
  sourceVersion: "0",
  subscribe() {
    return () => {};
  },
};

/** Placeholder — Benutzeraktivität, aktiviert sich mit späterer Auth. */
export const userTimelineSource: TimelineSourceDescriptor = {
  id: "timeline.source.user",
  label: "Benutzer",
  source: "user",
  category: "user",
  defaultSeverity: "info",
  icon: "user",
  enabled: false,
  sourceVersion: "0",
  subscribe() {
    return () => {};
  },
};

export const BUILTIN_TIMELINE_SOURCES: TimelineSourceDescriptor[] = [
  deviceTimelineSource,
  sceneTimelineSource,
  groupTimelineSource,
  automationTimelineSource,
  systemTimelineSource,
  notificationTimelineSource,
  userTimelineSource,
];
