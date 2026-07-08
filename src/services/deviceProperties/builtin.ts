import type { DevicePropertyDescriptor } from "@/models/deviceProperty";
import { devicePropertyRegistry } from "./DevicePropertyRegistry";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";

const BUILTINS: DevicePropertyDescriptor[] = [
  // Identity
  { id: "name", label: "Name", group: "identity", priority: 100, read: (d) => d.name },
  {
    id: "type",
    label: "Typ",
    group: "identity",
    priority: 95,
    read: (d) => deviceRegistry.get(d.type)?.name ?? d.type,
  },
  {
    id: "category",
    label: "Kategorie",
    group: "identity",
    priority: 90,
    read: (d) => deviceRegistry.get(d.type)?.category ?? null,
  },
  { id: "manufacturer", label: "Hersteller", group: "identity", priority: 85, read: (d) => d.manufacturer ?? null },
  { id: "model", label: "Modell", group: "identity", priority: 80, read: (d) => d.model ?? null },
  { id: "description", label: "Beschreibung", group: "identity", priority: 40, read: (d) => d.description ?? null },
  { id: "floor", label: "Etage", group: "identity", priority: 30, read: (d) => (typeof d.floor === "number" ? d.floor : null) },

  // Firmware / versioning
  { id: "firmware", label: "Firmware", group: "firmware", priority: 100, read: (d) => d.firmware ?? null },
  { id: "softwareVersion", label: "Software", group: "firmware", priority: 90, read: (d) => d.softwareVersion ?? null },
  { id: "hardwareVersion", label: "Hardware", group: "firmware", priority: 80, read: (d) => d.hardwareVersion ?? null },

  // Hardware ids
  { id: "uuid", label: "UUID", group: "hardware", priority: 100, read: (d) => d.uuid ?? null },
  { id: "serial", label: "Serial", group: "hardware", priority: 90, read: (d) => d.serial ?? null },

  // Network
  { id: "mac", label: "MAC", group: "network", priority: 100, read: (d) => d.mac ?? null },
  {
    id: "ip",
    label: "IP",
    group: "network",
    priority: 95,
    read: (d) => {
      const attrs = d.attributes ?? {};
      const ip = attrs.ip ?? attrs.ipAddress ?? attrs.address;
      return typeof ip === "string" ? ip : null;
    },
  },
  {
    id: "protocol",
    label: "Protokoll",
    group: "network",
    priority: 80,
    read: (d) => {
      const attrs = d.attributes ?? {};
      const p = attrs.protocol;
      return typeof p === "string" ? p : null;
    },
  },

  // Diagnostics
  { id: "lifecycle", label: "Lifecycle", group: "diagnostics", priority: 100, read: (d) => d.lifecycle ?? null },
  { id: "online", label: "Verbindung", group: "diagnostics", priority: 95, read: (d) => (d.online ? "Online" : "Offline") },
  {
    id: "lastSeen",
    label: "Zuletzt gesehen",
    group: "diagnostics",
    priority: 85,
    read: (d) => (typeof d.lastSeen === "number" ? d.lastSeen : null),
    format: (v) => (typeof v === "number" ? new Date(v).toLocaleString() : "—"),
  },
  {
    id: "updatedAt",
    label: "Aktualisiert",
    group: "diagnostics",
    priority: 80,
    read: (d) => (typeof d.updatedAt === "number" ? d.updatedAt : null),
    format: (v) => (typeof v === "number" ? new Date(v).toLocaleString() : "—"),
  },
  {
    id: "version",
    label: "Version (lokal)",
    group: "diagnostics",
    priority: 70,
    read: (d) => (typeof d.version === "number" ? d.version : null),
  },
  {
    id: "serverVersion",
    label: "Version (Server)",
    group: "diagnostics",
    priority: 60,
    read: (d) => (typeof d.serverVersion === "number" ? d.serverVersion : null),
  },
  {
    id: "signal",
    label: "Signal",
    group: "diagnostics",
    priority: 55,
    read: (d) => (typeof d.signal === "number" ? d.signal : null),
    format: (v) => (typeof v === "number" ? `${Math.round(v)} %` : "—"),
  },
  {
    id: "battery",
    label: "Batterie",
    group: "diagnostics",
    priority: 50,
    read: (d) => (typeof d.battery === "number" ? d.battery : null),
    format: (v) => (typeof v === "number" ? `${Math.round(v)} %` : "—"),
  },
];

let bootstrapped = false;
export function bootstrapDevicePropertyRegistry(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  for (const d of BUILTINS) devicePropertyRegistry.register(d);
}
