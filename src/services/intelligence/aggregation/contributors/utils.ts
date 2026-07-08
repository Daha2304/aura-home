import type { Device, DeviceFunction } from "@/models/device";
import type { MetricContributor } from "../MetricContributors";

/** Sichere Numerik-Konvertierung aus DeviceFunction/Capability-Werten. */
export function readNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function findFunction(d: Device, kind: DeviceFunction["kind"]): DeviceFunction | undefined {
  return d.functions?.find((f) => f.kind === kind);
}

export function functionValue(d: Device, kind: DeviceFunction["kind"]): number | undefined {
  return readNumber(findFunction(d, kind)?.value);
}

export function booleanValue(d: Device, kind: DeviceFunction["kind"]): boolean | undefined {
  const v = findFunction(d, kind)?.value;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return undefined;
}

/** Bewährter Contributor-Baustein für Zähler-Summen. */
export function countingReducer<T extends keyof import("@/models/roomMetrics").RoomMetrics>(
  field: T,
  predicate: (d: Device) => boolean,
): MetricContributor {
  return {
    id: `count:${String(field)}`,
    reset(acc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[field] = 0;
    },
    contribute({ device, acc }) {
      if (predicate(device)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc as any)[field] = ((acc as any)[field] ?? 0) + 1;
      }
    },
  };
}
