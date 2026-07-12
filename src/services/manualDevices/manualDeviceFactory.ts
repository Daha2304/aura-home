import type { Device, DeviceFunction, DeviceFunctionKind } from "@/models/device";
import type { DeviceTypeId } from "@/models/deviceType";
import type { IoBrokerObjectTreeNode } from "@/models/iobrokerObject";
import { createId } from "@/utils/ids";

export interface ManualDeviceBindingInput {
  node: IoBrokerObjectTreeNode;
  label: string;
}

export interface ManualDeviceInput {
  name: string;
  roomId: string;
  type: DeviceTypeId;
  bindings: ManualDeviceBindingInput[];
}

export function createManualDevice(input: ManualDeviceInput): Device {
  const functions = input.bindings.map((binding) => createFunction(binding.node, binding.label));
  const battery = functions.find((fn) => fn.kind === "battery" && typeof fn.value === "number");

  return {
    id: createId("manual"),
    name: input.name.trim(),
    type: input.type,
    roomId: input.roomId,
    online: true,
    battery: typeof battery?.value === "number" ? battery.value : undefined,
    capabilities: [],
    functions,
    customProperties: {
      auraManual: true,
      bindings: input.bindings.map((binding) => ({
        stateId: binding.node.id,
        label: binding.label,
        role: binding.node.role,
        valueType: binding.node.valueType,
      })),
    },
    updatedAt: Date.now(),
  };
}

function createFunction(node: IoBrokerObjectTreeNode, label: string): DeviceFunction {
  const kind = inferFunctionKind(node);
  const readonly = node.writable !== true;
  const scale = getPercentageScale(node, kind);

  return {
    id: node.id,
    kind,
    label: label.trim() || node.name || node.id.split(".").at(-1) || node.id,
    value: kind === "dimmer"
      ? rawToPercent(normalizeNumber(node.value), scale?.min ?? 0, scale?.max ?? 100)
      : normalizeValue(node.value, node.valueType),
    unit: node.unit,
    min: kind === "battery" || kind === "dimmer" ? 0 : node.min,
    max: kind === "battery" || kind === "dimmer" ? 100 : node.max,
    readonly,
    updatedAt: node.ts,
    meta: {
      source: "iobroker",
      role: node.role,
      valueType: node.valueType,
      writable: node.writable,
      readable: node.readable,
      rawMin: scale?.min ?? node.min,
      rawMax: scale?.max ?? node.max,
      valueScale: scale ? "percent" : undefined,
    },
  };
}

function inferFunctionKind(node: IoBrokerObjectTreeNode): DeviceFunctionKind {
  const id = node.id.toLowerCase();
  const role = (node.role ?? "").toLowerCase();
  const unit = (node.unit ?? "").toLowerCase();

  if (role.includes("battery") || id.endsWith(".battery") || id.includes("battery")) return "battery";
  if (role.includes("dimmer") || role.includes("brightness") || id.includes("dimmer") || id.includes("brightness") || id.endsWith(".bri")) return "dimmer";
  if (role.includes("humidity") || id.includes("humidity")) return "humidity";
  if (role.includes("temperature") || id.includes("temperature")) return "temperature";
  if (role.includes("voltage") || id.includes("voltage")) return "voltage";
  if (role.includes("current") || id.includes("current")) return "current";
  if (role.includes("power") || unit === "w") return "power_watts";
  if (role.includes("switch") || role.includes("button")) return "power";
  if (node.valueType === "boolean") return "boolean";
  if (node.valueType === "number") return "number";
  if (node.valueType === "string") return "text";

  return "custom";
}

function getPercentageScale(
  node: IoBrokerObjectTreeNode,
  kind: DeviceFunctionKind,
): { min: number; max: number } | null {
  if (kind !== "dimmer") return null;

  const min = typeof node.min === "number" ? node.min : 0;
  const max = typeof node.max === "number" ? node.max : inferRawMax(node);

  return max > 100 ? { min, max } : null;
}

function inferRawMax(node: IoBrokerObjectTreeNode): number {
  const id = node.id.toLowerCase();
  const value = normalizeNumber(node.value);

  if (value > 100) {
    return 255;
  }

  if (id.includes("zigbee2mqtt") || id.includes("wled") || id.endsWith(".bri")) {
    return 255;
  }

  return 100;
}

function normalizeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function rawToPercent(value: number, rawMin: number, rawMax: number): number {
  if (rawMax <= rawMin) return 0;
  const percent = ((value - rawMin) / (rawMax - rawMin)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function normalizeValue(value: unknown, valueType?: string): unknown {
  if (valueType === "number" && typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : value;
  }

  if (valueType === "boolean" && typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return value;
}
