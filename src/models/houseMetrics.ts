import type { Timestamp } from "./common";

export interface HouseMetrics {
  revision: number;
  computedAt: Timestamp;

  rooms: number;
  devices: number;
  sensors: number;
  online: number;
  offline: number;
  warnings: number;
  errors: number;
  alarms: number;

  powerWatts: number;
  energyKwh: number;

  discoveryPending: number;
  syncPending: number;
  serverOnline?: boolean;
}
