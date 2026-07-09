import type { StatisticsSnapshot } from "@/models/statistics";

export interface StatisticsContributor {
  id: string;
  label: string;
  /** Berechnet einen aktuellen Snapshot. Reine Funktion, ohne Nebenwirkungen. */
  compute(): StatisticsSnapshot | null;
}

class StatisticsRegistry {
  private readonly map = new Map<string, StatisticsContributor>();

  register(c: StatisticsContributor): () => void {
    this.map.set(c.id, c);
    return () => this.unregister(c.id);
  }
  unregister(id: string): void { this.map.delete(id); }
  get(id: string): StatisticsContributor | undefined { return this.map.get(id); }
  list(): StatisticsContributor[] { return Array.from(this.map.values()); }

  computeAll(): StatisticsSnapshot[] {
    const out: StatisticsSnapshot[] = [];
    for (const c of this.map.values()) {
      const s = c.compute();
      if (s) out.push(s);
    }
    return out;
  }
}

export const statisticsRegistry = new StatisticsRegistry();
