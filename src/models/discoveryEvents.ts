import type { ID } from "./common";
import type { Device, DeviceFunction } from "./device";
import type { CapabilityFlag } from "./deviceCapability";

/**
 * Öffentliches Discovery-Event-Vokabular.
 * Wird vom {@link services/discovery/DiscoveryEngine} über einen typisierten
 * TypedEmitter veröffentlicht. UI-/Feature-Code hört bei Bedarf zu, ohne
 * den Store zu pollen.
 */
export interface DiscoveryEventMap {
  discoveryStarted: void;
  discoveryFinished: { count: number };
  syncStarted: { kind: "full" | "delta"; requestId?: string };
  syncFinished: { kind: "full" | "delta"; count: number };
  deviceDiscovered: { device: Device };
  deviceInitialized: { deviceId: ID };
  deviceReady: { deviceId: ID };
  deviceUpdated: { device: Device };
  deviceOnline: { deviceId: ID };
  deviceOffline: { deviceId: ID };
  deviceRemoved: { deviceId: ID };
  deviceCapabilitiesChanged: { deviceId: ID; flags: CapabilityFlag[] };
  deviceFunctionAdded: { deviceId: ID; fn: DeviceFunction };
  deviceFunctionRemoved: { deviceId: ID; functionId: string };
}
