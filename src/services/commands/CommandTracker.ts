import type { Command } from "@/models/command";
import type { Device } from "@/models/device";
import { useDevicesStore } from "@/store/slices/devicesStore";

/**
 * Erzeugt einen minimalen Snapshot für ein einzelnes Feld/Capability,
 * damit optimistische Updates zuverlässig rollbackbar sind.
 */
export interface OptimisticSnapshot {
  deviceId: string;
  key: string;
  previousValue: unknown;
}

function readValue(device: Device, key: string): unknown {
  const cap = device.capabilities.find((c) => c.id === key);
  if (cap && "value" in cap) return (cap as { value: unknown }).value;
  const fn = device.functions?.find((f) => f.id === key);
  if (fn) return fn.value;
  return device.attributes?.[key];
}

function writeValue(device: Device, key: string, value: unknown): Device {
  const capIndex = device.capabilities.findIndex((c) => c.id === key);
  if (capIndex >= 0) {
    const capabilities = device.capabilities.slice();
    capabilities[capIndex] = {
      ...(capabilities[capIndex] as object),
      value,
    } as (typeof capabilities)[number];
    return { ...device, capabilities };
  }
  const fnIndex = device.functions?.findIndex((f) => f.id === key) ?? -1;
  if (device.functions && fnIndex >= 0) {
    const functions = device.functions.slice();
    functions[fnIndex] = { ...functions[fnIndex], value, updatedAt: Date.now() };
    return { ...device, functions };
  }
  return {
    ...device,
    attributes: { ...(device.attributes ?? {}), [key]: value },
  };
}

class CommandTrackerImpl {
  private readonly snapshots = new Map<string, OptimisticSnapshot>();

  /** Wendet ein Command optimistisch an und speichert den vorherigen Wert. */
  applyOptimistic(cmd: Command): OptimisticSnapshot | null {
    const store = useDevicesStore.getState();
    const device = store.byId(cmd.deviceId);
    if (!device) return null;
    const previousValue = readValue(device, cmd.key);
    const next = writeValue(device, cmd.key, cmd.value);
    store.upsertDevice({ ...next, updatedAt: Date.now() });
    const snap: OptimisticSnapshot = {
      deviceId: cmd.deviceId,
      key: cmd.key,
      previousValue,
    };
    this.snapshots.set(cmd.id, snap);
    return snap;
  }

  /** Bestätigt und verwirft den Snapshot. */
  confirm(commandId: string): void {
    this.snapshots.delete(commandId);
  }

  /** Rollt einen fehlgeschlagenen Command zurück. */
  rollback(commandId: string): void {
    const snap = this.snapshots.get(commandId);
    if (!snap) return;
    const store = useDevicesStore.getState();
    const device = store.byId(snap.deviceId);
    if (device) {
      const restored = writeValue(device, snap.key, snap.previousValue);
      store.upsertDevice({ ...restored, updatedAt: Date.now() });
    }
    this.snapshots.delete(commandId);
  }

  clear(): void {
    this.snapshots.clear();
  }
}

export const commandTracker = new CommandTrackerImpl();
