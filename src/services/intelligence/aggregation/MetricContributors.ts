import type { Device } from "@/models/device";
import type { MutableRoomMetrics, RoomMetrics } from "@/models/roomMetrics";

export interface AggregationContext {
  device: Device;
  acc: MutableRoomMetrics;
}

export interface MetricContributor {
  id: string;
  /** Wird vor jeder Voll-Aggregation eines Raums aufgerufen. */
  reset?(acc: MutableRoomMetrics): void;
  /** Für jedes Gerät im Raum aufgerufen. */
  contribute(ctx: AggregationContext): void;
  /** Nach allen Geräten aufgerufen, z. B. für Averages. */
  finalize?(acc: MutableRoomMetrics, deviceCount: number): void;
}

class MetricContributorRegistry {
  private readonly items = new Map<string, MetricContributor>();

  register(c: MetricContributor): void {
    if (this.items.has(c.id)) return;
    this.items.set(c.id, c);
  }

  unregister(id: string): void {
    this.items.delete(id);
  }

  all(): MetricContributor[] {
    return Array.from(this.items.values());
  }

  reset(acc: MutableRoomMetrics): void {
    for (const c of this.items.values()) c.reset?.(acc);
  }

  contribute(ctx: AggregationContext): void {
    for (const c of this.items.values()) {
      try {
        c.contribute(ctx);
      } catch {
        // A misbehaving contributor must not break aggregation.
      }
    }
  }

  finalize(acc: MutableRoomMetrics, deviceCount: number): void {
    for (const c of this.items.values()) c.finalize?.(acc, deviceCount);
  }

  clear(): void {
    this.items.clear();
  }
}

export const metricContributors = new MetricContributorRegistry();
export type { RoomMetrics };
