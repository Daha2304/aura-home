import type { Device } from "@/models/device";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";

export type SortKey =
  | "name"
  | "room"
  | "category"
  | "lastActive"
  | "signal"
  | "battery"
  | "manufacturer"
  | "firmware"
  | "custom";

export type SortDirection = "asc" | "desc";

export interface SortStrategy {
  key: SortKey;
  label: string;
  compare: (a: Device, b: Device) => number;
}

const collator = new Intl.Collator("de", { sensitivity: "base", numeric: true });

const nameStrategy: SortStrategy = {
  key: "name",
  label: "Name",
  compare: (a, b) => collator.compare(a.name, b.name),
};

const roomStrategy: SortStrategy = {
  key: "room",
  label: "Raum",
  compare: (a, b) => collator.compare(a.roomId ?? "", b.roomId ?? ""),
};

const categoryStrategy: SortStrategy = {
  key: "category",
  label: "Kategorie",
  compare: (a, b) => {
    const ca = deviceRegistry.get(a.type)?.category ?? "other";
    const cb = deviceRegistry.get(b.type)?.category ?? "other";
    return collator.compare(ca, cb);
  },
};

const lastActiveStrategy: SortStrategy = {
  key: "lastActive",
  label: "Zuletzt aktiv",
  compare: (a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0),
};

const signalStrategy: SortStrategy = {
  key: "signal",
  label: "Signal",
  compare: (a, b) => (b.signal ?? -1) - (a.signal ?? -1),
};

const batteryStrategy: SortStrategy = {
  key: "battery",
  label: "Batterie",
  compare: (a, b) => (a.battery ?? 101) - (b.battery ?? 101),
};

const manufacturerStrategy: SortStrategy = {
  key: "manufacturer",
  label: "Hersteller",
  compare: (a, b) => collator.compare(a.manufacturer ?? "", b.manufacturer ?? ""),
};

const firmwareStrategy: SortStrategy = {
  key: "firmware",
  label: "Firmware",
  compare: (a, b) => collator.compare(a.firmware ?? "", b.firmware ?? ""),
};

const customStrategy: SortStrategy = {
  key: "custom",
  label: "Benutzerdefiniert",
  compare: () => 0,
};

const strategies = new Map<SortKey, SortStrategy>([
  ["name", nameStrategy],
  ["room", roomStrategy],
  ["category", categoryStrategy],
  ["lastActive", lastActiveStrategy],
  ["signal", signalStrategy],
  ["battery", batteryStrategy],
  ["manufacturer", manufacturerStrategy],
  ["firmware", firmwareStrategy],
  ["custom", customStrategy],
]);

export function registerSortStrategy(s: SortStrategy) {
  strategies.set(s.key, s);
}

export function listSortStrategies(): SortStrategy[] {
  return Array.from(strategies.values());
}

export function sortDevices(
  devices: readonly Device[],
  key: SortKey,
  direction: SortDirection = "asc",
): Device[] {
  const strat = strategies.get(key) ?? nameStrategy;
  const copy = devices.slice();
  copy.sort(strat.compare);
  if (direction === "desc") copy.reverse();
  return copy;
}
