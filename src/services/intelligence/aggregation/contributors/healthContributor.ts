import type { MetricContributor } from "../MetricContributors";

interface HealthAcc {
  battery: { sum: number; n: number };
  signal: { sum: number; n: number };
}
const store = new WeakMap<object, HealthAcc>();

function getAcc(key: object): HealthAcc {
  let a = store.get(key);
  if (!a) {
    a = { battery: { sum: 0, n: 0 }, signal: { sum: 0, n: 0 } };
    store.set(key, a);
  }
  return a;
}

export const healthContributor: MetricContributor = {
  id: "health",
  reset(acc) {
    store.delete(acc as unknown as object);
    acc.batteryAvg = undefined;
    acc.signalAvg = undefined;
  },
  contribute({ device, acc }) {
    const a = getAcc(acc as unknown as object);
    if (typeof device.battery === "number") {
      a.battery.sum += device.battery;
      a.battery.n++;
    }
    if (typeof device.signal === "number") {
      a.signal.sum += device.signal;
      a.signal.n++;
    }
  },
  finalize(acc) {
    const a = getAcc(acc as unknown as object);
    if (a.battery.n) acc.batteryAvg = a.battery.sum / a.battery.n;
    if (a.signal.n) acc.signalAvg = a.signal.sum / a.signal.n;
    store.delete(acc as unknown as object);
  },
};
