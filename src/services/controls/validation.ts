import type { CapabilityDescriptor } from "@/models/capabilityDescriptor";
import { AppError } from "@/services/errors/AppError";

/**
 * Coerces and validates a value against a capability descriptor.
 * Returns the sanitized value on success or throws an {@link AppError}
 * describing the violation.
 */
export function validateAgainstDescriptor(
  value: unknown,
  descriptor: CapabilityDescriptor,
): unknown {
  if (descriptor.readOnly) {
    throw new AppError("parse", `Capability ${descriptor.name} ist readOnly`);
  }
  switch (descriptor.dataType) {
    case "boolean":
      return Boolean(value);
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) {
        throw new AppError("parse", `Ungültige Zahl für ${descriptor.name}`);
      }
      return clampAndStep(n, descriptor);
    }
    case "enum": {
      const s = String(value);
      const opts = descriptor.validation?.enum;
      if (opts && !opts.includes(s)) {
        throw new AppError("parse", `Wert '${s}' nicht in Enum`);
      }
      return s;
    }
    case "string":
      return String(value);
    case "color":
      return sanitizeColor(value);
    case "composite":
    default:
      return value;
  }
}

function clampAndStep(n: number, d: CapabilityDescriptor): number {
  let v = n;
  const { min, max, step, precision } = d.validation ?? {};
  if (typeof min === "number") v = Math.max(min, v);
  if (typeof max === "number") v = Math.min(max, v);
  if (typeof step === "number" && step > 0) {
    const base = typeof min === "number" ? min : 0;
    v = base + Math.round((v - base) / step) * step;
  }
  if (typeof precision === "number") {
    const p = Math.pow(10, precision);
    v = Math.round(v * p) / p;
  }
  return v;
}

function sanitizeColor(v: unknown): { r: number; g: number; b: number } {
  if (
    v &&
    typeof v === "object" &&
    "r" in (v as object) &&
    "g" in (v as object) &&
    "b" in (v as object)
  ) {
    const o = v as { r: number; g: number; b: number };
    const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
    return { r: clamp(o.r), g: clamp(o.g), b: clamp(o.b) };
  }
  throw new AppError("parse", "Ungültige Farbe");
}
