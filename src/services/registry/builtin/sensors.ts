import { deviceRegistry } from "../DeviceRegistry";

const SENSOR_CAPS = [
  "supportsBattery",
  "supportsSignal",
  "supportsHistory",
  "supportsStatistics",
  "supportsNotifications",
  "supportsAutomation",
] as const;

deviceRegistry.register({
  id: "motion",
  name: "Bewegungsmelder",
  category: "sensors",
  icon: "Activity",
  color: "#EAB308",
  capabilities: [...SENSOR_CAPS],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "heatmap"],
});

deviceRegistry.register({
  id: "presence",
  name: "Präsenzsensor",
  category: "sensors",
  icon: "UserCheck",
  color: "#EAB308",
  capabilities: [...SENSOR_CAPS],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "heatmap"],
});

deviceRegistry.register({
  id: "temperature",
  name: "Temperatursensor",
  category: "sensors",
  icon: "Thermometer",
  color: "#F97316",
  capabilities: [...SENSOR_CAPS],
  functions: ["temperature", "battery", "signal"],
  defaultWidgets: ["climate"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "humidity",
  name: "Luftfeuchtigkeit",
  category: "sensors",
  icon: "Droplets",
  color: "#0EA5E9",
  capabilities: [...SENSOR_CAPS],
  functions: ["humidity", "battery", "signal"],
  defaultWidgets: ["climate"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "pressure",
  name: "Luftdruck",
  category: "sensors",
  icon: "Gauge",
  color: "#8B5CF6",
  capabilities: [...SENSOR_CAPS],
  functions: ["number", "battery", "signal"],
  defaultWidgets: ["climate"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "co2",
  name: "CO₂",
  category: "sensors",
  icon: "Wind",
  color: "#22C55E",
  capabilities: [...SENSOR_CAPS],
  functions: ["number", "battery", "signal"],
  defaultWidgets: ["climate"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "voc",
  name: "VOC",
  category: "sensors",
  icon: "CloudFog",
  color: "#14B8A6",
  capabilities: [...SENSOR_CAPS],
  functions: ["number", "battery", "signal"],
  defaultWidgets: ["climate"],
  control: "control.sensor",
  detail: "detail.sensor",
  charts: ["line", "area"],
});

deviceRegistry.register({
  id: "smoke",
  name: "Rauchmelder",
  category: "sensors",
  icon: "Flame",
  color: "#DC2626",
  capabilities: [...SENSOR_CAPS],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.sensor",
  detail: "detail.sensor",
});

deviceRegistry.register({
  id: "water",
  name: "Wassersensor",
  category: "sensors",
  icon: "Waves",
  color: "#3B82F6",
  capabilities: [...SENSOR_CAPS],
  functions: ["boolean", "battery", "signal"],
  defaultWidgets: ["security"],
  control: "control.sensor",
  detail: "detail.sensor",
});

deviceRegistry.register({
  id: "sensor",
  name: "Generischer Sensor",
  category: "sensors",
  icon: "Activity",
  color: "#64748B",
  capabilities: [...SENSOR_CAPS, "supportsMultipleFunctions"],
  functions: ["number", "boolean", "text", "battery", "signal"],
  defaultWidgets: [],
  control: "control.sensor",
  detail: "detail.sensor",
});
