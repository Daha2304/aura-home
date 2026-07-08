import type { Device } from "@/models/device";
import type { Room } from "@/models/room";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";

export type GroupKey =
  | "none"
  | "room"
  | "category"
  | "type"
  | "manufacturer"
  | "online"
  | "favorite"
  | "tag"
  | "capability"
  | "custom";

export interface DeviceGroup {
  id: string;
  label: string;
  devices: Device[];
}

export interface GroupContext {
  rooms: Map<string, Room>;
}

export interface GroupStrategy {
  key: GroupKey;
  label: string;
  group: (devices: readonly Device[], ctx: GroupContext) => DeviceGroup[];
}

function push(map: Map<string, DeviceGroup>, id: string, label: string, d: Device) {
  let g = map.get(id);
  if (!g) {
    g = { id, label, devices: [] };
    map.set(id, g);
  }
  g.devices.push(d);
}

const noneStrategy: GroupStrategy = {
  key: "none",
  label: "Keine",
  group: (devices) => [{ id: "all", label: "Alle Geräte", devices: [...devices] }],
};

const roomStrategy: GroupStrategy = {
  key: "room",
  label: "Raum",
  group: (devices, ctx) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const id = d.roomId ?? "__unassigned";
      const label =
        (d.roomId && ctx.rooms.get(d.roomId)?.name) ?? "Nicht zugewiesen";
      push(map, id, label, d);
    }
    return [...map.values()];
  },
};

const categoryStrategy: GroupStrategy = {
  key: "category",
  label: "Kategorie",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const cat = deviceRegistry.get(d.type)?.category ?? "other";
      push(map, cat, cat, d);
    }
    return [...map.values()];
  },
};

const typeStrategy: GroupStrategy = {
  key: "type",
  label: "Gerätetyp",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const label = deviceRegistry.get(d.type)?.name ?? d.type;
      push(map, d.type, label, d);
    }
    return [...map.values()];
  },
};

const manufacturerStrategy: GroupStrategy = {
  key: "manufacturer",
  label: "Hersteller",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const m = d.manufacturer ?? "Unbekannt";
      push(map, m, m, d);
    }
    return [...map.values()];
  },
};

const onlineStrategy: GroupStrategy = {
  key: "online",
  label: "Online",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const id = d.online ? "online" : "offline";
      const label = d.online ? "Online" : "Offline";
      push(map, id, label, d);
    }
    return [...map.values()];
  },
};

const favoriteStrategy: GroupStrategy = {
  key: "favorite",
  label: "Favorit",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const id = d.favorite ? "favorite" : "other";
      const label = d.favorite ? "Favoriten" : "Weitere";
      push(map, id, label, d);
    }
    return [...map.values()];
  },
};

const tagStrategy: GroupStrategy = {
  key: "tag",
  label: "Tags",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const tags = d.tags && d.tags.length ? d.tags : ["__untagged"];
      for (const t of tags) push(map, t, t === "__untagged" ? "Ohne Tag" : t, d);
    }
    return [...map.values()];
  },
};

const capabilityStrategy: GroupStrategy = {
  key: "capability",
  label: "Capability",
  group: (devices) => {
    const map = new Map<string, DeviceGroup>();
    for (const d of devices) {
      const flags = d.capabilityFlags ?? deviceRegistry.getCapabilities(d.type);
      if (flags.length === 0) push(map, "__none", "Keine Capability", d);
      for (const f of flags) push(map, f, f.replace(/^supports/, ""), d);
    }
    return [...map.values()];
  },
};

const customStrategy: GroupStrategy = {
  key: "custom",
  label: "Benutzerdefiniert",
  group: (devices) => [{ id: "custom", label: "Alle", devices: [...devices] }],
};

const strategies = new Map<GroupKey, GroupStrategy>([
  ["none", noneStrategy],
  ["room", roomStrategy],
  ["category", categoryStrategy],
  ["type", typeStrategy],
  ["manufacturer", manufacturerStrategy],
  ["online", onlineStrategy],
  ["favorite", favoriteStrategy],
  ["tag", tagStrategy],
  ["capability", capabilityStrategy],
  ["custom", customStrategy],
]);

export function registerGroupStrategy(s: GroupStrategy) {
  strategies.set(s.key, s);
}

export function listGroupStrategies(): GroupStrategy[] {
  return [...strategies.values()];
}

export function groupDevices(
  devices: readonly Device[],
  key: GroupKey,
  ctx: GroupContext,
): DeviceGroup[] {
  const strat = strategies.get(key) ?? noneStrategy;
  return strat.group(devices, ctx);
}
