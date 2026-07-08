import type { Device } from "@/models/device";
import type { CapabilityFlag } from "@/models/deviceCapability";
import type { DeviceCategory } from "@/models/deviceCategory";
import type { DeviceTypeId } from "@/models/deviceType";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";

export interface DeviceFilterCriteria {
  roomId?: string | null;
  category?: DeviceCategory;
  type?: DeviceTypeId;
  online?: boolean;
  favorite?: boolean;
  hasWarning?: boolean;
  hasError?: boolean;
  minBattery?: number;
  minSignal?: number;
  tag?: string;
  capability?: CapabilityFlag;
  text?: string;
}

export type FilterPredicate = (d: Device, criteria: DeviceFilterCriteria) => boolean;

const builtinPredicates: FilterPredicate[] = [
  (d, c) => c.roomId === undefined || d.roomId === (c.roomId ?? undefined),
  (d, c) => c.type === undefined || d.type === c.type,
  (d, c) => c.online === undefined || d.online === c.online,
  (d, c) => c.favorite === undefined || Boolean(d.favorite) === c.favorite,
  (d, c) =>
    c.minBattery === undefined || (typeof d.battery === "number" && d.battery >= c.minBattery),
  (d, c) =>
    c.minSignal === undefined || (typeof d.signal === "number" && d.signal >= c.minSignal),
  (d, c) => c.tag === undefined || (d.tags?.includes(c.tag) ?? false),
  (d, c) => {
    if (!c.capability) return true;
    const flags = d.capabilityFlags ?? deviceRegistry.getCapabilities(d.type);
    return flags.includes(c.capability);
  },
  (d, c) => {
    if (!c.category) return true;
    const desc = deviceRegistry.get(d.type);
    return desc?.category === c.category;
  },
  (d, c) => {
    if (c.hasWarning === undefined) return true;
    const warn = typeof d.battery === "number" && d.battery <= 15;
    return warn === c.hasWarning;
  },
  (d, c) => {
    if (c.hasError === undefined) return true;
    return (d.lifecycle === "error") === c.hasError;
  },
  (d, c) => {
    if (!c.text) return true;
    const q = c.text.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.description?.toLowerCase().includes(q) ?? false) ||
      (d.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
    );
  },
];

export class DeviceFilterEngine {
  private readonly predicates: FilterPredicate[] = [...builtinPredicates];

  registerFilter(p: FilterPredicate): void {
    this.predicates.push(p);
  }

  apply(devices: readonly Device[], criteria: DeviceFilterCriteria): Device[] {
    if (!criteria || Object.keys(criteria).length === 0) return [...devices];
    const out: Device[] = [];
    for (const d of devices) {
      let ok = true;
      for (const p of this.predicates) {
        if (!p(d, criteria)) {
          ok = false;
          break;
        }
      }
      if (ok) out.push(d);
    }
    return out;
  }
}

export const deviceFilterEngine = new DeviceFilterEngine();
