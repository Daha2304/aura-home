import type { HouseMetrics } from "@/models/houseMetrics";
import type { Insight } from "@/models/insight";

function make(
  id: string,
  kind: string,
  label: string,
  value?: string | number,
  severity: Insight["severity"] = "info",
): Insight {
  return {
    id: `house:${id}`,
    scope: "house",
    kind,
    label,
    value,
    severity,
    createdAt: Date.now(),
  };
}

export class HouseInsightsEngine {
  build(m: HouseMetrics): Insight[] {
    const out: Insight[] = [];
    out.push(make("rooms", "count", "Räume", m.rooms));
    out.push(make("devices", "count", "Geräte", m.devices));
    if (m.online > 0) out.push(make("online", "count", "Online", m.online, "success"));
    if (m.offline > 0) out.push(make("offline", "count", "Offline", m.offline, "warning"));
    if (m.errors > 0) out.push(make("errors", "status", "Fehler", m.errors, "error"));
    if (m.powerWatts > 0)
      out.push(make("power", "energy", "Leistung", `${m.powerWatts.toFixed(0)} W`));
    if (m.energyKwh > 0)
      out.push(make("energy", "energy", "Energie", `${m.energyKwh.toFixed(2)} kWh`));
    if (m.errors === 0 && m.warnings === 0 && m.devices > 0)
      out.push(make("systems", "status", "Alle Systeme online", undefined, "success"));
    return out;
  }
}

export const houseInsightsEngine = new HouseInsightsEngine();
