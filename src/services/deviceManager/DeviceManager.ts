import type { Device } from "@/models/device";
import type { WsIncomingEvent, WsOutgoingMessage } from "@/models/events";
import { createLogger } from "@/services/logger/Logger";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useHistoryStore } from "@/store/slices/historyStore";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { createId } from "@/utils/ids";

const log = createLogger("devices");

/**
 * Zentraler Device Manager.
 *
 * Reagiert auf WS-Events und hält den Zustand des DevicesStore konsistent.
 * UI-Komponenten lesen ausschließlich den Store — Business-Logik lebt hier.
 */
export class DeviceManager {
  private unsubscribers: Array<() => void> = [];
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    const d = wsManager.dispatcher;
    this.unsubscribers.push(
      d.on("device.added", (e) => this.onAdded(e.device)),
      d.on("device.updated", (e) => this.onUpdated(e.device)),
      d.on("device.removed", (e) => this.onRemoved(e.deviceId)),
      d.on("device.state", (e) => this.onState(e.deviceId, e.key, e.value)),
      d.on("device.online", (e) => this.onOnline(e.deviceId, e.online)),
    );
    log.info("started");
  }

  stop(): void {
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    this.started = false;
  }

  // ---------- outbound API (used by UI) ----------

  sendCommand(deviceId: string, key: string, value: unknown): string {
    const requestId = createId("req");
    const message: WsOutgoingMessage = {
      type: "command",
      deviceId,
      key,
      value,
      requestId,
    };
    wsManager.send(message);
    return requestId;
  }

  toggleFavorite(deviceId: string): void {
    const store = useDevicesStore.getState();
    const device = store.devices.find((d) => d.id === deviceId);
    if (!device) return;
    store.upsertDevice({ ...device, favorite: !device.favorite });
  }

  assignRoom(deviceId: string, roomId: string | undefined): void {
    const store = useDevicesStore.getState();
    const device = store.devices.find((d) => d.id === deviceId);
    if (!device) return;
    store.upsertDevice({ ...device, roomId });
  }

  // ---------- inbound handlers ----------

  private onAdded(device: Device) {
    useDevicesStore.getState().upsertDevice(device);
  }

  private onUpdated(device: Device) {
    useDevicesStore.getState().upsertDevice({
      ...device,
      updatedAt: Date.now(),
    });
  }

  private onRemoved(id: string) {
    useDevicesStore.getState().removeDevice(id);
  }

  private onOnline(id: string, online: boolean) {
    useDevicesStore.getState().updateOnline(id, online);
  }

  private onState(deviceId: string, key: string, value: unknown) {
    const store = useDevicesStore.getState();
    const device = store.devices.find((d) => d.id === deviceId);
    if (!device) {
      log.warn("state for unknown device", deviceId);
      return;
    }

    const previous = readValue(device, key);
    const patched = patchDeviceValue(device, key, value);
    store.upsertDevice({ ...patched, updatedAt: Date.now() });

    useHistoryStore.getState().push({
      id: createId("h"),
      deviceId,
      key,
      value,
      previousValue: previous,
      timestamp: Date.now(),
      source: "server",
    });
  }
}

function readValue(device: Device, key: string): unknown {
  const cap = device.capabilities.find((c) => c.id === key);
  if (cap && "value" in cap) return (cap as { value: unknown }).value;
  const fn = device.functions?.find((f) => f.id === key);
  return fn?.value;
}

function patchDeviceValue(device: Device, key: string, value: unknown): Device {
  const capIndex = device.capabilities.findIndex((c) => c.id === key);
  if (capIndex >= 0) {
    const capabilities = device.capabilities.slice();
    const cap = capabilities[capIndex] as { value?: unknown };
    capabilities[capIndex] = { ...(capabilities[capIndex] as object), value } as typeof cap &
      (typeof capabilities)[number];
    return { ...device, capabilities };
  }
  const fnIndex = device.functions?.findIndex((f) => f.id === key) ?? -1;
  if (device.functions && fnIndex >= 0) {
    const functions = device.functions.slice();
    functions[fnIndex] = { ...functions[fnIndex], value, updatedAt: Date.now() };
    return { ...device, functions };
  }
  // Unbekannter Key → in attributes protokollieren, damit nichts verlorengeht.
  return {
    ...device,
    attributes: { ...(device.attributes ?? {}), [key]: value },
  };
}

/** Für Debug-Zwecke: erlaubt Handler direkt auf beliebige Events zu setzen. */
export function onWsEvent<T extends WsIncomingEvent["type"]>(
  type: T,
  handler: (event: Extract<WsIncomingEvent, { type: T }>) => void,
) {
  return wsManager.dispatcher.on(type, handler);
}

export const deviceManager = new DeviceManager();
