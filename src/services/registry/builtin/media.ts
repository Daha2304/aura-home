import { deviceRegistry } from "../DeviceRegistry";

const MEDIA_CAPS = [
  "supportsPower",
  "supportsAutomation",
  "supportsScenes",
  "supportsHistory",
  "supportsMultipleFunctions",
] as const;

deviceRegistry.register({
  id: "tv",
  name: "TV",
  category: "media",
  icon: "Tv",
  color: "#0EA5E9",
  capabilities: [...MEDIA_CAPS],
  functions: ["power", "enum", "number"],
  defaultWidgets: [],
  control: "control.media",
  detail: "detail.media",
});

deviceRegistry.register({
  id: "avr",
  name: "AV Receiver",
  category: "media",
  icon: "Speaker",
  color: "#8B5CF6",
  capabilities: [...MEDIA_CAPS],
  functions: ["power", "enum", "number"],
  defaultWidgets: [],
  control: "control.media",
  detail: "detail.media",
});

deviceRegistry.register({
  id: "speaker",
  name: "Lautsprecher",
  category: "media",
  icon: "Speaker",
  color: "#8B5CF6",
  capabilities: [...MEDIA_CAPS],
  functions: ["power", "number"],
  defaultWidgets: [],
  control: "control.media",
  detail: "detail.media",
});

deviceRegistry.register({
  id: "mediaPlayer",
  name: "Media Player",
  category: "media",
  icon: "PlayCircle",
  color: "#EC4899",
  capabilities: [...MEDIA_CAPS],
  functions: ["power", "text", "number"],
  defaultWidgets: [],
  control: "control.media",
  detail: "detail.media",
});
