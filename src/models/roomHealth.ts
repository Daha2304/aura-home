/**
 * Aggregierter, aus Metriken + Discovery/Sync abgeleiteter Health-Status
 * eines Raums. Getrennt von {@link ./room.RoomStatus} (Verwaltungsstatus),
 * damit UI und Logik nie durcheinandergeraten.
 */
export type RoomHealthStatus =
  | "normal"
  | "warning"
  | "error"
  | "offline"
  | "syncing"
  | "discovering"
  | "empty";

export const ROOM_HEALTH_PRIORITY: readonly RoomHealthStatus[] = [
  "error",
  "offline",
  "warning",
  "syncing",
  "discovering",
  "empty",
  "normal",
];

export type HouseHealthStatus = RoomHealthStatus;
