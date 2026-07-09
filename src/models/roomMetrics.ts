import type { ID, Timestamp } from "./common";

/**
 * Zentrale, vom Intelligence Layer berechnete Metriken je Raum.
 * Alle Felder sind optional; nur `roomId`, `revision`, `computedAt`
 * sind garantiert. Neue Kennzahlen können jederzeit über zusätzliche
 * Contributors ergänzt werden.
 */
export interface RoomMetrics {
  roomId: ID;
  revision: number;
  computedAt: Timestamp;

  // Counts
  deviceCount?: number;
  online?: number;
  offline?: number;
  unreachable?: number;
  favorites?: number;
  warnings?: number;
  errors?: number;

  // Climate averages
  temperature?: number;
  humidity?: number;
  airQuality?: number;
  co2?: number;
  voc?: number;

  // Openings
  windowsOpen?: number;
  doorsOpen?: number;

  // Activity per category
  lightsActive?: number;
  outletsActive?: number;
  shadesOpen?: number;
  heatingActive?: number;
  acActive?: number;
  mediaActive?: number;

  // Energy
  powerWatts?: number;
  energyKwh?: number;

  // Health
  batteryAvg?: number;
  signalAvg?: number;

  // Activity
  lastActivity?: Timestamp;
  discoveryPending?: number;
  syncPending?: number;

  // Automations (Teil 9)
  automationCount?: number;
  automationsRunning?: number;
}

export type MutableRoomMetrics = RoomMetrics;
