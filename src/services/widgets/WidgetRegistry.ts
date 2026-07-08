import { TypedEmitter } from "@/services/events/EventEmitter";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createLogger } from "@/services/logger/Logger";
import type { WidgetDescriptor } from "@/models/widgetDescriptor";
import type { WidgetCategory } from "@/models/widgetCategory";
import type { WidgetTypeId } from "@/models/widgetInstance";

const log = createLogger("widget-registry");

interface WidgetRegistryEvents {
  registered: { id: WidgetTypeId };
  unregistered: { id: WidgetTypeId };
  changed: void;
}

/**
 * Zentrale Widget-Registry. Plugin-fähig, O(1)-Lookups, keine if/else über
 * Widget-Typen. Widgets registrieren sich ausschließlich hier.
 */
export class WidgetRegistry extends TypedEmitter<WidgetRegistryEvents> {
  private readonly descriptors = new Map<WidgetTypeId, WidgetDescriptor>();
  private readonly byCategory = new Map<WidgetCategory, Set<WidgetTypeId>>();

  register(desc: WidgetDescriptor): void {
    if (!desc.id) {
      errorBus.report(
        new AppError("invalid_message", "WidgetRegistry: Descriptor ohne id", {
          code: "invalid_widget_descriptor",
        }),
      );
      return;
    }
    const existing = this.descriptors.get(desc.id);
    if (existing) {
      if (existing.version >= desc.version) {
        errorBus.report(
          new AppError("invalid_message", `Widget ${desc.id}: ältere Version ignoriert`, {
            code: "widget_version_conflict",
            context: { id: desc.id, existing: existing.version, incoming: desc.version },
          }),
        );
        return;
      }
      // neuere Version ersetzt die alte
      this.byCategory.get(existing.category)?.delete(existing.id);
    }
    this.descriptors.set(desc.id, desc);
    let bucket = this.byCategory.get(desc.category);
    if (!bucket) {
      bucket = new Set();
      this.byCategory.set(desc.category, bucket);
    }
    bucket.add(desc.id);
    log.debug("registered", desc.id, "v" + desc.version);
    this.emit("registered", { id: desc.id });
    this.emit("changed", undefined);
  }

  unregister(id: WidgetTypeId): boolean {
    const desc = this.descriptors.get(id);
    if (!desc) return false;
    this.descriptors.delete(id);
    this.byCategory.get(desc.category)?.delete(id);
    this.emit("unregistered", { id });
    this.emit("changed", undefined);
    return true;
  }

  get(id: WidgetTypeId): WidgetDescriptor | undefined {
    return this.descriptors.get(id);
  }

  has(id: WidgetTypeId): boolean {
    return this.descriptors.has(id);
  }

  all(): WidgetDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  listByCategory(cat: WidgetCategory): WidgetDescriptor[] {
    const ids = this.byCategory.get(cat);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.descriptors.get(id))
      .filter((d): d is WidgetDescriptor => !!d);
  }

  categories(): WidgetCategory[] {
    return Array.from(this.byCategory.keys());
  }

  versions(): Record<WidgetTypeId, number> {
    const out: Record<WidgetTypeId, number> = {};
    for (const [id, d] of this.descriptors) out[id] = d.version;
    return out;
  }

  clear(): void {
    this.descriptors.clear();
    this.byCategory.clear();
    this.emit("changed", undefined);
  }
}

export const widgetRegistry = new WidgetRegistry();
