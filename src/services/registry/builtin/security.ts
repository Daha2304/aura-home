import { deviceRegistry } from "../DeviceRegistry";

deviceRegistry.register({
  id: "camera",
  name: "Kamera",
  category: "security",
  icon: "Camera",
  color: "#0F172A",
  capabilities: [
    "supportsPower",
    "supportsNotifications",
    "supportsHistory",
    "supportsAutomation",
    "supportsOTA",
    "supportsFirmware",
    "supportsMultipleFunctions",
  ],
  functions: ["power", "boolean"],
  defaultWidgets: ["security"],
  control: "control.camera",
  detail: "detail.camera",
});

deviceRegistry.register({
  id: "doorbell",
  name: "Türklingel",
  category: "security",
  icon: "Bell",
  color: "#0F172A",
  capabilities: [
    "supportsBattery",
    "supportsSignal",
    "supportsNotifications",
    "supportsHistory",
    "supportsAutomation",
    "supportsChildDevices",
  ],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.doorbell",
  detail: "detail.doorbell",
});

deviceRegistry.register({
  id: "alarm",
  name: "Alarm",
  category: "security",
  icon: "ShieldAlert",
  color: "#DC2626",
  capabilities: [
    "supportsPower",
    "supportsNotifications",
    "supportsHistory",
    "supportsAutomation",
    "supportsScenes",
    "supportsMultipleFunctions",
  ],
  functions: ["power", "enum"],
  defaultWidgets: ["security"],
  control: "control.alarm",
  detail: "detail.alarm",
});
