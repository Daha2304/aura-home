import type { MetricContributor } from "../MetricContributors";
import { booleanValue } from "./utils";

const LIGHT_TYPES = new Set(["light", "rgb", "dimmer"]);
const OUTLET_TYPES = new Set(["outlet"]);
const SHADE_TYPES = new Set(["blinds", "jalousie", "awning", "garage"]);
const HEATING_TYPES = new Set(["thermostat", "heating"]);
const AC_TYPES = new Set(["ac", "fan"]);
const MEDIA_TYPES = new Set(["tv", "avr", "speaker", "mediaPlayer"]);

function isPowered(d: import("@/models/device").Device): boolean {
  const p = booleanValue(d, "power");
  if (p !== undefined) return p;
  const cap = d.capabilities?.find((c) => c.kind === "onOff");
  if (cap && typeof (cap as { value?: unknown }).value === "boolean")
    return (cap as { value: boolean }).value;
  return false;
}

function shadeOpen(d: import("@/models/device").Device): boolean {
  const pos = d.functions?.find((f) => f.kind === "position");
  if (pos && typeof pos.value === "number") return pos.value > 0;
  const cap = d.capabilities?.find((c) => c.kind === "position");
  if (cap && typeof (cap as { value?: unknown }).value === "number")
    return (cap as { value: number }).value > 0;
  return false;
}

export const activityContributor: MetricContributor = {
  id: "activity",
  reset(acc) {
    acc.lightsActive = 0;
    acc.outletsActive = 0;
    acc.shadesOpen = 0;
    acc.heatingActive = 0;
    acc.acActive = 0;
    acc.mediaActive = 0;
  },
  contribute({ device, acc }) {
    if (LIGHT_TYPES.has(device.type) && isPowered(device))
      acc.lightsActive = (acc.lightsActive ?? 0) + 1;
    else if (OUTLET_TYPES.has(device.type) && isPowered(device))
      acc.outletsActive = (acc.outletsActive ?? 0) + 1;
    else if (SHADE_TYPES.has(device.type) && shadeOpen(device))
      acc.shadesOpen = (acc.shadesOpen ?? 0) + 1;
    else if (HEATING_TYPES.has(device.type) && isPowered(device))
      acc.heatingActive = (acc.heatingActive ?? 0) + 1;
    else if (AC_TYPES.has(device.type) && isPowered(device))
      acc.acActive = (acc.acActive ?? 0) + 1;
    else if (MEDIA_TYPES.has(device.type) && isPowered(device))
      acc.mediaActive = (acc.mediaActive ?? 0) + 1;
  },
};
