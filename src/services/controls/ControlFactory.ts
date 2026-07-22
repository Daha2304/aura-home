import type { Capability } from "@/models/capability";
import type { CapabilityDescriptor } from "@/models/capabilityDescriptor";
import type { ControlSpec } from "@/models/controlSpec";
import type { Device, DeviceFunction, DeviceFunctionKind } from "@/models/device";
import { capabilityRegistry } from "@/services/capabilities/CapabilityRegistry";
import { controlRegistry } from "./ControlRegistry";

interface CacheEntry {
  capsRef: Capability[];
  functionsRef: Device["functions"];
  specs: ControlSpec[];
}

/**
 * Deterministically builds ControlSpecs from a Device's capabilities.
 * Absolutely no per-device-type branching lives here.
 */
class ControlFactoryImpl {
  private readonly cache = new WeakMap<Device, CacheEntry>();

  buildForDevice(device: Device): ControlSpec[] {
    const cached = this.cache.get(device);
    if (
      cached &&
      cached.capsRef === device.capabilities &&
      cached.functionsRef === device.functions
    ) {
      return cached.specs;
    }

    const specs: ControlSpec[] = [];
    for (const cap of device.capabilities ?? []) {
      const descriptor = capabilityRegistry.get(cap.kind);
      if (!descriptor) continue;

      const readOnly = Boolean(descriptor.readOnly || cap.readonly);
      const controlType = pickControlType(descriptor, readOnly);
      if (!controlType) continue;
      const value = "value" in cap ? (cap as { value: unknown }).value : cap;
      const override = readControlOverride(device, cap.id);

      specs.push({
        id: `${device.id}:${cap.id}:${controlType}`,
        deviceId: device.id,
        capabilityId: cap.id,
        capabilityKind: cap.kind,
        controlType,
        descriptor,
        currentValue: value,
        commandKey: cap.id,
        group: descriptor.category,
        priority: descriptor.priority,
        readOnly,
        capability: cap,
        displayLabel: override?.label,
        order: override?.order,
        valueLabels: override?.valueLabels,
      });
    }

    // Synthesize capabilities from generic DeviceFunction entries. This makes
    // dynamic, protocol-agnostic functions bindable without any device-type
    // branching. Skip ids that already exist as native capabilities.
    const takenIds = new Set(specs.map((s) => s.capabilityId));
    for (const fn of device.functions ?? []) {
      if (fn.meta?.visibleControl === false) continue;
      if (takenIds.has(fn.id)) continue;
      const kind = normalizeFunctionKind(fn);
      const descriptor = capabilityRegistry.get(kind);
      if (!descriptor) continue;
      const readOnly = Boolean(descriptor.readOnly || fn.readonly);
      const controlType = pickControlType(descriptor, readOnly);
      if (!controlType) continue;
      const value = normalizeFunctionValue(fn, kind);
      const override = readControlOverride(device, fn.id);
      const synthetic = {
        kind,
        id: fn.id,
        label: fn.label,
        readonly: fn.readonly,
        value,
        // enum options passthrough for mode-like functions
        options: fn.options,
        unit: fn.unit,
        min: kind === "dimmer" ? 0 : fn.min,
        max: kind === "dimmer" ? 100 : fn.max,
        step: fn.step,
      } as unknown as Capability;
      specs.push({
        id: `${device.id}:${fn.id}:${controlType}`,
        deviceId: device.id,
        capabilityId: fn.id,
        capabilityKind: kind,
        controlType,
        descriptor,
        currentValue: value,
        commandKey: fn.id,
        group: descriptor.category,
        priority: descriptor.priority - 5,
        readOnly,
        capability: synthetic,
        displayLabel: override?.label,
        order: override?.order,
        valueLabels: override?.valueLabels,
      });
    }

    specs.sort(compareControlSpecs);
    this.cache.set(device, { capsRef: device.capabilities, functionsRef: device.functions, specs });
    return specs;
  }
}

interface ControlOverride {
  label?: string;
  order?: number;
  valueLabels?: {
    true?: string;
    false?: string;
  };
}

function readControlOverride(device: Device, stateId: string): ControlOverride | undefined {
  const overrides = device.customProperties?.controlOverrides;
  if (!overrides || typeof overrides !== "object") return undefined;
  const override = (overrides as Record<string, unknown>)[stateId];
  if (!override || typeof override !== "object") return undefined;
  return override as ControlOverride;
}

function compareControlSpecs(a: ControlSpec, b: ControlSpec): number {
  const aOrder = typeof a.order === "number" && Number.isFinite(a.order) ? a.order : undefined;
  const bOrder = typeof b.order === "number" && Number.isFinite(b.order) ? b.order : undefined;

  if (aOrder !== undefined || bOrder !== undefined) {
    if (aOrder === undefined) return 1;
    if (bOrder === undefined) return -1;
    if (aOrder !== bOrder) return aOrder - bOrder;
  }

  return b.priority - a.priority;
}

function normalizeFunctionKind(fn: DeviceFunction): DeviceFunctionKind {
  const role = typeof fn.meta?.role === "string" ? fn.meta.role.toLowerCase() : "";
  const id = fn.id.toLowerCase();

  if (
    fn.kind === "dimmer" ||
    role.includes("dimmer") ||
    role.includes("brightness") ||
    id.includes("dimmer") ||
    id.includes("brightness") ||
    id.endsWith(".bri")
  ) {
    return "dimmer";
  }

  if (fn.kind === "power_watts") return "powerConsumption" as DeviceFunctionKind;
  if (fn.kind === "battery" || fn.kind === "signal") return "number";

  return fn.kind;
}

function normalizeFunctionValue(fn: DeviceFunction, kind: DeviceFunctionKind): unknown {
  if (kind !== "dimmer") return fn.value;

  if (fn.meta?.valueScale === "percent") return clampPercent(asNumber(fn.value));

  return clampPercent(asNumber(fn.value));
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pickControlType(descriptor: CapabilityDescriptor, readOnly = false): string | undefined {
  if (readOnly) {
    const readout = descriptor.altControlTypes?.find((type) => type.startsWith("readout."));
    if (readout && controlRegistry.resolve(readout)) return readout;
    if (
      descriptor.controlType.startsWith("readout.") &&
      controlRegistry.resolve(descriptor.controlType)
    ) {
      return descriptor.controlType;
    }
  }

  const primary = controlRegistry.resolve(descriptor.controlType);
  if (primary) return descriptor.controlType;
  const fallback = controlRegistry.resolveWithFallback(descriptor.altControlTypes ?? []);
  return fallback?.controlType;
}

export const controlFactory = new ControlFactoryImpl();
