import { deviceRegistry } from "../DeviceRegistry";

deviceRegistry.register({
  id: "thermostat",
  name: "Thermostat",
  category: "climate",
  icon: "Thermometer",
  color: "#F97316",
  capabilities: [
    "supportsPower",
    "supportsBattery",
    "supportsSignal",
    "supportsHistory",
    "supportsStatistics",
    "supportsAutomation",
    "supportsScenes",
    "supportsTimers",
    "supportsMultipleFunctions",
  ],
  functions: ["temperature", "power", "enum", "battery", "signal"],
  defaultWidgets: ["climate"],
  control: "control.thermostat",
  detail: "detail.thermostat",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "heating",
  name: "Heizung",
  category: "climate",
  icon: "Flame",
  color: "#EF4444",
  capabilities: [
    "supportsPower",
    "supportsHistory",
    "supportsStatistics",
    "supportsAutomation",
    "supportsTimers",
    "supportsEnergy",
    "supportsMultipleFunctions",
  ],
  functions: ["power", "temperature", "energy"],
  defaultWidgets: ["climate", "energy"],
  control: "control.heating",
  detail: "detail.heating",
  charts: ["line", "area", "bar"],
});

deviceRegistry.register({
  id: "ac",
  name: "Klimaanlage",
  category: "climate",
  icon: "Wind",
  color: "#0EA5E9",
  capabilities: [
    "supportsPower",
    "supportsHistory",
    "supportsAutomation",
    "supportsTimers",
    "supportsEnergy",
    "supportsMultipleFunctions",
  ],
  functions: ["power", "temperature", "enum", "speed"],
  defaultWidgets: ["climate"],
  control: "control.ac",
  detail: "detail.ac",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "fan",
  name: "Lüfter",
  category: "climate",
  icon: "Fan",
  color: "#38BDF8",
  capabilities: [
    "supportsPower",
    "supportsAutomation",
    "supportsTimers",
    "supportsHistory",
  ],
  functions: ["power", "speed"],
  defaultWidgets: [],
  control: "control.fan",
  detail: "detail.fan",
});
