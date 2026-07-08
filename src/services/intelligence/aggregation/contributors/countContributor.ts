import type { MetricContributor } from "../MetricContributors";

export const countContributor: MetricContributor = {
  id: "counts",
  reset(acc) {
    acc.deviceCount = 0;
    acc.online = 0;
    acc.offline = 0;
    acc.unreachable = 0;
    acc.favorites = 0;
    acc.warnings = 0;
    acc.errors = 0;
    acc.discoveryPending = 0;
    acc.syncPending = 0;
  },
  contribute({ device, acc }) {
    acc.deviceCount = (acc.deviceCount ?? 0) + 1;
    if (device.online) acc.online = (acc.online ?? 0) + 1;
    else acc.offline = (acc.offline ?? 0) + 1;

    if (device.lifecycle === "unreachable") acc.unreachable = (acc.unreachable ?? 0) + 1;
    if (device.lifecycle === "discovered" || device.lifecycle === "pending")
      acc.discoveryPending = (acc.discoveryPending ?? 0) + 1;
    if (device.lifecycle === "syncing") acc.syncPending = (acc.syncPending ?? 0) + 1;
    if (device.lifecycle === "error") acc.errors = (acc.errors ?? 0) + 1;

    if (device.favorite) acc.favorites = (acc.favorites ?? 0) + 1;

    const battery = device.battery;
    if (typeof battery === "number" && battery <= 15) acc.warnings = (acc.warnings ?? 0) + 1;

    const last = device.lastSeen;
    if (typeof last === "number") {
      acc.lastActivity = Math.max(acc.lastActivity ?? 0, last);
    }
  },
};
