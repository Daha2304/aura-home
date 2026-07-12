import type { Capability, CustomCapability } from "@/models/capability";
import type { Device, DeviceFunction, DeviceFunctionKind } from "@/models/device";
import type { IoBrokerObjectTreeNode } from "@/models/iobrokerObject";
import type { DeviceTypeId } from "@/models/deviceType";
import type { WsIncomingEvent, WsOutgoingMessage } from "@/models/events";
import type { ServerConfig } from "@/models/server";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { createLogger } from "@/services/logger/Logger";
import { useDevicesStore } from "@/store/slices/devicesStore";
import type { Protocol } from "./protocol";

/**
 * Protokoll-Adapter für den ioBroker "appsocket"-Adapter.
 *
 * Kapselt die konkrete Nachrichtenform des Servers. Das restliche System
 * (WebSocketManager, Discovery Engine, Command Queue, Device Manager) kennt
 * ausschließlich die generischen {@link WsOutgoingMessage}/{@link WsIncomingEvent}
 * Typen — hier findet die vollständige Übersetzung statt.
 *
 * Verbindungsablauf gemäß appsocket:
 *   1. Client sendet als allererste Nachricht  { type:"hello", ... }.
 *   2. Server antwortet mit                    { type:"hello_ack", ... }.
 *      → gilt als Authentifizierungserfolg.
 *   3. Anschließend fordert der Client         { type:"discover" } an.
 *   4. Server antwortet mit                    { type:"discover_result", devices:[...] }.
 *   5. Client abonniert die relevanten stateIds
 *                                              { type:"subscribe", stateIds:[...] }.
 *   6. Live-Updates laufen als state_changed / device_added / device_updated / device_removed.
 */

const log = createLogger("ws:appsocket");

const CLIENT_NAME = "Lovable Smart Home";
const CLIENT_VERSION = 1;

const KNOWN_DEVICE_TYPES: ReadonlySet<DeviceTypeId> = new Set([
  "light",
  "rgb",
  "dimmer",
  "outlet",
  "blinds",
  "jalousie",
  "awning",
  "garage",
  "door",
  "window",
  "doorContact",
  "windowContact",
  "motion",
  "presence",
  "temperature",
  "humidity",
  "pressure",
  "co2",
  "voc",
  "smoke",
  "water",
  "sensor",
  "thermostat",
  "heating",
  "ac",
  "fan",
  "tv",
  "avr",
  "speaker",
  "mediaPlayer",
  "camera",
  "doorbell",
  "alarm",
  "energy",
  "energyMeter",
  "pv",
  "battery",
  "wallbox",
  "vacuum",
  "custom",
]);

function isKnownDeviceType(type: string | undefined): type is DeviceTypeId {
  return !!type && KNOWN_DEVICE_TYPES.has(type as DeviceTypeId);
}

// ---------------------------------------------------------------------------
// StateId ↔ Device-Index. Wird beim Import von discover_result/snapshot
// aufgebaut und beim Abbau (device_removed) wieder verkleinert.
// Der Index ist rein modulintern und wird von decode() gelesen, um
// state_changed → device.state korrekt zuzuordnen.
// ---------------------------------------------------------------------------

interface StateBinding {
  deviceId: string;
  /** Key wie ihn DeviceManager / CommandQueue erwarten — identisch zur stateId. */
  key: string;
}

const stateIndex = new Map<string, StateBinding>();

function indexDevice(device: Device): void {
  for (const cap of device.capabilities) {
    if (cap.id) stateIndex.set(cap.id, { deviceId: device.id, key: cap.id });
  }
  for (const fn of device.functions ?? []) {
    if (fn.id) stateIndex.set(fn.id, { deviceId: device.id, key: fn.id });
  }
}

function unindexDevice(deviceId: string): void {
  for (const [stateId, binding] of Array.from(stateIndex.entries())) {
    if (binding.deviceId === deviceId) stateIndex.delete(stateId);
  }
}

export function appsocketResetIndex(): void {
  stateIndex.clear();
}

export function appsocketCollectStateIds(): string[] {
  return Array.from(stateIndex.keys());
}

// ---------------------------------------------------------------------------
// Debug-Logging (ein-/ausgehend getrennt gekennzeichnet).
// ---------------------------------------------------------------------------

