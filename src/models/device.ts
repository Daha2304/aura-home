import type { Capability } from "./capability";
import type { HexColor, ID, IconName, Timestamp } from "./common";

export type DeviceType =
  | "light"
  | "rgb"
  | "dimmer"
  | "outlet"
  | "sensor"
  | "temperature"
  | "humidity"
  | "blinds"
  | "heating"
  | "thermostat"
  | "ac"
  | "window"
  | "door"
  | "garage"
  | "tv"
  | "avr"
  | "speaker"
  | "camera"
  | "alarm"
  | "smoke"
  | "water"
  | "energy"
  | "custom";

/**
 * Generische Gerätefunktion. Ein Gerät kann beliebig viele Funktionen besitzen.
 * Die Struktur ist bewusst dynamisch (kind + value + unit + meta),
 * damit später jedes beliebige Server-Protokoll darauf gemappt werden kann.
 */
export type DeviceFunctionKind =
  | "power"
  | "dimmer"
  | "rgb"
  | "colorTemperature"
  | "temperature"
  | "humidity"
  | "position"
  | "tilt"
  | "speed"
  | "power_watts"
  | "voltage"
  | "current"
  | "energy"
  | "battery"
  | "signal"
  | "boolean"
  | "number"
  | "text"
  | "enum"
  | "custom";

export interface DeviceFunction<TValue = unknown> {
  id: string;
  kind: DeviceFunctionKind;
  label?: string;
  value: TValue;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  readonly?: boolean;
  updatedAt?: Timestamp;
  meta?: Record<string, unknown>;
}

export interface Device {
  id: ID;
  name: string;
  type: DeviceType;
  roomId?: ID;
  groupIds?: ID[];
  icon?: IconName;
  color?: HexColor;
  manufacturer?: string;
  model?: string;
  firmware?: string;
  online: boolean;
  /** 0..100 */
  signal?: number;
  /** 0..100 */
  battery?: number;
  favorite?: boolean;
  lastSeen?: Timestamp;
  updatedAt?: Timestamp;
  /** Strukturierte, typisierte Capabilities (bestehendes System). */
  capabilities: Capability[];
  /** Dynamische, generische Funktionen (protokoll-agnostisch). */
  functions?: DeviceFunction[];
  /** Beliebige zusätzliche, serverseitige Attribute. */
  attributes?: Record<string, unknown>;
}

export interface DeviceGroup {
  id: ID;
  name: string;
  deviceIds: ID[];
  icon?: IconName;
}
