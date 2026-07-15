import type { Device } from "@/models/device";

const ALIAS_PREFIX = "alias.";

function idStartsWithAlias(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(ALIAS_PREFIX);
}

export function isAliasDevice(device: Pick<Device, "id" | "capabilities" | "functions">): boolean {
  if (idStartsWithAlias(device.id)) return true;

  return (
    device.capabilities.some((capability) => idStartsWithAlias(capability.id)) ||
    (device.functions ?? []).some((fn) => idStartsWithAlias(fn.id))
  );
}

export function isAliasRoomId(id: unknown): id is string {
  return idStartsWithAlias(id);
}
