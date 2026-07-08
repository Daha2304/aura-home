import type { Capability } from "./capability";
import type { ID, Timestamp } from "./common";

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

export interface Device {
  id: ID;
  name: string;
  type: DeviceType;
  roomId?: ID;
  online: boolean;
  lastSeen?: Timestamp;
  favorite?: boolean;
  capabilities: Capability[];
  manufacturer?: string;
  model?: string;
  firmware?: string;
  meta?: Record<string, unknown>;
}
