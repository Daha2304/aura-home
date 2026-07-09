import type { NotificationProducerDescriptor } from "./NotificationRegistry";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { automationEvents } from "@/services/automations/AutomationEvents";
import { sceneEvents, groupEvents } from "@/services/scenes/SceneEvents";

/**
 * Produzenten für Notifications. Jeder Producer registriert sich exakt
 * einmal in der `NotificationRegistry` und emittiert generische Inputs.
 * Kein Producer schreibt selbst in Store oder Timeline.
 */

export const deviceNotificationProducer: NotificationProducerDescriptor = {
  id: "notif.producer.device",
  label: "Geräte",
  category: "device",
  defaultSeverity: "info",
  icon: "plug",
  enabled: true,
  subscribe(emit) {
    const d = wsManager.dispatcher;
    const offs: Array<() => void> = [
      d.on("device.online", (e) => {
        if (e.online) return;
        emit({
          title: `Gerät offline`,
          message: String(e.deviceId),
          severity: "warning",
          category: "device",
          refType: "device",
          refId: e.deviceId,
          source: "device",
          actions: [
            { id: "open", label: "Öffnen", kind: "open-device", target: e.deviceId },
          ],
        });
      }),
    ];
    return () => offs.forEach((o) => o());
  },
};

export const automationNotificationProducer: NotificationProducerDescriptor = {
  id: "notif.producer.automation",
  label: "Automationen",
  category: "automation",
  defaultSeverity: "info",
  icon: "workflow",
  enabled: true,
  subscribe(emit) {
    const offs: Array<() => void> = [];
    // Best-effort: automationEvents unterstützt typischerweise diese Events.
    const anyEv = automationEvents as unknown as {
      on: (k: string, cb: (p: any) => void) => () => void;
    };
    if (typeof anyEv.on === "function") {
      offs.push(
        anyEv.on("failed", (e: any) => {
          emit({
            title: `Automation fehlgeschlagen`,
            message: e?.error?.message ?? e?.automationId,
            severity: "error",
            category: "automation",
            refType: "automation",
            refId: e?.automationId,
            source: "automation",
            actions: [
              {
                id: "open",
                label: "Öffnen",
                kind: "open-automation",
                target: e?.automationId,
              },
              { id: "log", label: "Log", kind: "open-log", payload: { refId: e?.automationId } },
            ],
          });
        }),
      );
    }
    return () => offs.forEach((o) => o());
  },
};

export const sceneNotificationProducer: NotificationProducerDescriptor = {
  id: "notif.producer.scene",
  label: "Szenen",
  category: "scene",
  defaultSeverity: "info",
  icon: "sparkles",
  enabled: true,
  subscribe(emit) {
    const anyEv = sceneEvents as unknown as {
      on: (k: string, cb: (p: any) => void) => () => void;
    };
    const offs: Array<() => void> = [];
    if (typeof anyEv.on === "function") {
      offs.push(
        anyEv.on("failed", (e: any) =>
          emit({
            title: `Szene fehlgeschlagen`,
            message: e?.error?.message ?? e?.sceneId,
            severity: "error",
            category: "scene",
            refType: "scene",
            refId: e?.sceneId,
            source: "scene",
          }),
        ),
      );
    }
    return () => offs.forEach((o) => o());
  },
};

export const groupNotificationProducer: NotificationProducerDescriptor = {
  id: "notif.producer.group",
  label: "Gruppen",
  category: "group",
  defaultSeverity: "info",
  icon: "layers",
  enabled: true,
  subscribe(emit) {
    const anyEv = groupEvents as unknown as {
      on: (k: string, cb: (p: any) => void) => () => void;
    };
    const offs: Array<() => void> = [];
    if (typeof anyEv.on === "function") {
      offs.push(
        anyEv.on("failed", (e: any) =>
          emit({
            title: `Gruppe fehlgeschlagen`,
            message: e?.error?.message ?? e?.groupId,
            severity: "error",
            category: "group",
            refType: "group",
            refId: e?.groupId,
            source: "group",
          }),
        ),
      );
    }
    return () => offs.forEach((o) => o());
  },
};

export const systemNotificationProducer: NotificationProducerDescriptor = {
  id: "notif.producer.system",
  label: "System",
  category: "system",
  defaultSeverity: "info",
  icon: "cpu",
  enabled: true,
  subscribe(emit) {
    const offs: Array<() => void> = [
      wsManager.on("authentication_failed", ({ reason }) =>
        emit({
          title: "Authentifizierung fehlgeschlagen",
          message: reason,
          severity: "error",
          category: "system",
          refType: "system",
          source: "websocket",
        }),
      ),
      wsManager.on("error", (p) =>
        emit({
          title: "Verbindungsfehler",
          message: p.message,
          severity: "warning",
          category: "network",
          refType: "system",
          source: "websocket",
        }),
      ),
    ];
    return () => offs.forEach((o) => o());
  },
};

export const BUILTIN_NOTIFICATION_PRODUCERS: NotificationProducerDescriptor[] = [
  deviceNotificationProducer,
  automationNotificationProducer,
  sceneNotificationProducer,
  groupNotificationProducer,
  systemNotificationProducer,
];
