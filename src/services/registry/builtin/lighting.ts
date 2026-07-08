import { deviceRegistry } from "../DeviceRegistry";

deviceRegistry.register({
  id: "light",
  name: "Licht",
  category: "lighting",
  icon: "Lightbulb",
  color: "#F5C518",
  capabilities: [
    "supportsPower",
    "supportsScenes",
    "supportsAutomation",
    "supportsGroups",
    "supportsTimers",
    "supportsNotifications",
    "supportsHistory",
  ],
  functions: ["power"],
  defaultWidgets: ["favorites", "quickActions"],
  control: "control.light",
  detail: "detail.light",
  charts: ["line", "bar"],
});

deviceRegistry.register({
  id: "dimmer",
  name: "Dimmer",
  category: "lighting",
  icon: "SlidersHorizontal",
  color: "#F5C518",
  capabilities: [
    "supportsPower",
    "supportsBrightness",
    "supportsScenes",
    "supportsAutomation",
    "supportsGroups",
    "supportsTimers",
    "supportsHistory",
  ],
  functions: ["power", "dimmer"],
  defaultWidgets: ["favorites"],
  control: "control.dimmer",
  detail: "detail.dimmer",
  charts: ["line"],
});

deviceRegistry.register({
  id: "rgb",
  name: "RGB Licht",
  category: "lighting",
  icon: "Palette",
  color: "#EC4899",
  capabilities: [
    "supportsPower",
    "supportsBrightness",
    "supportsRGB",
    "supportsColorTemperature",
    "supportsScenes",
    "supportsAutomation",
    "supportsGroups",
    "supportsTimers",
    "supportsHistory",
  ],
  functions: ["power", "dimmer", "rgb", "colorTemperature"],
  defaultWidgets: ["favorites", "scenes"],
  control: "control.rgb",
  detail: "detail.rgb",
  charts: ["line"],
});
