import type { MetricContributor } from "../MetricContributors";
import { functionValue } from "./utils";

interface Accum {
  temp: { sum: number; n: number };
  hum: { sum: number; n: number };
  co2: { sum: number; n: number };
  voc: { sum: number; n: number };
  aq: { sum: number; n: number };
}
const store = new WeakMap<object, Accum>();

function getAcc(key: object): Accum {
  let a = store.get(key);
  if (!a) {
    a = {
      temp: { sum: 0, n: 0 },
      hum: { sum: 0, n: 0 },
      co2: { sum: 0, n: 0 },
      voc: { sum: 0, n: 0 },
      aq: { sum: 0, n: 0 },
    };
    store.set(key, a);
  }
  return a;
}

export const climateContributor: MetricContributor = {
  id: "climate",
  reset(acc) {
    store.delete(acc as unknown as object);
    acc.temperature = undefined;
    acc.humidity = undefined;
    acc.co2 = undefined;
    acc.voc = undefined;
    acc.airQuality = undefined;
  },
  contribute({ device, acc }) {
    const a = getAcc(acc as unknown as object);
    const t = functionValue(device, "temperature");
    if (t !== undefined) {
      a.temp.sum += t;
      a.temp.n++;
    }
    const h = functionValue(device, "humidity");
    if (h !== undefined) {
      a.hum.sum += h;
      a.hum.n++;
    }
    const co2 = device.type === "co2" ? functionValue(device, "number") : undefined;
    if (co2 !== undefined) {
      a.co2.sum += co2;
      a.co2.n++;
    }
    const voc = device.type === "voc" ? functionValue(device, "number") : undefined;
    if (voc !== undefined) {
      a.voc.sum += voc;
      a.voc.n++;
    }
  },
  finalize(acc) {
    const a = getAcc(acc as unknown as object);
    if (a.temp.n) acc.temperature = a.temp.sum / a.temp.n;
    if (a.hum.n) acc.humidity = a.hum.sum / a.hum.n;
    if (a.co2.n) acc.co2 = a.co2.sum / a.co2.n;
    if (a.voc.n) acc.voc = a.voc.sum / a.voc.n;
    // Einfache Ableitung: airQuality ~ 100 - normalisiertes CO2/VOC.
    if (a.co2.n || a.voc.n) {
      const co2 = acc.co2 ?? 400;
      const voc = acc.voc ?? 0;
      const co2Score = Math.max(0, Math.min(100, 100 - (co2 - 400) / 12));
      const vocScore = Math.max(0, Math.min(100, 100 - voc / 5));
      acc.airQuality = (co2Score + vocScore) / 2;
    }
    store.delete(acc as unknown as object);
  },
};
