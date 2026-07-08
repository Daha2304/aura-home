import type { ID } from "@/models/common";
import type { RoomMetrics } from "@/models/roomMetrics";
import type { Insight } from "@/models/insight";

function make(
  scope: "room" | "house",
  id: string,
  kind: string,
  label: string,
  value?: string | number,
  severity: Insight["severity"] = "info",
  roomId?: ID,
): Insight {
  return {
    id: `${scope}:${roomId ?? "all"}:${id}`,
    scope,
    roomId,
    kind,
    label,
    value,
    severity,
    createdAt: Date.now(),
  };
}

export class RoomInsightsEngine {
  build(metrics: RoomMetrics): Insight[] {
    const out: Insight[] = [];
    const r = metrics.roomId;
    const total = metrics.deviceCount ?? 0;
    if (total > 0) {
      out.push(make("room", "devices", "count", "Geräte", total, "info", r));
      if ((metrics.online ?? 0) > 0)
        out.push(make("room", "online", "count", "Online", metrics.online ?? 0, "success", r));
      if ((metrics.offline ?? 0) > 0)
        out.push(
          make("room", "offline", "count", "Offline", metrics.offline ?? 0, "warning", r),
        );
    }
    if ((metrics.lightsActive ?? 0) > 0)
      out.push(
        make("room", "lights", "activity", "Lampen aktiv", metrics.lightsActive ?? 0, "info", r),
      );
    if ((metrics.windowsOpen ?? 0) > 0)
      out.push(
        make(
          "room",
          "windows",
          "openings",
          "Fenster offen",
          metrics.windowsOpen ?? 0,
          "warning",
          r,
        ),
      );
    if ((metrics.doorsOpen ?? 0) > 0)
      out.push(
        make("room", "doors", "openings", "Türen offen", metrics.doorsOpen ?? 0, "warning", r),
      );
    if (metrics.temperature !== undefined)
      out.push(
        make(
          "room",
          "temperature",
          "climate",
          "Temperatur",
          `${metrics.temperature.toFixed(1)}°C`,
          "info",
          r,
        ),
      );
    if (metrics.humidity !== undefined)
      out.push(
        make(
          "room",
          "humidity",
          "climate",
          "Luftfeuchte",
          `${metrics.humidity.toFixed(0)}%`,
          "info",
          r,
        ),
      );
    if ((metrics.warnings ?? 0) === 0 && (metrics.errors ?? 0) === 0 && total > 0) {
      out.push(make("room", "healthy", "status", "Keine Warnungen", undefined, "success", r));
    }
    return out;
  }
}

export const roomInsightsEngine = new RoomInsightsEngine();
