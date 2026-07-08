/**
 * Capabilities are the atomic functions a device can expose.
 * A device can carry any number of capabilities.
 */

export type Capability =
  | OnOffCapability
  | DimmerCapability
  | RgbCapability
  | TemperatureCapability
  | HumidityCapability
  | PositionCapability
  | ModeCapability
  | MediaTransportCapability
  | StreamCapability
  | EnergyCapability
  | CustomCapability;

interface CapabilityBase<TKind extends string> {
  kind: TKind;
  id: string;
  label?: string;
  readonly?: boolean;
}

export interface OnOffCapability extends CapabilityBase<"onOff"> {
  value: boolean;
}

export interface DimmerCapability extends CapabilityBase<"dimmer"> {
  value: number; // 0..100
  min?: number;
  max?: number;
}

export interface RgbCapability extends CapabilityBase<"rgb"> {
  value: { r: number; g: number; b: number };
}

export interface TemperatureCapability extends CapabilityBase<"temperature"> {
  value: number;
  unit: "C" | "F";
  target?: number;
}

export interface HumidityCapability extends CapabilityBase<"humidity"> {
  value: number; // %
}

export interface PositionCapability extends CapabilityBase<"position"> {
  value: number; // 0..100 (blinds, windows)
}

export interface ModeCapability extends CapabilityBase<"mode"> {
  value: string;
  options: string[];
}

export interface MediaTransportCapability
  extends CapabilityBase<"mediaTransport"> {
  state: "play" | "pause" | "stop";
  volume?: number;
  title?: string;
}

export interface StreamCapability extends CapabilityBase<"stream"> {
  url?: string;
  active: boolean;
}

export interface EnergyCapability extends CapabilityBase<"energy"> {
  power: number; // W
  total?: number; // kWh
}

export interface CustomCapability extends CapabilityBase<"custom"> {
  value: unknown;
  schema?: string;
}
