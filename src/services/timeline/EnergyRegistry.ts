import type { EnergyStatistics } from "@/models/statistics";

export interface EnergyContributor {
  id: string;
  label: string;
  compute(): EnergyStatistics[] | null;
}

class EnergyRegistry {
  private readonly map = new Map<string, EnergyContributor>();

  register(c: EnergyContributor): () => void {
    this.map.set(c.id, c);
    return () => this.unregister(c.id);
  }
  unregister(id: string): void { this.map.delete(id); }
  list(): EnergyContributor[] { return Array.from(this.map.values()); }

  computeAll(): EnergyStatistics[] {
    const out: EnergyStatistics[] = [];
    for (const c of this.map.values()) {
      const r = c.compute();
      if (r) out.push(...r);
    }
    return out;
  }
}

export const energyRegistry = new EnergyRegistry();
