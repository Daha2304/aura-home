import type { Device } from "@/models/device";
import type { ID } from "@/models/common";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createLogger } from "@/services/logger/Logger";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { deviceCache } from "./DeviceCache";
import { DeviceSync } from "./DeviceSync";
import { discoveryEvents } from "./DiscoveryEvents";
import { LifecycleMachine } from "./LifecycleMachine";
import { validateIncomingDevice } from "./Validators";
import { createId } from "@/utils/ids";

const log = createLogger("discovery");

/**
 * Konfigurationsschlüssel für serverseitige Operationen. Wir hartcoden
 * keinen Kontrakt — der DiscoveryEngine schickt einfach ein
 * `request`-Message mit einem Operation-Slug, den der Protokoll-Adapter
 * bei Bedarf umschreibt.
 */
const OP = {
  fullSync: "devices.list",
  deltaSync: "devices.sync",
} as const;

class DiscoveryEngine {
  private started = false;
  private unsubs: Array<() => void> = [];
  private cacheUnsub: (() => void) | null = null;
  private fullSyncInFlight = false;
  private fullSyncTimer: ReturnType<typeof setTimeout> | null = null;

  start(): void {
    if (this.started) return;
    this.started = true;

    // 1) Cache hydratisieren, bevor irgendetwas geladen wird.
    const snap = deviceCache.hydrate();
    if (snap) {
      useDevicesStore.getState().setDevices(snap.devices);
      useDevicesStore.getState().setGroups(snap.groups ?? []);
    }

    // 2) Auf WS-Events reagieren. Wir doppeln bewusst NICHT den DeviceManager —
    //    der bleibt für einzelne State/Online-Events zuständig. Wir hören
    //    zusätzlich auf added/updated/removed und leiten sie durch die
    //    Validierung + Registry-Defaults.
    const d = wsManager.dispatcher;
    this.unsubs.push(
      d.on("device.added", (e) => this.onIncomingDevice(e.device, "added")),
      d.on("device.updated", (e) => this.onIncomingDevice(e.device, "updated")),
      d.on("device.removed", (e) => this.onDeviceRemoved(e.deviceId)),
      d.on("device.online", (e) => {
        if (e.online) discoveryEvents.emit("deviceOnline", { deviceId: e.deviceId });
        else discoveryEvents.emit("deviceOffline", { deviceId: e.deviceId });
      }),
    );

    // 3) Nach erfolgreicher Authentifizierung Full-Sync anfordern.
    this.unsubs.push(wsManager.on("authenticated", () => this.requestFullSync()));

    // 4) Cache automatisch fortschreiben — debounced.
    this.cacheUnsub = useDevicesStore.subscribe((s, prev) => {
      if (s.devices !== prev.devices || s.groups !== prev.groups) {
        deviceCache.persistDebounced({ devices: s.devices, groups: s.groups });
      }
    });

    useDiscoveryStore.getState().setState("idle");
    log.info("started");

    if (wsManager.status === "authenticated") {
      this.requestFullSync();
    }
  }

  stop(): void {
    if (!this.started) return;
    for (const off of this.unsubs) off();
    this.unsubs = [];
    this.cacheUnsub?.();
    this.cacheUnsub = null;
    this.clearFullSyncGuard();
    this.started = false;
  }

  requestFullSync(): void {
    if (this.fullSyncInFlight) return;
    this.fullSyncInFlight = true;
    this.fullSyncTimer = setTimeout(() => {
      this.fullSyncInFlight = false;
      this.fullSyncTimer = null;
      useDiscoveryStore.getState().setState("idle");
      log.warn("full sync timed out");
    }, 15_000);
    const requestId = createId("sync");
    useDiscoveryStore.getState().setState("syncing");
    useDiscoveryStore.getState().setLastSyncRequest(requestId);
    discoveryEvents.emit("syncStarted", { kind: "full", requestId });
    wsManager.send({
      type: "request",
      op: OP.fullSync,
      requestId,
    });
  }

  requestDeltaSync(since?: number): void {
    const requestId = createId("delta");
    discoveryEvents.emit("syncStarted", { kind: "delta", requestId });
    wsManager.send({
      type: "request",
      op: OP.deltaSync,
      payload: { since },
      requestId,
    });
  }

  /**
   * Öffentlicher Eingang für Server-gelieferte Batches. Der Protokoll-Adapter
   * kann `fullSync`/`deltaSync` direkt hierher routen, ohne dass ein neues
   * Event-Vokabular nötig wäre.
   */
  ingestFull(devices: unknown): void {
    if (!Array.isArray(devices)) {
      this.clearFullSyncGuard();
      errorBus.report(
        new AppError("parse", "fullSync: erwartet Array", {
          code: "sync_bad_payload",
        }),
      );
      return;
    }
    useDiscoveryStore.getState().setState("syncing");
    DeviceSync.fullSync(devices as Device[]);
    useDiscoveryStore.getState().markSynced();
    this.clearFullSyncGuard();
  }

  ingestDelta(payload: unknown): void {
    if (!payload || typeof payload !== "object") {
      errorBus.report(new AppError("parse", "deltaSync: ungültig", { code: "sync_bad_payload" }));
      return;
    }
    DeviceSync.deltaSync(payload as never);
    useDiscoveryStore.getState().markSynced();
  }

  // ---------- internal handlers ----------

  private onIncomingDevice(raw: Device, kind: "added" | "updated"): void {
    const store = useDevicesStore.getState();
    const validation = validateIncomingDevice(raw);
    if (!validation.ok) return;

    const prev = store.byId(raw.id);
    if (kind === "added" && prev) {
      // Duplikat → als Update behandeln, kein harter Fehler.
      log.debug("duplicate device treated as update", raw.id);
    }
    if (kind === "added") {
      DeviceSync.deltaSync({ added: [raw] });
    } else {
      DeviceSync.deltaSync({ updated: [raw] });
    }
  }

  private onDeviceRemoved(id: ID): void {
    const store = useDevicesStore.getState();
    const prev = store.byId(id);
    if (!prev) return;
    store.upsertDevice({
      ...prev,
      lifecycle: LifecycleMachine.transition(id, prev.lifecycle, "removing"),
    });
    store.removeDevice(id);
    discoveryEvents.emit("deviceRemoved", { deviceId: id });
  }

  private clearFullSyncGuard(): void {
    this.fullSyncInFlight = false;
    if (this.fullSyncTimer) {
      clearTimeout(this.fullSyncTimer);
      this.fullSyncTimer = null;
    }
  }
}

export const discoveryEngine = new DiscoveryEngine();