let debugEnabled = false;
export function setAppsocketDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

function logOut(payload: unknown): void {
  if (!debugEnabled) return;
  try {
    log.debug("→", typeof payload === "string" ? payload : JSON.stringify(payload));
  } catch {
    log.debug("→", "<unserializable>");
  }
}

function logIn(payload: unknown): void {
  if (!debugEnabled) return;
  try {
    log.debug("←", typeof payload === "string" ? payload : JSON.stringify(payload));
  } catch {
    log.debug("←", "<unserializable>");
  }
}

// ---------------------------------------------------------------------------
// Normalisierung von appsocket-Geräten in unser generisches Device-Modell.
// ---------------------------------------------------------------------------

type RawState = {
  id?: unknown;
  stateId?: unknown;
  name?: unknown;
  role?: unknown;
  value?: unknown;
  unit?: unknown;
  min?: unknown;
  max?: unknown;
  step?: unknown;
  states?: unknown;
  common?: {
    name?: unknown;
    write?: unknown;
    unit?: unknown;
    min?: unknown;
    max?: unknown;
    step?: unknown;
    role?: unknown;
  };
  writable?: unknown;
};

type RawDevice = {
  id?: unknown;
  deviceId?: unknown;
  name?: unknown;
  type?: unknown;
  role?: unknown;
  room?: unknown;
  roomId?: unknown;
  online?: unknown;
  manufacturer?: unknown;
  model?: unknown;
  firmware?: unknown;
  serial?: unknown;
  mac?: unknown;
  capabilities?: unknown;
  states?: unknown;
};

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function toTitle(text: string): string {
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripStateSuffix(name: string): string {
  return name
    .replace(/\s+(POWER|STATE|ON|Bri|Brightness|Dimmer)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericDeviceName(name: string | undefined): boolean {
  if (!name) return true;
  const n = name.trim().toLowerCase();
  return ["brightness", "switch", "state", "on", "on / off", "power", "dimmer", "light"].includes(
    n,
  );
}

function deriveDeviceName(raw: RawDevice, id: string): string {
  const rawName = stripStateSuffix(asString(raw.name) ?? "");
  if (!isGenericDeviceName(rawName)) return rawName;

  const parts = id.split(".");
  const adapter = parts[0]?.toLowerCase();
  const deviceParts = parts.slice(2);
  const primary = deviceParts[0] ?? id;
  const tail = deviceParts.slice(1);

  if (adapter === "sonoff") return toTitle(primary);
  if (adapter === "wifilight") return `WiFi-Light ${primary.replace(/_/g, ".")}`;
  if (adapter === "zigbee2mqtt") {
    if (primary.startsWith("group_")) return `Zigbee Gruppe ${primary.slice(6)}`;
    return `Zigbee ${primary}`;
  }
  if (adapter === "wled") {
    const suffix =
      tail[0] === "nl" ? " Nachtlicht" : tail[0] === "seg" && tail[1] ? ` Segment ${tail[1]}` : "";
    return `WLED ${primary}${suffix}`;
  }
  return toTitle(primary);
}

function deriveStateLabel(id: string, label: string | undefined, kind: DeviceFunctionKind): string {
  const suffix = id.split(".").at(-1) ?? id;
  const generic = isGenericDeviceName(label);
  if (!generic && label) return stripStateSuffix(label);
  if (kind === "dimmer") return "Helligkeit";
  if (suffix.toLowerCase() === "bri") return "Helligkeit";
  if (suffix.toLowerCase() === "ct" || suffix.toLowerCase() === "colortemp") {
    return "Farbtemperatur";
  }
  if (suffix.toLowerCase() === "state") return "Schalter";
  return toTitle(suffix);
}

function mapRole(role: string | undefined): DeviceFunctionKind {
  if (!role) return "custom";
  const r = role.toLowerCase();
  if (r === "switch" || r.startsWith("switch.")) return "power";
  if (r.startsWith("level.dimmer") || r === "level.brightness") return "dimmer";
  if (r.startsWith("level.color")) return "rgb";
  if (r.startsWith("level.blind") || r.startsWith("level.shutter")) return "position";
  if (r.startsWith("level.tilt")) return "tilt";
  if (r.startsWith("level.temperature") || r.startsWith("value.temperature")) return "temperature";
  if (r.startsWith("value.humidity")) return "humidity";
  if (r.startsWith("value.power")) return "power_watts";
  if (r.startsWith("value.voltage")) return "voltage";
  if (r.startsWith("value.current")) return "current";
  if (r.startsWith("value.energy")) return "energy";
  if (r.startsWith("value.battery") || r === "battery") return "battery";
  if (r.startsWith("value.rssi") || r.startsWith("value.signal")) return "signal";
  if (r.startsWith("indicator") || r.startsWith("sensor")) return "boolean";
  if (r.startsWith("value")) return "number";
  if (r.startsWith("text")) return "text";
  return "custom";
}

function stateToCapabilityAndFunction(
  raw: RawState,
  visibleControl = true,
): { cap: CustomCapability; fn: DeviceFunction } | null {
  const id = asString(raw.id) ?? asString(raw.stateId);
  if (!id) return null;
  const role = asString(raw.role) ?? asString(raw.common?.role);
  const kind = mapRole(role);
  const label = deriveStateLabel(id, asString(raw.name) ?? asString(raw.common?.name), kind);
  const unit = asString(raw.unit) ?? asString(raw.common?.unit);
  const min = asNumber(raw.min) ?? asNumber(raw.common?.min);
  const max = asNumber(raw.max) ?? asNumber(raw.common?.max);
  const step = asNumber(raw.step) ?? asNumber(raw.common?.step);
  const writable =
    raw.writable === true || (raw.common?.write !== undefined ? raw.common.write !== false : true);
  const options = Array.isArray(raw.states)
    ? (raw.states as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined;

  const cap = stateToCapability(id, kind, raw, label, !writable);
  const fn: DeviceFunction = {
    id,
    kind,
    label,
    value: raw.value,
    unit,
    min,
    max,
    step,
    options,
    readonly: !writable,
    meta: { role, visibleControl },
  };
  return { cap, fn };
}

function stateToCapability(
  id: string,
  kind: DeviceFunctionKind,
  raw: RawState,
  label: string | undefined,
  readonly: boolean,
): CustomCapability {
  const base = { id, label, readonly };
  if (kind === "power" && typeof raw.value === "boolean") {
    return { ...base, kind: "onOff", value: raw.value } as unknown as CustomCapability;
  }
  if (kind === "dimmer" && typeof raw.value === "number") {
    return {
      ...base,
      kind: "dimmer",
      value: raw.value,
      min: asNumber(raw.min) ?? asNumber(raw.common?.min),
      max: asNumber(raw.max) ?? asNumber(raw.common?.max),
    } as unknown as CustomCapability;
  }
  if (kind === "position" && typeof raw.value === "number") {
    return { ...base, kind: "position", value: raw.value } as unknown as CustomCapability;
  }
  return { ...base, kind: "custom", value: raw.value };
}

function pickDeviceType(raw: RawDevice): Device["type"] {
  const t = asString(raw.type) ?? asString(raw.role);
  if (t && (deviceRegistry.has(t as Device["type"]) || isKnownDeviceType(t))) {
    return t as Device["type"];
  }
  // Bekannte appsocket-Rollen grob auf unsere Kategorien mappen.
  const map: Record<string, string> = {
    light: "light",
    dimmer: "dimmer",
    ceiling: "light",
    lamp: "light",
    blind: "blinds",
    shutter: "blinds",
    thermostat: "thermostat",
    temperature: "temperature",
    humidity: "humidity",
    motion: "motion",
    door: "doorContact",
    window: "windowContact",
    lock: "smartLock",
    camera: "camera",
    outlet: "outlet",
    socket: "outlet",
    vacuum: "vacuum",
    media: "mediaPlayer",
  };
  const mapped = t ? map[t.toLowerCase()] : undefined;
  if (mapped && (deviceRegistry.has(mapped as Device["type"]) || isKnownDeviceType(mapped))) {
    return mapped as Device["type"];
  }
  return "custom" as Device["type"];
}

export function appsocketNormalizeDevice(raw: unknown): Device | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawDevice;
  const id = asString(r.id) ?? asString(r.deviceId);
  if (!id) return null;

  const rawCapabilities = Array.isArray(r.capabilities) ? (r.capabilities as RawState[]) : [];
  const rawStates = Array.isArray(r.states) ? (r.states as RawState[]) : [];
  const capabilities: Capability[] = [];
  const functions: DeviceFunction[] = [];
  const capabilitySource = rawCapabilities.length > 0 ? rawCapabilities : rawStates;

  for (const s of capabilitySource) {
    const pair = stateToCapabilityAndFunction(s, true);
    if (!pair) continue;
    capabilities.push(pair.cap);
    if (rawCapabilities.length === 0) functions.push(pair.fn);
  }

  if (rawCapabilities.length > 0) {
    for (const s of rawStates) {
      const pair = stateToCapabilityAndFunction(s, false);
      if (!pair) continue;
      functions.push(pair.fn);
    }
  }

  const device: Device = {
    id,
    name: deriveDeviceName(r, id),
    type: pickDeviceType(r) as Device["type"],
    roomId: asString(r.roomId) ?? asString(r.room),
    online: r.online !== false,
    manufacturer: asString(r.manufacturer),
    model: asString(r.model),
    firmware: asString(r.firmware),
    serial: asString(r.serial),
    mac: asString(r.mac),
    capabilities,
    functions,
    attributes: { raw: r as unknown as Record<string, unknown> },
  };
  indexDevice(device);
  return device;
}

// ---------------------------------------------------------------------------
// Encode: interne WsOutgoingMessage → appsocket-Wire-Format.
// ---------------------------------------------------------------------------

function encodeInternal(message: WsOutgoingMessage): Record<string, unknown> {
  switch (message.type) {
    case "auth": {
      const p = message.payload ?? {};
      return {
        type: "hello",
        client: CLIENT_NAME,
        version: CLIENT_VERSION,
        token: typeof p.token === "string" ? p.token : "",
      };
    }
    case "subscribe":
      return { type: "subscribe", stateIds: [message.topic] };
    case "unsubscribe":
      return { type: "unsubscribe", stateIds: [message.topic] };
    case "command":
      return {
        type: "set_state",
        id: message.key,
        value: message.value,
        requestId: message.requestId,
      };
    case "request":
      if (message.op === "devices.list" || message.op === "discover") {
        return { type: "discover" };
      }
      if (message.op === "devices.sync") {
        return { type: "discover" };
      }
      return {
        type: "request",
        op: message.op,
        requestId: message.requestId,
        payload: message.payload,
      };
    case "ping":
      return { type: "ping" };
    default: {
      const _exhaustive: never = message;
      return _exhaustive as never;
    }
  }
}

// ---------------------------------------------------------------------------
// Decode: appsocket-Wire-Format → interne WsIncomingEvent.
// ---------------------------------------------------------------------------

function decodeInternal(msg: Record<string, unknown>): WsIncomingEvent | null {
  const type = typeof msg.type === "string" ? msg.type : "";
  switch (type) {
    case "hello_ack":
      return { type: "auth_ok", payload: msg as Record<string, unknown> };
    case "hello_nak":
    case "auth_error":
      return { type: "auth_failed", reason: asString(msg.reason) ?? asString(msg.message) };
    case "discover_result":
    case "snapshot": {
      const list = Array.isArray(msg.devices) ? (msg.devices as unknown[]) : [];
      const devices: Device[] = [];
      for (const raw of list) {
        const d = appsocketNormalizeDevice(raw);
        if (d) devices.push(d);
      }
      return { type: "snapshot", devices };
    }
    case "device_added": {
      const d = appsocketNormalizeDevice(msg.device);
      return d ? { type: "device.added", device: d } : null;
    }
    case "object_tree": {
      const tree = readObjectTree(msg);
      return { type: "object_tree", tree, requestId: asString(msg.requestId) };
    }
    case "device_updated": {
      const d = appsocketNormalizeDevice(msg.device);
      return d ? { type: "device.updated", device: d } : null;
    }
    case "device_removed": {
      const id = asString(msg.deviceId) ?? asString(msg.id);
      if (!id) return null;
      unindexDevice(id);
      return { type: "device.removed", deviceId: id };
    }
    case "state_changed": {
      const stateId = asString(msg.stateId) ?? asString(msg.id);
      if (!stateId) return null;
      const binding = stateIndex.get(stateId);
      if (!binding) {
        const manualDevice = useDevicesStore
          .getState()
          .devices.find((device) =>
            device.capabilities.some((cap) => cap.id === stateId) ||
            (device.functions ?? []).some((fn) => fn.id === stateId),
          );

        if (manualDevice) {
          return {
            type: "device.state",
            deviceId: manualDevice.id,
            key: stateId,
            value: msg.value,
          };
        }

        // Fallback: nutze stateId als deviceId+key (DeviceManager verwirft dann still).
        return {
          type: "device.state",
          deviceId: stateId,
          key: stateId,
          value: msg.value,
        };
      }
      return {
        type: "device.state",
        deviceId: binding.deviceId,
        key: binding.key,
        value: msg.value,
      };
    }
    case "device_online":
    case "device_offline": {
      const id = asString(msg.deviceId) ?? asString(msg.id);
      if (!id) return null;
      return { type: "device.online", deviceId: id, online: type === "device_online" };
    }
    case "pong":
      return { type: "pong", ts: asNumber(msg.ts) };
    case "subscribe":
    case "unsubscribe":
    case "set_state":
    case "setState":
      return { type: "noop" };
    case "error":
      return {
        type: "error",
        message: asString(msg.message) ?? "Serverfehler",
        code: asString(msg.code),
      };
    default:
      return null;
  }
}

function readObjectTree(msg: Record<string, unknown>): IoBrokerObjectTreeNode[] {
  const direct = Array.isArray(msg.tree) ? msg.tree : undefined;
  const data = msg.data && typeof msg.data === "object" ? (msg.data as Record<string, unknown>) : undefined;
  const payload = msg.payload && typeof msg.payload === "object" ? (msg.payload as Record<string, unknown>) : undefined;
  const candidate = direct ?? (Array.isArray(data?.tree) ? data.tree : undefined) ?? (Array.isArray(payload?.tree) ? payload.tree : undefined);

  return Array.isArray(candidate)
    ? candidate.filter(isObjectTreeNode).map(normalizeObjectTreeNode)
    : [];
}

function isObjectTreeNode(value: unknown): value is IoBrokerObjectTreeNode {
  return !!value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string";
}

function normalizeObjectTreeNode(value: IoBrokerObjectTreeNode): IoBrokerObjectTreeNode {
  return {
    id: value.id,
    name: typeof value.name === "string" && value.name.length > 0 ? value.name : value.id.split(".").at(-1) ?? value.id,
    type: typeof value.type === "string" ? value.type : "folder",
    role: typeof value.role === "string" ? value.role : undefined,
    valueType: typeof value.valueType === "string" ? value.valueType : undefined,
    readable: typeof value.readable === "boolean" ? value.readable : undefined,
    writable: typeof value.writable === "boolean" ? value.writable : undefined,
    unit: typeof value.unit === "string" ? value.unit : undefined,
    value: value.value,
    ack: typeof value.ack === "boolean" ? value.ack : undefined,
    ts: typeof value.ts === "number" ? value.ts : undefined,
    children: Array.isArray(value.children)
      ? value.children.filter(isObjectTreeNode).map(normalizeObjectTreeNode)
      : [],
  };
}

// ---------------------------------------------------------------------------
// Protocol-Instanz für den WebSocketManager.
// ---------------------------------------------------------------------------

export const appsocketProtocol: Protocol = {
  encode(message) {
    const wire = encodeInternal(message);
    logOut(wire);
    return JSON.stringify(wire);
  },
  decode(raw) {
    if (typeof raw !== "string") return null;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
    logIn(parsed);
    return decodeInternal(parsed);
  },
  buildAuthMessage(server: ServerConfig) {
    // appsocket sendet IMMER als erste Nachricht "hello" — auch bei
    // deaktivierter Token-Pflicht. In diesem Fall wird ein leerer Token übertragen.
    const token = server.auth.token ?? "";
    return { type: "auth", payload: { token } };
  },
  isAuthSuccess(event) {
    return event.type === "auth_ok";
  },
  isAuthFailure(event) {
    return event.type === "auth_failed";
  },
};
