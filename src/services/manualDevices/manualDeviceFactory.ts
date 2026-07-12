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

  return {
    id: node.id,
    kind,
    label: label.trim() || node.name || node.id.split(".").at(-1) || node.id,
    value: normalizeValue(node.value, node.valueType),
    unit: node.unit,
    min: kind === "battery" ? 0 : undefined,
    max: kind === "battery" ? 100 : undefined,
    readonly,
    updatedAt: node.ts,
    meta: {
      source: "iobroker",
      role: node.role,
      valueType: node.valueType,
      writable: node.writable,
      readable: node.readable,
    },
  };
}

function inferFunctionKind(node: IoBrokerObjectTreeNode): DeviceFunctionKind {
  const id = node.id.toLowerCase();
  const role = (node.role ?? "").toLowerCase();
  const unit = (node.unit ?? "").toLowerCase();

  if (role.includes("battery") || id.endsWith(".battery") || id.includes("battery")) return "battery";
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
