/**
 * Deklarative Fähigkeits-Flags. Sie beschreiben, WAS ein Gerätetyp/ein Gerät
 * grundsätzlich kann — orthogonal zur konkreten, wertetragenden
 * {@link ./capability.Capability}-Union.
 *
 * Die UI kann später aus dieser Menge automatisch die passenden Controls
 * und Screens ableiten, ohne if/else-Ketten über {@link DeviceTypeId}.
 */
export type CapabilityFlag =
  | "supportsPower"
  | "supportsBrightness"
  | "supportsRGB"
  | "supportsColorTemperature"
  | "supportsPosition"
  | "supportsTilt"
  | "supportsEnergy"
  | "supportsBattery"
  | "supportsSignal"
  | "supportsHistory"
  | "supportsNotifications"
  | "supportsOTA"
  | "supportsGroups"
  | "supportsTimers"
  | "supportsScenes"
  | "supportsAutomation"
  | "supportsStatistics"
  | "supportsFirmware"
  | "supportsChildDevices"
  | "supportsMultipleFunctions";

export const ALL_CAPABILITY_FLAGS: readonly CapabilityFlag[] = [
  "supportsPower",
  "supportsBrightness",
  "supportsRGB",
  "supportsColorTemperature",
  "supportsPosition",
  "supportsTilt",
  "supportsEnergy",
  "supportsBattery",
  "supportsSignal",
  "supportsHistory",
  "supportsNotifications",
  "supportsOTA",
  "supportsGroups",
  "supportsTimers",
  "supportsScenes",
  "supportsAutomation",
  "supportsStatistics",
  "supportsFirmware",
  "supportsChildDevices",
  "supportsMultipleFunctions",
] as const;

export function isCapabilityFlag(v: unknown): v is CapabilityFlag {
  return typeof v === "string" && (ALL_CAPABILITY_FLAGS as readonly string[]).includes(v);
}
