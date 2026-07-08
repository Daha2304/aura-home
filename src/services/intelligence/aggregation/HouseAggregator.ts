import type { HouseMetrics } from "@/models/houseMetrics";
import type { RoomMetrics } from "@/models/roomMetrics";

const SENSOR_HINT_KEYS: (keyof RoomMetrics)[] = ["temperature", "humidity", "co2", "voc"];

/**
 * Aggregiert das gesamte Haus. Reduziert ausschließlich über bereits
 * berechnete {@link RoomMetrics} — kein Zweit-Scan über alle Geräte.
 */
export class HouseAggregator {
  compute(
    roomMetrics: readonly RoomMetrics[],
    previousRevision = 0,
    serverOnline?: boolean,
  ): HouseMetrics {
    let devices = 0;
    let online = 0;
    let offline = 0;
    let warnings = 0;
    let errors = 0;
    let powerWatts = 0;
    let energyKwh = 0;
    let discoveryPending = 0;
    let syncPending = 0;
    let sensors = 0;

    for (const m of roomMetrics) {
      devices += m.deviceCount ?? 0;
      online += m.online ?? 0;
      offline += m.offline ?? 0;
      warnings += m.warnings ?? 0;
      errors += m.errors ?? 0;
      powerWatts += m.powerWatts ?? 0;
      energyKwh += m.energyKwh ?? 0;
      discoveryPending += m.discoveryPending ?? 0;
      syncPending += m.syncPending ?? 0;
      if (SENSOR_HINT_KEYS.some((k) => m[k] !== undefined)) sensors += 1;
    }

    return {
      revision: previousRevision + 1,
      computedAt: Date.now(),
      rooms: roomMetrics.length,
      devices,
      sensors,
      online,
      offline,
      warnings,
      errors,
      alarms: errors, // Alarme = harte Fehler; erweiterbar via Contributor.
      powerWatts,
      energyKwh,
      discoveryPending,
      syncPending,
      serverOnline,
    };
  }
}

export const houseAggregator = new HouseAggregator();
