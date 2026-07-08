import { createLogger, setGlobalLogLevel } from "@/services/logger/Logger";
import { errorBus } from "@/services/errors/ErrorBus";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { deviceManager } from "@/services/deviceManager/DeviceManager";
import { discoveryEngine } from "@/services/discovery/DiscoveryEngine";
import { commandQueue } from "@/services/commands/CommandQueue";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { useNotificationsStore } from "@/store/slices/notificationsStore";
import { useSettingsStore } from "@/store/slices/settingsStore";

// Built-in-Gerätetypen und Registry-Store einmalig als Side-Effect laden.
import "@/services/registry/builtin";
import "@/store/slices/registryStore";

// Widget-Registry & Widget-Store (Plugin-Einstiegspunkt, Teil 5A).
import "@/services/widgets/builtin";
import "@/store/slices/widgetRegistryStore";
import { dashboardManager } from "@/services/dashboards/DashboardManager";
import { registerBuiltinRoomTypes, roomManager } from "@/services/rooms";
import { bootstrapIntelligence, stopIntelligence } from "@/services/intelligence";
import { bootstrapDevicePresentation } from "@/services/devices/presentation";
import { bootstrapCapabilityRegistry } from "@/services/capabilities";
import { registerBuiltinControls } from "@/components/devices/controls";


const log = createLogger("bootstrap");

let started = false;
let unsubscribers: Array<() => void> = [];
let unsubActiveServer: (() => void) | null = null;

/**
 * Startet den kompletten Kommunikations- und Discovery-Stack:
 * - Registry (Built-ins per Import-Side-Effect)
 * - WebSocketManager ↔ ConnectionStore
 * - DeviceManager
 * - DiscoveryEngine (inkl. Cache-Hydration)
 * - CommandQueue
 *
 * Idempotent — mehrfacher Aufruf ist unschädlich.
 */
export function startCommunicationLayer(): void {
  if (started) return;
  if (typeof window === "undefined") return; // strikt client-only
  started = true;
  log.info("starting communication layer");

  unsubscribers.push(
    wsManager.on("status", (status) => useConnectionStore.getState().setStatus(status)),
    wsManager.on("connected", () => useConnectionStore.getState().markConnected()),
    wsManager.on("authenticated", () => useConnectionStore.getState().setAuthenticated(true)),
    wsManager.on("authentication_failed", ({ reason }) => {
      useConnectionStore.getState().setAuthenticated(false);
      useConnectionStore.getState().setError(reason ?? "Auth fehlgeschlagen");
    }),
    wsManager.on("disconnected", () => useConnectionStore.getState().setAuthenticated(false)),
    wsManager.on("heartbeat", ({ latencyMs }) =>
      useConnectionStore.getState().setLatency(latencyMs),
    ),
    wsManager.on("reconnecting", ({ attempt }) =>
      useConnectionStore.getState().setReconnectAttempt(attempt),
    ),
    wsManager.on("error", (payload) =>
      useConnectionStore.getState().setError(payload.message),
    ),
    wsManager.dispatcher.on("notification", (ev) =>
      useNotificationsStore.getState().push(ev.notification),
    ),
    errorBus.on("error", (payload) => {
      log.debug("error bus:", payload.kind, payload.code ?? "-", payload.message);
      useDiscoveryStore.getState().pushError(payload);
    }),
  );

  // Dashboards aus Cache hydratisieren und Bootstrap-Dashboard sicherstellen.
  dashboardManager.hydrate();
  dashboardManager.ensureBootstrapDashboard();

  // Raumverwaltung starten: Registry mit Built-ins, dann Persistenz hydrieren.
  registerBuiltinRoomTypes();
  roomManager.hydrate();

  deviceManager.start();
  discoveryEngine.start();
  commandQueue.start();

  // Intelligence Layer nach Registry / Rooms / DeviceManager starten.
  bootstrapIntelligence();
  bootstrapDevicePresentation();


  // Aktiven Server beobachten und Manager entsprechend (neu) konfigurieren.
  const applyActiveServer = () => {
    const state = useSettingsStore.getState();
    setGlobalLogLevel(state.debugWebSocket ? "debug" : "info");
    const server = state.servers.find((s) => s.id === state.activeServerId);
    if (!server) return;
    wsManager.configure({ server, debug: state.debugWebSocket });
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
  stopIntelligence();
  commandQueue.stop();
  discoveryEngine.stop();
  deviceManager.stop();
  wsManager.disconnect();
  started = false;
}
