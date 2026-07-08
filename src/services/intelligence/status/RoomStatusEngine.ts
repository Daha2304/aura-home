import type { RoomMetrics } from "@/models/roomMetrics";
import type { RoomHealthStatus } from "@/models/roomHealth";

/**
 * Deterministische Ableitung des Health-Status aus Metriken.
 * Priorität: error > offline > warning > syncing > discovering > empty > normal.
 */
export class RoomStatusEngine {
  derive(metrics: RoomMetrics | undefined): RoomHealthStatus {
    if (!metrics || (metrics.deviceCount ?? 0) === 0) return "empty";
    if ((metrics.errors ?? 0) > 0) return "error";
    if ((metrics.offline ?? 0) > 0 && (metrics.online ?? 0) === 0) return "offline";
    if ((metrics.warnings ?? 0) > 0) return "warning";
    if ((metrics.syncPending ?? 0) > 0) return "syncing";
    if ((metrics.discoveryPending ?? 0) > 0) return "discovering";
    return "normal";
  }
}

export const roomStatusEngine = new RoomStatusEngine();
