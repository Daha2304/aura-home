import type {
  TimelineEntry,
  TimelineSourceDescriptor,
} from "@/models/timeline";
import { TypedEmitter } from "@/services/events/EventEmitter";

interface RegistryEvents {
  registered: { descriptor: TimelineSourceDescriptor };
  unregistered: { id: string };
  changed: void;
}

/**
 * Einzige Registrierungsstelle für Timeline-Quellen. Die Timeline-Engine
 * enthält keine quellenspezifischen Switch/If-Konstruktionen; neue
 * Quellen (Notifications, User, …) benötigen ausschließlich einen
 * weiteren Descriptor.
 */
class TimelineSourceRegistry {
  private readonly descriptors = new Map<string, TimelineSourceDescriptor>();
  readonly events = new TypedEmitter<RegistryEvents>();

  register(descriptor: TimelineSourceDescriptor): () => void {
    this.descriptors.set(descriptor.id, descriptor);
    this.events.emit("registered", { descriptor });
    this.events.emit("changed", undefined);
    return () => this.unregister(descriptor.id);
  }

  unregister(id: string): void {
    if (!this.descriptors.delete(id)) return;
    this.events.emit("unregistered", { id });
    this.events.emit("changed", undefined);
  }

  get(id: string): TimelineSourceDescriptor | undefined {
    return this.descriptors.get(id);
  }

  list(): TimelineSourceDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  /** Snapshots über alle registrierten Quellen. */
  snapshot(): TimelineEntry[] {
    const out: TimelineEntry[] = [];
    for (const d of this.descriptors.values()) {
      if (d.enabled === false) continue;
      const items = d.list?.();
      if (items && items.length) out.push(...items);
    }
    return out;
  }
}

export const timelineSourceRegistry = new TimelineSourceRegistry();
export type { TimelineSourceDescriptor };
