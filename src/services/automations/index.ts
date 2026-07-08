/**
 * Preparation for Part 9 (Automations). Only descriptor types and empty
 * registries — no execution logic and no routes. Downstream code can
 * safely import these registries today; registration will follow.
 */

export interface TriggerDescriptor {
  id: string;
  label: string;
  version: number;
  description?: string;
  /** Optional JSON schema key (resolved later). */
  schema?: string;
}

export interface ConditionDescriptor {
  id: string;
  label: string;
  version: number;
  description?: string;
  schema?: string;
}

export interface ActionDescriptor {
  id: string;
  label: string;
  version: number;
  description?: string;
  schema?: string;
}

class DescriptorRegistry<T extends { id: string; version: number }> {
  private readonly byId = new Map<string, T>();
  register(descriptor: T): void {
    const existing = this.byId.get(descriptor.id);
    if (existing && existing.version >= descriptor.version) return;
    this.byId.set(descriptor.id, descriptor);
  }
  get(id: string): T | undefined {
    return this.byId.get(id);
  }
  all(): T[] {
    return Array.from(this.byId.values());
  }
  unregister(id: string): boolean {
    return this.byId.delete(id);
  }
}

export const triggerRegistry = new DescriptorRegistry<TriggerDescriptor>();
export const conditionRegistry = new DescriptorRegistry<ConditionDescriptor>();
export const actionRegistry = new DescriptorRegistry<ActionDescriptor>();
