import { deviceRegistry } from "../DeviceRegistry";

const ENERGY_CAPS = [
  "supportsEnergy",
  "supportsHistory",
  "supportsStatistics",
  "supportsAutomation",
  "supportsMultipleFunctions",
] as const;

deviceRegistry.register({
  id: "energy",
  name: "Energie",
  category: "energy",
  icon: "Gauge",
  color: "#10B981",
  capabilities: [...ENERGY_CAPS],
  functions: ["power_watts", "voltage", "current", "energy"],
  defaultWidgets: ["energy"],
  control: "control.energy",
  detail: "detail.energy",
  charts: ["line", "bar", "area"],
});

deviceRegistry.register({
  id: "energyMeter",
  name: "Energiezähler",
  category: "energy",
  icon: "Zap",
  color: "#10B981",
  capabilities: [...ENERGY_CAPS],
  functions: ["power_watts", "voltage", "current", "energy"],
  defaultWidgets: ["energy"],
  control: "control.energy",
  detail: "detail.energy",
  charts: ["line", "bar", "area"],
});

deviceRegistry.register({
  id: "pv",
  name: "PV-Anlage",
  category: "energy",
  icon: "Sun",
  color: "#F59E0B",
  capabilities: [...ENERGY_CAPS],
  functions: ["power_watts", "energy"],
  defaultWidgets: ["energy"],
  control: "control.pv",
  detail: "detail.pv",
  charts: ["line", "area", "stackedBar"],
});

deviceRegistry.register({
  id: "battery",
  name: "Batteriespeicher",
  category: "energy",
  icon: "BatteryCharging",
  color: "#22C55E",
  capabilities: [...ENERGY_CAPS, "supportsBattery"],
  functions: ["battery", "power_watts", "energy"],
  defaultWidgets: ["energy"],
  control: "control.battery",
  detail: "detail.battery",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "wallbox",
  name: "Wallbox",
  category: "energy",
  icon: "Plug",
  color: "#0EA5E9",
  capabilities: [
    ...ENERGY_CAPS,
    "supportsPower",
    "supportsTimers",
    "supportsNotifications",
  ],
  functions: ["power", "power_watts", "current", "energy", "enum"],
  defaultWidgets: ["energy"],
  control: "control.wallbox",
  detail: "detail.wallbox",
  charts: ["line", "bar", "area"],
});
