import {
  DEFAULT_EVENT_CATEGORY_DESCRIPTORS,
  type EventCategory,
  type EventCategoryDescriptor,
} from "@/models/eventCategory";

/**
 * Leichtgewichtige Descriptor-Tabelle für Event-Kategorien.
 */
class EventCategoryRegistry {
  private readonly map = new Map<EventCategory, EventCategoryDescriptor>(
    Object.entries(DEFAULT_EVENT_CATEGORY_DESCRIPTORS) as [
      EventCategory,
      EventCategoryDescriptor,
    ][],
  );

  register(descriptor: EventCategoryDescriptor): void {
    this.map.set(descriptor.category, descriptor);
  }

  get(category: EventCategory): EventCategoryDescriptor {
    return this.map.get(category) ?? DEFAULT_EVENT_CATEGORY_DESCRIPTORS[category];
  }

  list(): EventCategoryDescriptor[] {
    return Array.from(this.map.values());
  }
}

export const eventCategoryRegistry = new EventCategoryRegistry();
