import { deviceRegistry } from "../DeviceRegistry";

deviceRegistry.register({
  id: "blinds",
  name: "Rolladen",
  category: "covers",
  icon: "Blinds",
  color: "#6366F1",
  capabilities: [
    "supportsPosition",
    "supportsAutomation",
    "supportsTimers",
    "supportsScenes",
    "supportsGroups",
    "supportsHistory",
  ],
  functions: ["position"],
  defaultWidgets: ["favorites"],
  control: "control.blinds",
  detail: "detail.blinds",
});

deviceRegistry.register({
  id: "jalousie",
  name: "Jalousie",
  category: "covers",
  icon: "Blinds",
  color: "#6366F1",
  capabilities: [
    "supportsPosition",
    "supportsTilt",
    "supportsAutomation",
    "supportsTimers",
    "supportsScenes",
    "supportsGroups",
    "supportsHistory",
  ],
  functions: ["position", "tilt"],
  defaultWidgets: ["favorites"],
  control: "control.jalousie",
  detail: "detail.jalousie",
});

deviceRegistry.register({
  id: "awning",
  name: "Markise",
  category: "covers",
  icon: "Umbrella",
  color: "#F97316",
  capabilities: [
    "supportsPosition",
    "supportsAutomation",
    "supportsTimers",
    "supportsGroups",
    "supportsHistory",
  ],
  functions: ["position"],
  defaultWidgets: [],
  control: "control.awning",
  detail: "detail.awning",
});

deviceRegistry.register({
  id: "garage",
  name: "Garage",
  category: "covers",
  icon: "Car",
  color: "#94A3B8",
  capabilities: [
    "supportsPosition",
    "supportsAutomation",
    "supportsNotifications",
    "supportsHistory",
  ],
  functions: ["position"],
  defaultWidgets: ["security"],
  control: "control.garage",
  detail: "detail.garage",
});
