import type { ID, Timestamp } from "./common";

/**
 * Ein einzelner Historie-Eintrag. Bewusst schmal — Diagramme kommen später.
 * Wir speichern nur: welches Gerät, welche Funktion/Capability, welcher Wert, wann.
 */
export interface HistoryEntry {
  id: ID;
  deviceId: ID;
  key: string; // capabilityId oder functionId
  value: unknown;
  previousValue?: unknown;
  timestamp: Timestamp;
  source?: "server" | "user" | "automation" | "scene" | "system";
}

export interface HistoryQuery {
  deviceId?: ID;
  key?: string;
  from?: Timestamp;
  to?: Timestamp;
  limit?: number;
}
