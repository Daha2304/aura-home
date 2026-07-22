import type { Capability, CustomCapability } from "@/models/capability";
import type { Device, DeviceFunction, DeviceFunctionKind } from "@/models/device";
import type { IoBrokerObjectTreeNode } from "@/models/iobrokerObject";
import type { Room, RoomType } from "@/models/room";
import type { DeviceTypeId } from "@/models/deviceType";
import type { WsIncomingEvent, WsOutgoingMessage } from "@/models/events";
import type { ServerConfig } from "@/models/server";
import { getRoomCategoryMeta } from "@/models/roomCategory";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { createLogger } from "@/services/logger/Logger";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { isAliasDevice, isAliasRoomId } from "@/services/discovery/aliasFilter";
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

const DENON_INPUT_OPTIONS = [
  "PHONO",
  "CD",
  "TUNER",
  "DVD",
  "BD",
  "TV",
  "SAT/CBL",
  "MPLAY",
  "GAME",
  "NET",
  "SPOTIFY",
  "LASTFM",
  "IRADIO",
  "SERVER",
  "FAVORITES",
  "AUX1",
  "AUX2",
  "AUX3",
  "AUX4",
  "AUX5",
  "AUX6",
  "AUX7",
  "BT",
  "USB",
  "USB/IPOD",
];

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
  for (const fn of device.functions ?? []) {
    if (fn.id && fn.meta?.readable !== false) {
      stateIndex.set(fn.id, { deviceId: device.id, key: fn.id });
    }
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
  type?: unknown;
  valueType?: unknown;
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
    type?: unknown;
  };
  readable?: unknown;
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

type RawRoom = {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  icon?: unknown;
  color?: unknown;
  floor?: unknown;
  order?: unknown;
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
  return ["actual", "set", "on_set", "brightness", "switch", "state", "on", "on / off", "power", "dimmer", "light"].includes(
    n,
  );
}

function deriveDeviceName(raw: RawDevice, id: string): string {
  if (id.startsWith("alias.")) {
    const aliasName = id.split(".").slice(3).join(" ");
    if (aliasName.trim().length > 0) return aliasName.replace(/[_-]+/g, " ").trim();
  }

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
  const normalizedSuffix = suffix.toLowerCase();
  const generic = isGenericDeviceName(label);
  if (!generic && label) return stripStateSuffix(label);
  if (kind === "power") return "Ein / Aus";
  if (kind === "dimmer") return "Helligkeit";
  if (kind === "volume") return "Lautstärke";
  if (normalizedSuffix === "input") return "Eingang";
  if (normalizedSuffix === "mode") return "Modus";
  if (kind === "temperature" && normalizedSuffix === "actual") return "Aktuelle Temperatur";
  if (kind === "temperature" && normalizedSuffix === "set") return "Zieltemperatur";
  if (kind === "temperature") return "Temperatur";
  if (kind === "humidity") return "Luftfeuchtigkeit";
  if (kind === "battery") return "Batterie";
  if (kind === "signal") return "Signal";
  if (kind === "action") return toTitle(suffix);
  if (normalizedSuffix === "bri") return "Helligkeit";
  if (normalizedSuffix === "ct" || normalizedSuffix === "colortemp") {
    return "Farbtemperatur";
  }
  if (normalizedSuffix === "state") return "Schalter";
  if (normalizedSuffix === "actual" && id.toLowerCase().includes(".fenster.")) return "Fenster";
  if (normalizedSuffix === "actual") return "Status";
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
  if (r.startsWith("level.volume")) return "volume";
  if (r === "media.quickselect" || r === "media.input" || r.includes("selectinput")) return "enum";
  if (r.startsWith("level.mode") || r.startsWith("state.mode") || r === "mode") return "enum";
  if (r.startsWith("level.temperature") || r.startsWith("value.temperature")) return "temperature";
  if (r.startsWith("value.humidity")) return "humidity";
  if (r.startsWith("value.power")) return "power_watts";
  if (r.startsWith("value.voltage")) return "voltage";
  if (r.startsWith("value.current")) return "current";
  if (r.startsWith("value.energy")) return "energy";
  if (r.startsWith("value.battery") || r === "battery") return "battery";
  if (r.startsWith("value.rssi") || r.startsWith("value.signal")) return "signal";
  if (r === "button" || r.startsWith("button.")) return "action";
  if (r.startsWith("sensor.motion") || r.startsWith("sensor.presence")) return "boolean";
  if (r.startsWith("sensor.window") || r.startsWith("sensor.door")) return "boolean";
  if (r.startsWith("indicator") || r.startsWith("sensor")) return "boolean";
  if (r.startsWith("value")) return "number";
  if (r.startsWith("text")) return "text";
  return "custom";
}

