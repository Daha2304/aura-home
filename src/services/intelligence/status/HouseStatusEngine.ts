import type { HouseMetrics } from "@/models/houseMetrics";
import type { HouseHealthStatus } from "@/models/roomHealth";

export class HouseStatusEngine {
  derive(metrics: HouseMetrics | null): HouseHealthStatus {
    if (!metrics || metrics.rooms === 0 || metrics.devices === 0) return "empty";
    if (metrics.serverOnline === false) return "offline";
    if (metrics.errors > 0) return "error";
    if (metrics.offline > 0 && metrics.online === 0) return "offline";
    if (metrics.warnings > 0) return "warning";
    if (metrics.syncPending > 0) return "syncing";
    if (metrics.discoveryPending > 0) return "discovering";
    return "normal";
  }
}

export const houseStatusEngine = new HouseStatusEngine();
