import type { ID, Timestamp } from "./common";

/**
 * Aggregierte Kennzahlen (Vorbereitung Teil 10). Zählt einfache
 * Vorkommnisse innerhalb eines Zeitraums. Keine Spezial-Logik.
 */
export interface StatisticsSnapshot {
  id: ID;
  label: string;
  value: number;
  unit?: string;
  timestamp: Timestamp;
  meta?: Record<string, unknown>;
}

export interface EnergyStatistics {
  id: ID;
  deviceId?: ID;
  roomId?: ID;
  /** Wh in einem Zeitraum. */
  energyWh: number;
  /** Aktuelle Leistung in W (optional, letzter Messwert). */
  powerW?: number;
  from: Timestamp;
  to: Timestamp;
}
