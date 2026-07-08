import type { MetricContributor } from "../MetricContributors";
import { booleanValue } from "./utils";

function isOpen(d: import("@/models/device").Device): boolean {
  const b = booleanValue(d, "boolean");
  if (b !== undefined) return b;
  // Fallback: eine Position > 0 gilt als offen.
  const p = d.functions?.find((f) => f.kind === "position");
  if (p && typeof p.value === "number") return p.value > 0;
  return false;
}

export const openingsContributor: MetricContributor = {
  id: "openings",
  reset(acc) {
    acc.windowsOpen = 0;
    acc.doorsOpen = 0;
  },
  contribute({ device, acc }) {
    if (device.type === "window" || device.type === "windowContact") {
      if (isOpen(device)) acc.windowsOpen = (acc.windowsOpen ?? 0) + 1;
    } else if (device.type === "door" || device.type === "doorContact") {
      if (isOpen(device)) acc.doorsOpen = (acc.doorsOpen ?? 0) + 1;
    }
  },
};
