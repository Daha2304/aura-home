import type { Device } from "@/models/device";
import { isCapabilityFlag } from "@/models/deviceCapability";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import type { DeviceTypeId } from "@/models/deviceType";

export interface ValidationResult {
  ok: boolean;
  reason?: string;
  code?: string;
}

function fail(deviceId: unknown, code: string, reason: string): ValidationResult {
  errorBus.report(
    new AppError("invalid_message", reason, {
      code,
      context: { deviceId },
    }),
  );
  return { ok: false, code, reason };
}

const KNOWN_DEVICE_TYPES: ReadonlySet<DeviceTypeId> = new Set([
  "light",
  "rgb",
  "dimmer",
  "outlet",
  "blinds",
  "jalousie",
  "awning",
  "garage",
  "door",
  "window",
  "doorContact",
  "windowContact",
  "motion",
  "presence",
  "temperature",
  "humidity",
  "pressure",
  "co2",
  "voc",
  "smoke",
  "water",
  "sensor",
  "thermostat",
  "heating",
  "ac",
  "fan",
  "tv",
  "avr",
  "speaker",
  "mediaPlayer",
  "camera",
  "doorbell",
  "alarm",
  "energy",
  "energyMeter",
  "pv",
  "battery",
  "wallbox",
  "vacuum",
  "custom",
]);

function isKnownDeviceType(type: string): type is DeviceTypeId {
  return KNOWN_DEVICE_TYPES.has(type as DeviceTypeId);
}

/**
 * Prüft ein rohes Gerät auf strukturelle Gültigkeit, bevor es Registry/Store
 * erreicht. Alle Fehler laufen über den zentralen ErrorBus.
 */
export function validateIncomingDevice(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return fail(undefined, "invalid_device", "Ungültiges Geräteobjekt");
  }
  const d = raw as Partial<Device>;
  if (!d.id || typeof d.id !== "string") {
    return fail(d.id, "missing_id", "Gerät ohne ID");
  }
  if (!d.type || typeof d.type !== "string") {
    return fail(d.id, "missing_type", "Gerät ohne Typ");
  }
  if (!deviceRegistry.has(d.type) && !isKnownDeviceType(d.type)) {
    return fail(d.id, "unknown_device_type", `Unbekannter Gerätetyp: ${d.type}`);
  }
  if (!Array.isArray(d.capabilities)) {
    return fail(d.id, "invalid_capabilities", "capabilities muss ein Array sein");
  }
  if (d.capabilityFlags && !d.capabilityFlags.every(isCapabilityFlag)) {
    return fail(d.id, "invalid_capability", "Unbekannter CapabilityFlag");
  }
  return { ok: true };
}

/**
 * Prüft, ob ein Firmware-String akzeptabel ist. Aktuell nur strukturelle
 * Prüfung (Semver-ähnlich); echte Server-Kompatibilitätsregeln werden
 * später konfigurierbar über eine Policy nachgereicht.
 */
export function validateFirmware(firmware: unknown, deviceId?: string): ValidationResult {
  if (firmware === undefined || firmware === null) return { ok: true };
  if (typeof firmware !== "string" || firmware.length === 0) {
    return fail(deviceId, "firmware_incompatible", "Ungültige Firmware-Angabe");
  }
  return { ok: true };
}
