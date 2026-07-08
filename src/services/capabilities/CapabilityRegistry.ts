import type {
  CapabilityCategory,
  CapabilityDescriptor,
} from "@/models/capabilityDescriptor";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("capabilities");

/**
 * Central plugin registry for capability descriptors. Keyed by `kind` for
 * O(1) lookup. New capabilities simply call `register(...)` — the
 * universal control engine picks them up automatically.
 */
class CapabilityRegistryImpl {
  private readonly byKind = new Map<string, CapabilityDescriptor>();
  private readonly byId = new Map<string, CapabilityDescriptor>();

  register(descriptor: CapabilityDescriptor): void {
    const existing = this.byKind.get(descriptor.kind);
    if (existing && existing.version >= descriptor.version) {
      return; // keep newer / equal version
    }
    this.byKind.set(descriptor.kind, descriptor);
    this.byId.set(descriptor.id, descriptor);
    log.debug("registered capability", descriptor.kind, "v" + descriptor.version);
  }

  get(kind: string): CapabilityDescriptor | undefined {
    return this.byKind.get(kind);
  }

  getById(id: string): CapabilityDescriptor | undefined {
    return this.byId.get(id);
  }

  all(): CapabilityDescriptor[] {
    return Array.from(this.byKind.values());
  }

  byCategory(category: CapabilityCategory): CapabilityDescriptor[] {
    return this.all().filter((d) => d.category === category);
  }

  clear(): void {
    this.byKind.clear();
    this.byId.clear();
  }
}

export const capabilityRegistry = new CapabilityRegistryImpl();
