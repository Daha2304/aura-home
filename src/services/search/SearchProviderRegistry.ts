import type { SearchProviderDescriptor } from "@/models/searchProvider";
import type { SearchCategory } from "@/models/search";
import { TypedEmitter } from "@/services/events/EventEmitter";

interface RegistryEvents {
  registered: { descriptor: SearchProviderDescriptor };
  unregistered: { id: string };
  invalidated: { id?: string };
  changed: void;
}

/**
 * Single registration point for all search sources. The SearchManager
 * contains no provider-specific Switch/If — new sources ausschließlich
 * über register(descriptor).
 */
class SearchProviderRegistryImpl {
  private readonly providers = new Map<string, SearchProviderDescriptor>();
  readonly events = new TypedEmitter<RegistryEvents>();

  register(descriptor: SearchProviderDescriptor): () => void {
    this.providers.set(descriptor.id, descriptor);
    this.events.emit("registered", { descriptor });
    this.events.emit("changed", undefined);
    return () => this.unregister(descriptor.id);
  }

  unregister(id: string): void {
    if (!this.providers.delete(id)) return;
    this.events.emit("unregistered", { id });
    this.events.emit("changed", undefined);
  }

  get(id: string): SearchProviderDescriptor | undefined {
    return this.providers.get(id);
  }

  list(): SearchProviderDescriptor[] {
    return Array.from(this.providers.values()).sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }

  listByCategory(category: SearchCategory): SearchProviderDescriptor[] {
    return this.list().filter((p) => p.category === category);
  }

  invalidate(id?: string): void {
    if (id) {
      this.providers.get(id)?.invalidate?.();
    } else {
      for (const p of this.providers.values()) p.invalidate?.();
    }
    this.events.emit("invalidated", { id });
  }
}

export const searchProviderRegistry = new SearchProviderRegistryImpl();
export type { SearchProviderDescriptor };
