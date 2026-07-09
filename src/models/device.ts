import type { Capability } from "./capability";
import type { HexColor, ID, IconName, Timestamp } from "./common";
import type { CapabilityFlag } from "./deviceCapability";
import type { LifecycleState } from "./deviceLifecycle";
import type { DeviceRelationship } from "./deviceRelationship";
import type { DeviceTypeId } from "./deviceType";

/**
 * @deprecated Nutze {@link DeviceTypeId}. Der Alias bleibt erhalten, damit
 * bestehende Konsumenten nicht brechen.
 */
export type DeviceType = DeviceTypeId;

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
  type: DeviceTypeId;
  roomId?: ID;
  groupIds?: ID[];
  icon?: IconName;
  color?: HexColor;

  // Profil (statische Metadaten)
  manufacturer?: string;
  model?: string;
  firmware?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  serial?: string;
  uuid?: string;
  mac?: string;
  floor?: number;
  image?: string;
  description?: string;
  tags?: string[];
  customProperties?: Record<string, unknown>;

  // Live-Zustand
  online: boolean;
  /** 0..100 */
  signal?: number;
  /** 0..100 */
  battery?: number;
  favorite?: boolean;
  lastSeen?: Timestamp;
  updatedAt?: Timestamp;

  // Fähigkeiten und Funktionen
  /** Strukturierte, wertetragende Capabilities. */
  capabilities: Capability[];
  /** Deklarative Fähigkeits-Flags. Registry-Default + optionale Overrides. */
  capabilityFlags?: CapabilityFlag[];
  /** Dynamische, generische Funktionen (protokoll-agnostisch). */
  functions?: DeviceFunction[];

  // Discovery/Sync
  lifecycle?: LifecycleState;
  /** Lokale, monotone Version. Wird bei jeder Änderung inkrementiert. */
  version?: number;
  /** Vom Server gelieferte Version, unabhängig von der lokalen. */
  serverVersion?: number;
  relationships?: DeviceRelationship[];

  // Serverseitige Zusatzattribute
  attributes?: Record<string, unknown>;

  // User binding (Teil 12). All optional — legacy devices remain valid.
  ownerUserId?: ID;
  visibleToUserIds?: ID[];
  controlUserIds?: ID[];
  favoriteUserIds?: ID[];
}

// NOTE: `DeviceGroup` moved to `./deviceGroup` (Teil 8). The Registry-based
// GroupManager owns the sole authoritative model. Do not re-introduce a
// minimal DeviceGroup type here — it would create a parallel data model.
