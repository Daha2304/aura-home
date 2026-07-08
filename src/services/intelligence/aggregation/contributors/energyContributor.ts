import type { MetricContributor } from "../MetricContributors";
import { functionValue } from "./utils";

export const energyContributor: MetricContributor = {
  id: "energy",
  reset(acc) {
    acc.powerWatts = 0;
    acc.energyKwh = 0;
  },
  contribute({ device, acc }) {
    const p =
      functionValue(device, "power_watts") ??
      (device.capabilities?.find((c) => c.kind === "energy") as { power?: number } | undefined)
        ?.power;
    if (typeof p === "number" && Number.isFinite(p)) {
      acc.powerWatts = (acc.powerWatts ?? 0) + p;
    }
    const e =
      functionValue(device, "energy") ??
      (device.capabilities?.find((c) => c.kind === "energy") as { total?: number } | undefined)
        ?.total;
    if (typeof e === "number" && Number.isFinite(e)) {
      acc.energyKwh = (acc.energyKwh ?? 0) + e;
    }
  },
};
