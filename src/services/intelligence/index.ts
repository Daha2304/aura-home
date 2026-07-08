import { intelligenceController } from "./IntelligenceController";
import { intelligenceEvents } from "./events/IntelligenceEvents";
import { deviceAssignmentEngine } from "./assignment/DeviceAssignmentEngine";
import { deviceFilterEngine } from "./filter/DeviceFilterEngine";
import { searchEngine } from "./search/SearchEngine";
import { metricContributors } from "./aggregation/MetricContributors";
import { registerBuiltinContributors } from "./aggregation/contributors";
import { useRoomMetricsStore } from "@/store/slices/roomMetricsStore";
import { useHouseMetricsStore } from "@/store/slices/houseMetricsStore";
import { useInsightsStore } from "@/store/slices/insightsStore";

export {
  intelligenceController,
  intelligenceEvents,
  deviceAssignmentEngine,
  deviceFilterEngine,
  searchEngine,
  metricContributors,
};
export { UNASSIGNED_ROOM_ID } from "./IntelligenceController";
export { roomAggregator } from "./aggregation/RoomAggregator";
export { houseAggregator } from "./aggregation/HouseAggregator";
export { roomStatusEngine } from "./status/RoomStatusEngine";
export { houseStatusEngine } from "./status/HouseStatusEngine";
export { roomInsightsEngine } from "./insights/RoomInsightsEngine";
export { houseInsightsEngine } from "./insights/HouseInsightsEngine";
export { searchIndex } from "./search/SearchIndex";
export type {
  DeviceFilterCriteria,
  FilterPredicate,
} from "./filter/DeviceFilterEngine";
export type { AssignmentInput } from "./assignment/DeviceAssignmentEngine";
export type { MetricContributor } from "./aggregation/MetricContributors";
export type { SearchEntity, SearchHit } from "./search/SearchIndex";

let bootstrapped = false;

/**
 * Startet die zentrale Smart Home Intelligence.
 * Registriert Built-in-Contributor, initiale Voll-Berechnung,
 * abonniert Devices/Rooms-Stores. Idempotent.
 */
export function bootstrapIntelligence(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  registerBuiltinContributors();
  intelligenceController.start();
  searchEngine.rebuild();
}

export function stopIntelligence(): void {
  if (!bootstrapped) return;
  intelligenceController.stop();
  bootstrapped = false;
}

/** Kleine Debug-API — nicht Teil des offiziellen Contracts. */
export const intelligenceDebug = {
  snapshot(): {
    rooms: Record<string, unknown>;
    house: unknown;
    insights: { house: unknown; rooms: Record<string, unknown> };
  } {
    const rooms: Record<string, unknown> = {};
    for (const [id, m] of useRoomMetricsStore.getState().byId) rooms[id] = m;
    const insightsRooms: Record<string, unknown> = {};
    for (const [id, list] of useInsightsStore.getState().byRoom) insightsRooms[id] = list;
    return {
      rooms,
      house: useHouseMetricsStore.getState().metrics,
      insights: {
        house: useInsightsStore.getState().house,
        rooms: insightsRooms,
      },
    };
  },
};
