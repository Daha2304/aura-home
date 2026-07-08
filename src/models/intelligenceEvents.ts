import type { ID } from "./common";
import type { HouseMetrics } from "./houseMetrics";
import type { RoomMetrics } from "./roomMetrics";
import type { RoomHealthStatus, HouseHealthStatus } from "./roomHealth";
import type { Insight } from "./insight";

export const INTELLIGENCE_EVENTS = {
  roomMetricsUpdated: "roomMetricsUpdated",
  houseMetricsUpdated: "houseMetricsUpdated",
  roomStatusChanged: "roomStatusChanged",
  houseStatusChanged: "houseStatusChanged",
  deviceAssigned: "deviceAssigned",
  deviceUnassigned: "deviceUnassigned",
  aggregationUpdated: "aggregationUpdated",
  insightUpdated: "insightUpdated",
} as const;

export interface IntelligenceEventMap {
  roomMetricsUpdated: { roomId: ID; metrics: RoomMetrics };
  houseMetricsUpdated: { metrics: HouseMetrics };
  roomStatusChanged: { roomId: ID; status: RoomHealthStatus; previous?: RoomHealthStatus };
  houseStatusChanged: { status: HouseHealthStatus; previous?: HouseHealthStatus };
  deviceAssigned: { deviceId: ID; roomId?: ID; previousRoomId?: ID };
  deviceUnassigned: { deviceId: ID; previousRoomId?: ID };
  aggregationUpdated: { roomIds: ID[] };
  insightUpdated: { scope: "room" | "house"; roomId?: ID; insights: Insight[] };
}
