import type { Device } from "@/models/device";
import type { ID } from "@/models/common";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createLogger } from "@/services/logger/Logger";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { discoveryEvents } from "./DiscoveryEvents";
import { LifecycleMachine } from "./LifecycleMachine";
import { validateIncomingDevice } from "./Validators";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import type { DeviceTypeDescriptor } from "@/services/registry/DeviceTypeDescriptor";

const log = createLogger("sync");

export interface DeltaPatch {
  added?: Device[];
  updated?: Device[];
  removed?: ID[];
}

export interface PartialPatch {
  deviceId: ID;
  patch: Partial<Device>;
  baseVersion?: number;
  serverVersion?: number;
}

/**
 * Wendet Registry-Defaults auf ein rohes Gerät an, ohne benutzerdefinierte
 * Felder zu überschreiben.
 */
function applyRegistryDefaults(device: Device): Device {
  const desc: DeviceTypeDescriptor | undefined = deviceRegistry.get(device.type);
  if (!desc) return device;
  return {
    ...device,
    icon: device.icon ?? desc.icon,
    color: device.color ?? desc.color,
    capabilityFlags: device.capabilityFlags ?? desc.capabilities,
  };
}

/**
 * Merged Server-Daten in eine bestehende lokale Repräsentation und respektiert
 * lokale Overrides (favorite, roomId, tags, groupIds, customProperties).
 */
function mergeWithLocal(next: Device, prev: Device | undefined): Device {
  if (!prev) return next;
  return {
    ...next,
    favorite: prev.favorite ?? next.favorite,
    roomId: prev.roomId ?? next.roomId,
    groupIds: prev.groupIds ?? next.groupIds,
    tags: prev.tags ?? next.tags,
    customProperties: {
      ...(next.customProperties ?? {}),
      ...(prev.customProperties ?? {}),
    },
    version: (prev.version ?? 0) + 1,
    serverVersion: next.serverVersion ?? prev.serverVersion,
  };
}

/** Fügt ein einzelnes Gerät (validiert) in den Store. */
function ingestDevice(raw: Device, kind: "added" | "updated"): Device | null {
  const validation = validateIncomingDevice(raw);
  if (!validation.ok) return null;

  const store = useDevicesStore.getState();
  const prev = store.byId(raw.id);
  const withDefaults = applyRegistryDefaults(raw);
  const merged = mergeWithLocal(withDefaults, prev);
  const withLifecycle: Device = {
    ...merged,
    lifecycle: LifecycleMachine.transition(
      merged.id,
      prev?.lifecycle,
      kind === "added" ? "ready" : "ready",
    ),
    updatedAt: Date.now(),
  };
  store.upsertDevice(withLifecycle);

  if (kind === "added") {
    discoveryEvents.emit("deviceDiscovered", { device: withLifecycle });
    discoveryEvents.emit("deviceInitialized", { deviceId: withLifecycle.id });
    discoveryEvents.emit("deviceReady", { deviceId: withLifecycle.id });
  } else {
    discoveryEvents.emit("deviceUpdated", { device: withLifecycle });
  }
  return withLifecycle;
}

export const DeviceSync = {
  fullSync(devices: Device[], requestId?: string): void {
    discoveryEvents.emit("syncStarted", { kind: "full", requestId });
    discoveryEvents.emit("discoveryStarted", undefined);
    const store = useDevicesStore.getState();
    const seen = new Set<ID>();
    let count = 0;
    for (const raw of devices) {
      const kept = ingestDevice(raw, store.byId(raw.id) ? "updated" : "added");
      if (kept) {
        seen.add(kept.id);
        count += 1;
      }
    }
    // Geräte, die der Server nicht mehr liefert, werden entfernt.
    for (const existing of store.devices) {
      if (!seen.has(existing.id)) {
        store.removeDevice(existing.id);
        discoveryEvents.emit("deviceRemoved", { deviceId: existing.id });
      }
    }
    discoveryEvents.emit("discoveryFinished", { count });
    discoveryEvents.emit("syncFinished", { kind: "full", count });
    log.info("full sync", count, "devices");
  },

  deltaSync(patch: DeltaPatch, requestId?: string): void {
    discoveryEvents.emit("syncStarted", { kind: "delta", requestId });
    let count = 0;
    for (const d of patch.added ?? []) {
      if (ingestDevice(d, "added")) count += 1;
    }
    for (const d of patch.updated ?? []) {
      if (ingestDevice(d, "updated")) count += 1;
    }
    for (const id of patch.removed ?? []) {
      const store = useDevicesStore.getState();
      if (store.byId(id)) {
        store.removeDevice(id);
        discoveryEvents.emit("deviceRemoved", { deviceId: id });
        count += 1;
      }
    }
    discoveryEvents.emit("syncFinished", { kind: "delta", count });
  },

  partialUpdate({ deviceId, patch, baseVersion, serverVersion }: PartialPatch): void {
    const store = useDevicesStore.getState();
    const prev = store.byId(deviceId);
    if (!prev) {
      errorBus.report(
        new AppError("invalid_message", "Partial-Update für unbekanntes Gerät", {
          code: "unknown_device",
          context: { deviceId },
        }),
      );
      return;
    }
    if (
      typeof baseVersion === "number" &&
      typeof prev.version === "number" &&
      baseVersion < prev.version
    ) {
      const overlap = Object.keys(patch).some((k) => k in prev);
      if (overlap) {
        errorBus.report(
          new AppError("invalid_message", "Konflikt bei Partial-Update", {
            code: "sync_conflict",
            context: {
              deviceId,
              baseVersion,
              currentVersion: prev.version,
              fields: Object.keys(patch),
            },
          }),
        );
        return;
      }
    }
    const next: Device = {
      ...prev,
      ...patch,
      version: (prev.version ?? 0) + 1,
      serverVersion: serverVersion ?? prev.serverVersion,
      updatedAt: Date.now(),
    };
    store.upsertDevice(next);
    discoveryEvents.emit("deviceUpdated", { device: next });
  },
};
