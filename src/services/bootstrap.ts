import { createLogger, setGlobalLogLevel, addLogSink } from "@/services/logger/Logger";
import { installGlobalErrorHandlers } from "@/services/errors/globalHandlers";
import { useLogStore } from "@/store/slices/logStore";
import { healthManager, registerBuiltinHealthChecks } from "@/services/health";
import { recoveryManager } from "@/services/recovery/RecoveryManager";
import { runStartupValidation } from "@/services/selfCheck/StartupValidation";
import "@/services/flags/FeatureFlags";
import { errorBus } from "@/services/errors/ErrorBus";
import { wsManager } from "@/services/websocket/WebSocketManager";
import {
  appsocketProtocol,
  appsocketCollectStateIds,
  appsocketResetIndex,
  setAppsocketDebug,
} from "@/services/websocket/appsocketProtocol";
import { deviceManager } from "@/services/deviceManager/DeviceManager";
import { discoveryEngine } from "@/services/discovery/DiscoveryEngine";
import { commandQueue } from "@/services/commands/CommandQueue";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { useNotificationsStore } from "@/store/slices/notificationsStore";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { devLog } from "@/store/slices/devLogStore";
import { buildServerUrl } from "@/models/server";

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
import { bootstrapDevicePanels } from "@/services/devicePanels";
import { bootstrapDevicePropertyRegistry } from "@/services/deviceProperties";
import { bootstrapScenes } from "@/services/scenes";
import { bootstrapGroups, stopGroups } from "@/services/groups";
import { bootstrapAutomations, stopAutomations } from "@/services/automations";
import { bootstrapTimeline, stopTimeline } from "@/services/timeline";
import { automationDebugger } from "@/services/automations/AutomationDebugger";
import { startEventCenter, stopEventCenter } from "@/services/notifications";
import { bootstrapUsers } from "@/services/users";
import { startSearchPlatform, stopSearchPlatform } from "@/services/search";
import { versionManager, migrationManager } from "@/services/version";
import { cacheManager } from "@/services/cache";
import { registerBuiltinBackupProviders } from "@/services/backup";
import { offlineEngine, backgroundSync } from "@/services/offline";
import { appLifecycle } from "@/services/lifecycle";
import { deepLinkRouter } from "@/services/deeplinks";
import { updateManager } from "@/services/pwa";


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

  // Frühe Fehler-/Log-Verkabelung. installGlobalErrorHandlers ist idempotent.
  const removeGlobalErrors = installGlobalErrorHandlers();
  const removeLogSink = addLogSink((entry) => {
    useLogStore.getState().push(entry);
  });
  unsubscribers.push(removeGlobalErrors, removeLogSink);

  // Protokoll-Adapter: ioBroker appsocket. Muss vor jedem connect() gesetzt sein,
  // damit die allererste Nachricht ein "hello" ist.
  wsManager.setProtocol(appsocketProtocol);

  unsubscribers.push(
    wsManager.on("status", (status) => {
      useConnectionStore.getState().setStatus(status);
      if (status === "connecting") {
        const s = useSettingsStore.getState();
        const srv = s.servers.find((x) => x.id === s.activeServerId);
        devLog(
          "connect",
          "Verbindungsversuch gestartet",
          srv ? buildServerUrl(srv) : undefined,
        );
      } else {
        devLog("info", `Status: ${status}`);
      }
    }),
    wsManager.on("connected", () => {
      useConnectionStore.getState().markConnected();
      devLog("open", "WebSocket geöffnet");
    }),
    wsManager.on("authenticated", () => {
      useConnectionStore.getState().setAuthenticated(true);
      devLog("auth", "Authentifiziert");
    }),
    wsManager.on("authentication_failed", ({ reason }) => {
      useConnectionStore.getState().setAuthenticated(false);
      useConnectionStore.getState().setError(reason ?? "Auth fehlgeschlagen");
      devLog("auth_failed", "Authentifizierung fehlgeschlagen", reason);
    }),
    wsManager.on("disconnected", ({ code, reason }) => {
      useConnectionStore.getState().setAuthenticated(false);
      appsocketResetIndex();
      devLog(
        "close",
        `WebSocket geschlossen${code !== undefined ? ` (Code ${code})` : ""}`,
        reason,
      );
    }),
    wsManager.on("heartbeat", ({ latencyMs }) => {
      useConnectionStore.getState().setLatency(latencyMs);
      devLog("pong", `Heartbeat · ${latencyMs} ms`);
    }),
    wsManager.on("reconnecting", ({ attempt, delayMs }) => {
      useConnectionStore.getState().setReconnectAttempt(attempt);
      devLog(
        "reconnect",
        `Reconnect #${attempt} in ${Math.round(delayMs)} ms`,
      );
    }),
    wsManager.on("error", (payload) => {
      useConnectionStore.getState().setError(payload.message);
      devLog("error", payload.message, {
        kind: payload.kind,
        code: payload.code,
        context: payload.context,
      });
    }),
    wsManager.on("sent", (msg) => {
      if (msg.type === "ping") devLog("ping", "→ ping", msg);
      else devLog("send", `→ ${msg.type}`, msg);
    }),
    wsManager.on("message", (ev) => {
      devLog("recv", `← ${ev.type}`, ev);
    }),
    wsManager.dispatcher.on("notification", (ev) =>
      useNotificationsStore.getState().push(ev.notification),
    ),
    // Snapshot / discover_result: Geräte in Discovery importieren und
    // anschließend alle bekannten stateIds abonnieren.
    wsManager.dispatcher.on("snapshot", (ev) => {
      discoveryEngine.ingestFull(ev.devices);
      const ids = appsocketCollectStateIds();
      for (const id of ids) wsManager.subscribe(id);
      log.info("snapshot ingested", ev.devices.length, "devices,", ids.length, "states subscribed");
    }),
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
  bootstrapCapabilityRegistry();
  registerBuiltinControls();
  bootstrapDevicePropertyRegistry();
  bootstrapDevicePanels();

  // Szenen + Gerätegruppen. Beide nutzen ausschließlich Command Queue,
  // Universal Control Engine und existierende Registries.
  bootstrapScenes();
  bootstrapGroups();

  // Automation Engine: hydratisiert, registriert Built-in Descriptors,
  // startet Scheduler + Executor. Nutzt ausschließlich CommandQueue.
  bootstrapAutomations();

  // Timeline / History / Analytics (Teil 10). Registriert Built-in
  // TimelineSourceDescriptors und verbindet sie mit dem TimelineStore.
  // Neue Quellen (z. B. Notifications in Teil 11) benötigen ausschließlich
  // einen weiteren Descriptor — keine Änderung an dieser Datei.
  bootstrapTimeline();
  automationDebugger.register();

  // Event Center (Teil 11): startet Notification-Producer und registriert
  // die Notification-Timeline-Source. Neue Ereignisquellen kommen ausschließlich
  // über NotificationRegistry.registerProducer(...) hinzu — keine Änderung hier.
  startEventCenter();

  // Users, Profile, Rollen & Berechtigungen (Teil 12). Registriert Built-in
  // Rollen/Profile/Permission-Resources und Ownership-Sources. Neue Ressourcen
  // erweitern ausschließlich die Registries — keine Änderung hier.
  bootstrapUsers();

  // Global Search & Command Palette (Teil 13). Registriert built-in Provider
  // + Commands. Neue Suchquellen kommen ausschließlich über
  // searchProviderRegistry.register(...) hinzu.
  startSearchPlatform();

  // PWA, Offline, Backup, Version, Update (Teil 14).
  // Reihenfolge:
  //   1. Versionen laden + Migrationen anwenden (idempotent).
  //   2. Cache-Manager + Backup-Provider (registry-basiert, non-blocking).
  //   3. Offline Engine + Background Sync (lesen bestehende Command-Queue).
  //   4. App-Lifecycle + Deep-Link Router.
  //   5. Service Worker + Update Manager (nur Prod / non-preview).
  versionManager.hydrate();
  void migrationManager.runPending();
  void cacheManager.init();
  void registerBuiltinBackupProviders();
  offlineEngine.start();
  void backgroundSync.start();
  appLifecycle.start();
  deepLinkRouter.start();
  void updateManager.start();

  // Produktions-Diagnose (Teil 15). Health-Checks + Recovery + Self-Check.
  registerBuiltinHealthChecks();
  healthManager.start();
  recoveryManager.start();
  void runStartupValidation();






  // Aktiven Server beobachten und Manager entsprechend (neu) konfigurieren.
  const applyActiveServer = () => {
    const state = useSettingsStore.getState();
    setGlobalLogLevel(state.debugWebSocket ? "debug" : "info");
    setAppsocketDebug(state.debugWebSocket);
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
  updateManager.stop();
  deepLinkRouter.stop();
  appLifecycle.stop();
  backgroundSync.stop();
  offlineEngine.stop();
  stopSearchPlatform();
  stopIntelligence();
  stopEventCenter();
  stopTimeline();
  stopAutomations();
  stopGroups();
  commandQueue.stop();
  discoveryEngine.stop();
  deviceManager.stop();
  wsManager.disconnect();
  started = false;
}
