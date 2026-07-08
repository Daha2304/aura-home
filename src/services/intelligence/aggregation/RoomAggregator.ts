import type { Device } from "@/models/device";
import type { ID } from "@/models/common";
import type { RoomMetrics } from "@/models/roomMetrics";
import { metricContributors } from "./MetricContributors";

/**
 * Berechnet {@link RoomMetrics} anhand aller registrierten
 * {@link MetricContributor}s. Vollständig plugin-fähig: neue Gerätetypen
 * fügen neue Contributor hinzu — die Engine bleibt unverändert.
 */
export class RoomAggregator {
  compute(roomId: ID, devices: readonly Device[], previousRevision = 0): RoomMetrics {
    const acc: RoomMetrics = {
      roomId,
      revision: previousRevision + 1,
      computedAt: Date.now(),
    };
    metricContributors.reset(acc);
    for (const d of devices) {
      metricContributors.contribute({ device: d, acc });
    }
    metricContributors.finalize(acc, devices.length);
    return acc;
  }
}

export const roomAggregator = new RoomAggregator();