function readRawStateId(raw: RawState): string | undefined {
  return asString(raw.stateId) ?? asString(raw.id);
}

function readRawStateRole(raw: RawState): string | undefined {
  return asString(raw.role) ?? asString(raw.common?.role);
}

function readRawStateType(raw: RawState): string | undefined {
  return asString(raw.type) ?? asString(raw.valueType) ?? asString(raw.common?.type);
}

function stateOptions(raw: RawState): string[] | undefined {
  const source = raw.states ?? raw.common?.states;
  if (Array.isArray(source)) {
    return source.map(String).filter((value) => value.length > 0);
  }
  if (source && typeof source === "object") {
    const entries = Object.entries(source as Record<string, unknown>).filter(
      ([key]) => key.length > 0,
    );
    const keys = entries.map(([key]) => key);
    const labels = entries.map(([, label]) => String(label)).filter((value) => value.length > 0);
    const valueType = readRawStateType(raw);
    const currentValue = readableRawStateValue(raw);
    const current = currentValue === undefined || currentValue === null ? "" : String(currentValue);
    const hasNumericKeys = keys.length > 0 && keys.every((key) => /^-?\d+(?:\.\d+)?$/.test(key));

    if (
      valueType === "string" &&
      labels.length > 0 &&
      (hasNumericKeys || labels.includes(current))
    ) {
      return labels;
    }

    return keys;
  }
  const role = readRawStateRole(raw)?.toLowerCase() ?? "";
  const id = readRawStateId(raw)?.toLowerCase() ?? "";
  if (id.endsWith(".input") || id.includes("selectinput")) {
    return DENON_INPUT_OPTIONS;
  }
  return undefined;
}

function readableRawStateValue(raw: RawState): unknown {
  if (raw.value !== undefined) return raw.value;
  return null;
}

function stateToCapabilityAndFunction(
  raw: RawState,
  visibleControl = true,
): { cap: CustomCapability; fn: DeviceFunction } | null {
  const id = readRawStateId(raw);
  if (!id) return null;
  const role = readRawStateRole(raw);
  const valueType = readRawStateType(raw);
  const mappedKind = mapRole(role);
  const unit = asString(raw.unit) ?? asString(raw.common?.unit);
  const min = asNumber(raw.min) ?? asNumber(raw.common?.min);
  const max = asNumber(raw.max) ?? asNumber(raw.common?.max);
  const step = asNumber(raw.step) ?? asNumber(raw.common?.step);
  const writable =
    raw.writable === true || (raw.common?.write !== undefined ? raw.common.write !== false : true);
  const options = stateOptions(raw);
  const value = readableRawStateValue(raw);
  const kind = normalizeStateKind(mappedKind === "enum" && !options?.length ? "number" : mappedKind, valueType, value);
  const label = deriveStateLabel(id, asString(raw.name) ?? asString(raw.common?.name), kind);
  const readable = raw.readable !== false && raw.common?.read !== false;

  const cap = stateToCapability(id, kind, raw, label, !writable);
  const fn: DeviceFunction = {
    id,
    kind,
    label,
    value,
    unit,
    min,
    max,
    step,
    options,
    readonly: !writable,
    meta: { role, valueType, visibleControl, readable, rawMin: min, rawMax: max },
  };
  return { cap, fn };
}

function normalizeStateKind(kind: DeviceFunctionKind, valueType: string | undefined, value: unknown): DeviceFunctionKind {
  if (kind !== "custom") return kind;
  if (valueType === "boolean" || typeof value === "boolean") return "boolean";
  if (valueType === "number" || typeof value === "number") return "number";
  if (valueType === "string" || typeof value === "string") return "text";
  return "custom";
}

