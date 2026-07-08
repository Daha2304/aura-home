import { deviceRegistry } from "../DeviceRegistry";

deviceRegistry.register({
  id: "door",
  name: "Tür",
  category: "openings",
  icon: "DoorOpen",
  color: "#94A3B8",
  capabilities: [
    "supportsPower",
    "supportsAutomation",
    "supportsNotifications",
    "supportsHistory",
  ],
  functions: ["boolean"],
  defaultWidgets: ["security"],
  control: "control.door",
  detail: "detail.door",
});

deviceRegistry.register({
  id: "window",
  name: "Fenster",
  category: "openings",
  icon: "PanelTopOpen",
  color: "#94A3B8",
  capabilities: [
    "supportsPosition",
    "supportsAutomation",
    "supportsNotifications",
    "supportsHistory",
  ],
  functions: ["position"],
  defaultWidgets: ["security"],
  control: "control.window",
  detail: "detail.window",
});

deviceRegistry.register({
  id: "doorContact",
  name: "Türkontakt",
  category: "openings",
  icon: "DoorClosed",
  color: "#22C55E",
  capabilities: [
    "supportsBattery",
    "supportsSignal",
    "supportsNotifications",
    "supportsHistory",
    "supportsAutomation",
  ],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.contact",
  detail: "detail.contact",
});

deviceRegistry.register({
  id: "windowContact",
  name: "Fensterkontakt",
  category: "openings",
  icon: "PanelTop",
  color: "#22C55E",
  capabilities: [
    "supportsBattery",
    "supportsSignal",
    "supportsNotifications",
    "supportsHistory",
    "supportsAutomation",
  ],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.contact",
  detail: "detail.contact",
});
