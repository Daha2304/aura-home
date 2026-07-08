import { deviceRegistry } from "../DeviceRegistry";

deviceRegistry.register({
  id: "outlet",
  name: "Steckdose",
  category: "appliance",
  icon: "Plug",
  color: "#64748B",
  capabilities: [
    "supportsPower",
    "supportsEnergy",
    "supportsAutomation",
    "supportsTimers",
    "supportsScenes",
    "supportsHistory",
    "supportsStatistics",
  ],
  functions: ["power", "power_watts", "energy"],
  defaultWidgets: ["quickActions"],
  control: "control.outlet",
  detail: "detail.outlet",
  charts: ["line", "bar"],
});

deviceRegistry.register({
  id: "vacuum",
  name: "Staubsaugerroboter",
  category: "appliance",
  icon: "CircleDot",
  color: "#8B5CF6",
  capabilities: [
    "supportsPower",
    "supportsBattery",
    "supportsSignal",
    "supportsAutomation",
    "supportsTimers",
    "supportsNotifications",
    "supportsHistory",
    "supportsMultipleFunctions",
  ],
  functions: ["power", "enum", "battery", "signal"],
  defaultWidgets: [],
  control: "control.vacuum",
  detail: "detail.vacuum",
});

deviceRegistry.register({
  id: "custom",
  name: "Benutzerdefiniert",
  category: "other",
  icon: "Sparkles",
  color: "#94A3B8",
  capabilities: ["supportsMultipleFunctions", "supportsHistory"],
  functions: ["custom"],
  defaultWidgets: [],
  control: "control.custom",
  detail: "detail.custom",
});