function stateToCapability(
  id: string,
  kind: DeviceFunctionKind,
  raw: RawState,
  label: string | undefined,
  readonly: boolean,
): CustomCapability {
  const base = { id, label, readonly };
  if (kind === "power") {
    return { ...base, kind: "onOff", value: Boolean(raw.value) } as unknown as CustomCapability;
  }
  if (kind === "dimmer") {
    return {
      ...base,
      kind: "dimmer",
      value: asNumber(raw.value) ?? asNumber(raw.min) ?? asNumber(raw.common?.min) ?? 0,
      min: asNumber(raw.min) ?? asNumber(raw.common?.min),
      max: asNumber(raw.max) ?? asNumber(raw.common?.max),
    } as unknown as CustomCapability;
  }
  if (kind === "volume") {
    return {
      ...base,
      kind: "volume",
      value: asNumber(raw.value) ?? asNumber(raw.min) ?? asNumber(raw.common?.min) ?? 0,
      unit: asString(raw.unit) ?? asString(raw.common?.unit) ?? "%",
      min: asNumber(raw.min) ?? asNumber(raw.common?.min),
      max: asNumber(raw.max) ?? asNumber(raw.common?.max),
      readonly,
    } as unknown as CustomCapability;
  }
  if (kind === "position" && typeof raw.value === "number") {
    return { ...base, kind: "position", value: raw.value } as unknown as CustomCapability;
  }
  if (kind === "temperature") {
    return {
      ...base,
      kind: "temperature",
      value: asNumber(raw.value) ?? asNumber(raw.min) ?? asNumber(raw.common?.min) ?? 20,
      unit: (asString(raw.unit) ?? asString(raw.common?.unit) ?? "C").replace(/^°/, "") || "C",
      readonly,
    } as unknown as CustomCapability;
  }
  if (kind === "humidity" && typeof raw.value === "number") {
    return { ...base, kind: "humidity", value: raw.value, readonly } as unknown as CustomCapability;
  }
  if (kind === "boolean") {
    return { ...base, kind: "boolean", value: Boolean(raw.value), readonly } as unknown as CustomCapability;
  }
  if (kind === "action") {
    return { ...base, kind: "action", value: false, readonly } as unknown as CustomCapability;
  }
  if (kind === "enum") {
    return {
      ...base,
      kind: "mode",
      value: String(raw.value ?? ""),
      options: stateOptions(raw) ?? [],
      readonly,
    } as unknown as CustomCapability;
  }
  if ((kind === "number" || kind === "battery" || kind === "signal") && typeof raw.value === "number") {
    return {
      ...base,
      kind: "number",
      value: raw.value,
      unit: asString(raw.unit) ?? asString(raw.common?.unit),
      readonly,
    } as unknown as CustomCapability;
  }
  if (kind === "power_watts" && typeof raw.value === "number") {
    return {
      ...base,
      kind: "powerConsumption",
      value: raw.value,
      unit: asString(raw.unit) ?? asString(raw.common?.unit) ?? "W",
      readonly,
    } as unknown as CustomCapability;
  }
  if ((kind === "voltage" || kind === "current" || kind === "energy") && typeof raw.value === "number") {
    return {
      ...base,
      kind: "number",
      value: raw.value,
      unit: asString(raw.unit) ?? asString(raw.common?.unit),
      readonly,
    } as unknown as CustomCapability;
  }
  if (kind === "text" || typeof raw.value === "string") {
    return { ...base, kind: "text", value: raw.value, readonly } as unknown as CustomCapability;
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

const ROOM_TYPE_BY_NAME: Array<[RegExp, RoomType]> = [
  [/wohn|living/i, "living"],
  [/küche|kueche|kitchen/i, "kitchen"],
  [/ess|dining/i, "dining"],
  [/schlaf|bed/i, "bedroom"],
  [/kind|kid|child/i, "kids"],
  [/bad|bath/i, "bathroom"],
  [/\bwc\b|toilet/i, "wc"],
  [/flur|diele|hall/i, "hallway"],
  [/treppe|stair/i, "stairway"],
  [/büro|buero|office/i, "office"],
  [/garage/i, "garage"],
  [/garten|garden/i, "garden"],
  [/terrasse|terrace/i, "terrace"],
  [/balkon|balcony/i, "balcony"],
  [/keller|basement/i, "basement"],
  [/dach|attic/i, "attic"],
  [/wasch|laundry/i, "laundry"],
  [/technik|technical/i, "technical"],
  [/außen|aussen|outdoor/i, "outdoor"],
];

function pickRoomType(raw: RawRoom, name: string): RoomType {
  const explicit = asString(raw.type);
  if (explicit && getRoomCategoryMeta(explicit as RoomType).type === explicit) {
    return explicit as RoomType;
  }

  return ROOM_TYPE_BY_NAME.find(([pattern]) => pattern.test(name))?.[1] ?? "custom";
}

function normalizeRoom(raw: unknown, order: number): Room | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawRoom;
  const id = asString(r.id);
  if (!isAliasRoomId(id)) return null;

  const fallbackName = id.startsWith("alias.")
    ? (id.split(".")[2] ?? id)
    : (id.split(".").at(-1) ?? id);
  const name = (asString(r.name) ?? fallbackName).replace(/[_-]+/g, " ").trim();
  const type = pickRoomType(r, name);
  const meta = getRoomCategoryMeta(type);

  return {
    id,
    name,
    type,
    category: type,
    icon: asString(r.icon) ?? meta.icon,
    color: (asString(r.color) ?? meta.accent) as Room["color"],
    floor: asNumber(r.floor),
    order: asNumber(r.order) ?? order,
    status: "active",
    customProps: {
      source: id.startsWith("alias.") ? "iobroker-alias" : "iobroker",
      raw: r as unknown as Record<string, unknown>,
    },
  };
}

function aliasRoomIdFromDeviceId(id: string): string | undefined {
  const parts = id.split(".");
  if (parts.length < 4 || !id.startsWith("alias.")) return undefined;
  return parts.slice(0, 3).join(".");
}

function normalizeAliasRoomId(id: string, order: number): Room | null {
  return normalizeRoom({ id }, order);
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
  const seenCapabilityIds = new Set<string>();

  const stateById = new Map<string, RawState>();
  for (const state of rawStates) {
    const stateId = readRawStateId(state);
    if (stateId) stateById.set(stateId, state);
  }

  for (const s of rawStates) {
    const pair = stateToCapabilityAndFunction(s, true);
    if (!pair) continue;
    functions.push(pair.fn);

    if (!seenCapabilityIds.has(pair.cap.id)) {
      capabilities.push(pair.cap);
      seenCapabilityIds.add(pair.cap.id);
    }
  }

  for (const rawCapability of rawCapabilities) {
    const stateId = readRawStateId(rawCapability);
    if (stateId && stateById.has(stateId)) continue;
    const pair = stateToCapabilityAndFunction(rawCapability, true);
    if (!pair) continue;
    functions.push(pair.fn);
    if (!seenCapabilityIds.has(pair.cap.id)) {
      capabilities.push(pair.cap);
      seenCapabilityIds.add(pair.cap.id);
    }
  }

  const device: Device = {
    id,
    name: deriveDeviceName(r, id),
    type: pickDeviceType(r) as Device["type"],
    roomId: aliasRoomIdFromDeviceId(id) ?? asString(r.roomId) ?? asString(r.room),
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
  if (!isAliasDevice(device)) return null;

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
        value: encodeCommandValue(message.deviceId, message.key, message.value),
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
      const rawRooms = Array.isArray(msg.rooms) ? (msg.rooms as unknown[]) : [];
      const devices: Device[] = [];
      const rooms: Room[] = [];

      for (let index = 0; index < rawRooms.length; index += 1) {
        const room = normalizeRoom(rawRooms[index], index);
        if (room) rooms.push(room);
      }

      for (const raw of list) {
        const d = appsocketNormalizeDevice(raw);
        if (d) devices.push(d);
      }

      const knownRoomIds = new Set(rooms.map((room) => room.id));
      for (const device of devices) {
        if (!device.roomId || knownRoomIds.has(device.roomId)) continue;
        const room = normalizeAliasRoomId(device.roomId, rooms.length);
        if (!room) continue;
        rooms.push(room);
        knownRoomIds.add(room.id);
      }

      return { type: "snapshot", devices, rooms };
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
      const value = readMessageValue(msg);
      return stateChangedEventFor(stateId, value) ?? {
        type: "device.state",
        deviceId: stateId,
        key: stateId,
        value,
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
    case "set_state":
    case "setState": {
      if (msg.success === true || msg.ok === true) {
        const stateId = asString(msg.stateId) ?? asString(msg.id);
        const value = readMessageValue(msg);
        if (stateId) {
          const mapped = stateBindingFor(stateId);
          return {
            type: "command.ack",
            requestId: asString(msg.requestId),
            success: true,
            deviceId: mapped?.deviceId,
            key: mapped?.key ?? stateId,
            value: mapped ? decodeStateValue(mapped.deviceId, mapped.key, value) : value,
          };
        }
      }

      return { type: "noop" };
    }
    case "subscribe":
    case "unsubscribe":
      return { type: "noop" };
    case "error":
      return {
        type: "error",
        message: asString(msg.message) ?? "Serverfehler",
        code: asString(msg.code),
        requestId: asString(msg.requestId),
      };
    default:
      return null;
  }
}

function readMessageValue(msg: Record<string, unknown>): unknown {
  return "value" in msg ? msg.value : msg.val;
}

function stateBindingFor(stateId: string): StateBinding | null {
  const binding = stateIndex.get(stateId);
  if (binding) return binding;

  const manualDevice = useDevicesStore
    .getState()
    .devices.find((device) =>
      device.capabilities.some((cap) => cap.id === stateId) ||
      (device.functions ?? []).some((fn) => fn.id === stateId),
    );

  return manualDevice ? { deviceId: manualDevice.id, key: stateId } : null;
}

function stateChangedEventFor(stateId: string, value: unknown): WsIncomingEvent | null {
  const binding = stateBindingFor(stateId);

  if (binding) {
    return {
      type: "device.state",
      deviceId: binding.deviceId,
      key: binding.key,
      value: decodeStateValue(binding.deviceId, binding.key, value),
    };
  }

  return null;
}

function encodeCommandValue(deviceId: string, stateId: string, value: unknown): unknown {
  const binding = findManualBinding(deviceId, stateId);
  const scale = getPercentScale(binding);
  if (!scale) return value;

  const percent = asFiniteNumber(value, 0);

  return Math.round(scale.min + (Math.max(0, Math.min(100, percent)) / 100) * (scale.max - scale.min));
}

function decodeStateValue(deviceId: string, stateId: string, value: unknown): unknown {
  const binding = findManualBinding(deviceId, stateId);
  const scale = getPercentScale(binding, value);
  if (!scale) return value;

  const rawValue = asFiniteNumber(value, scale.min);

  return Math.max(0, Math.min(100, Math.round(((rawValue - scale.min) / (scale.max - scale.min)) * 100)));
}

function findManualBinding(deviceId: string, stateId: string) {
  const device = useDevicesStore.getState().byId(deviceId);
  if (!device || device.customProperties?.auraManual !== true) return undefined;

  return device.functions?.find((fn) => fn.id === stateId);
}

function getPercentScale(binding: ReturnType<typeof findManualBinding>, rawValue?: unknown): { min: number; max: number } | null {
  if (!binding) return null;

  const role = typeof binding.meta?.role === "string" ? binding.meta.role.toLowerCase() : "";
  const id = binding.id.toLowerCase();
  const isDimmer =
    binding.kind === "dimmer" ||
    role.includes("dimmer") ||
    role.includes("brightness") ||
    id.includes("dimmer") ||
    id.includes("brightness") ||
    id.endsWith(".bri");

  if (!isDimmer) return null;

  const min = asFiniteNumber(binding.meta?.rawMin, 0);
  const explicitMax = typeof binding.meta?.rawMax === "number" ? binding.meta.rawMax : undefined;
  const observed = Math.max(asFiniteNumber(binding.value, 0), asFiniteNumber(rawValue, 0));
  const max = explicitMax ?? (observed > 100 || id.includes("zigbee2mqtt") || id.includes("wled") || id.endsWith(".bri") ? 255 : 100);

  return max > 100 ? { min, max } : null;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
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
    min: typeof value.min === "number" ? value.min : undefined,
    max: typeof value.max === "number" ? value.max : undefined,
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
