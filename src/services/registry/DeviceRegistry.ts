import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { TypedEmitter } from "@/services/events/EventEmitter";
import { createLogger } from "@/services/logger/Logger";
import type { CapabilityFlag } from "@/models/deviceCapability";
import type { DeviceCategory } from "@/models/deviceCategory";
import type { DeviceTypeId } from "@/models/deviceType";
import type { DeviceTypeDescriptor } from "./DeviceTypeDescriptor";

const log = createLogger("registry");

interface RegistryEventMap {
  registered: { id: DeviceTypeId };
  unregistered: { id: DeviceTypeId };
  changed: void;
}

/**
 * Zentrale, plugin-fähige Device-Registry. Alle Gerätetypen — sowohl
 * Built-ins als auch später hinzugekommene Plugins — leben ausschließlich
 * hier. UI-Komponenten dürfen keinerlei if/else-Ketten über den Gerätetyp
 * enthalten, sondern immer über die Registry auflösen.
 */
export class DeviceRegistry extends TypedEmitter<RegistryEventMap> {
  private readonly descriptors = new Map<DeviceTypeId, DeviceTypeDescriptor>();
  private readonly byCat = new Map<DeviceCategory, Set<DeviceTypeId>>();

  register(desc: DeviceTypeDescriptor): void {
    if (!desc.id) {
      errorBus.report(
        new AppError("invalid_message", "Registry: Descriptor ohne id", {
          code: "invalid_descriptor",
          context: { desc },
        }),
      );
      return;
    }
    if (this.descriptors.has(desc.id)) {
      errorBus.report(
        new AppError("invalid_message", `Doppelte Registrierung: ${desc.id}`, {
          code: "duplicate_device_type",
          context: { id: desc.id },
        }),
      );
      return;
    }
    this.descriptors.set(desc.id, desc);
    let bucket = this.byCat.get(desc.category);
    if (!bucket) {
      bucket = new Set();
      this.byCat.set(desc.category, bucket);
    }
    bucket.add(desc.id);
    log.debug("registered", desc.id);
    this.emit("registered", { id: desc.id });
    this.emit("changed", undefined);
  }

  unregister(id: DeviceTypeId): boolean {
    const desc = this.descriptors.get(id);
    if (!desc) return false;
    this.descriptors.delete(id);
    this.byCat.get(desc.category)?.delete(id);
    this.emit("unregistered", { id });
    this.emit("changed", undefined);
    return true;
  }

  get(id: DeviceTypeId): DeviceTypeDescriptor | undefined {
    return this.descriptors.get(id);
  }

  has(id: DeviceTypeId): boolean {
    return this.descriptors.has(id);
  }

  all(): DeviceTypeDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  ids(): DeviceTypeId[] {
    return Array.from(this.descriptors.keys());
  }

  byCategory(category: DeviceCategory): DeviceTypeDescriptor[] {
    const ids = this.byCat.get(category);
    if (!ids) return [];
    const out: DeviceTypeDescriptor[] = [];
    for (const id of ids) {
      const d = this.descriptors.get(id);
      if (d) out.push(d);
    }
    return out;
  }

  getCapabilities(id: DeviceTypeId): CapabilityFlag[] {
    return this.descriptors.get(id)?.capabilities ?? [];
  }

  hasCapability(id: DeviceTypeId, flag: CapabilityFlag): boolean {
    return this.getCapabilities(id).includes(flag);
  }

  size(): number {
    return this.descriptors.size;
  }
}

/** Singleton — die gesamte App teilt sich exakt eine Registry. */
export const deviceRegistry = new DeviceRegistry();
