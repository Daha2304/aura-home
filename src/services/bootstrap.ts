import { createLogger, setGlobalLogLevel } from "@/services/logger/Logger";
import { errorBus } from "@/services/errors/ErrorBus";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { deviceManager } from "@/services/deviceManager/DeviceManager";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useNotificationsStore } from "@/store/slices/notificationsStore";
import { useSettingsStore } from "@/store/slices/settingsStore";

const log = createLogger("bootstrap");

let started = false;
let unsubscribers: Array<() => void> = [];
let unsubActiveServer: (() => void) | null = null;

/**
 * Startet die Kommunikationsschicht:
 * - verdrahtet WebSocketManager-Events mit dem ConnectionStore
 * - startet den DeviceManager
 * - abonniert Notifications und Server-Fehler
 * - reagiert automatisch auf einen Wechsel des aktiven Servers
 *
 * Idempotent — mehrfacher Aufruf ist unschädlich.
 */
export function startCommunicationLayer(): void {
  if (started) return;
  if (typeof window === "undefined") return; // strikt client-only
  started = true;
  log.info("starting communication layer");

  const conn = useConnectionStore.getState();

  unsubscribers.push(
    wsManager.on("status", (status) => conn.setStatus(status)),
    wsManager.on("connected", () => {
      useConnectionStore.getState().markConnected();
    }),
    wsManager.on("authenticated", () => {
      useConnectionStore.getState().setAuthenticated(true);
    }),
    wsManager.on("authentication_failed", ({ reason }) => {
      useConnectionStore.getState().setAuthenticated(false);
      useConnectionStore.getState().setError(reason ?? "Auth fehlgeschlagen");
    }),
    wsManager.on("disconnected", () => {
      useConnectionStore.getState().setAuthenticated(false);
    }),
    wsManager.on("heartbeat", ({ latencyMs }) => {
      useConnectionStore.getState().setLatency(latencyMs);
    }),
    wsManager.on("reconnecting", ({ attempt }) => {
      useConnectionStore.getState().setReconnectAttempt(attempt);
    }),
    wsManager.on("error", (payload) => {
      useConnectionStore.getState().setError(payload.message);
    }),
    wsManager.dispatcher.on("notification", (ev) => {
      useNotificationsStore.getState().push(ev.notification);
    }),
    errorBus.on("error", (payload) => {
      log.debug("error bus:", payload.kind, payload.message);
    }),
  );

  deviceManager.start();

  // Aktiven Server beobachten und Manager entsprechend konfigurieren/(re)verbinden.
  const applyActiveServer = () => {
    const state = useSettingsStore.getState();
    setGlobalLogLevel(state.debugWebSocket ? "debug" : "info");
    const server = state.servers.find((s) => s.id === state.activeServerId);
    if (!server) return;
    wsManager.configure({
      server,
      debug: state.debugWebSocket,
    });
    if (server.autoConnect) {
      void wsManager.connect();
    }
  };

  unsubActiveServer = useSettingsStore.subscribe((s, prev) => {
    if (
      s.activeServerId !== prev.activeServerId ||
      s.debugWebSocket !== prev.debugWebSocket ||
      s.servers !== prev.servers
    ) {
      applyActiveServer();
    }
  });
  applyActiveServer();
}

export function stopCommunicationLayer(): void {
  if (!started) return;
  for (const off of unsubscribers) off();
  unsubscribers = [];
  unsubActiveServer?.();
  unsubActiveServer = null;
  deviceManager.stop();
  wsManager.disconnect();
  started = false;
}
