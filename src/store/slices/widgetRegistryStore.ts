import { create } from "zustand";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import type { WidgetDescriptor } from "@/models/widgetDescriptor";
import type { WidgetCategory } from "@/models/widgetCategory";
import type { WidgetTypeId } from "@/models/widgetInstance";

interface WidgetRegistryState {
  descriptors: WidgetDescriptor[];
  byId: Record<WidgetTypeId, WidgetDescriptor>;
  byCategory: Partial<Record<WidgetCategory, WidgetDescriptor[]>>;
  refresh: () => void;
}

function snapshot(): Pick<WidgetRegistryState, "descriptors" | "byId" | "byCategory"> {
  const list = widgetRegistry.all();
  const byId: Record<WidgetTypeId, WidgetDescriptor> = {};
  const byCategory: Partial<Record<WidgetCategory, WidgetDescriptor[]>> = {};
  for (const d of list) {
    byId[d.id] = d;
    (byCategory[d.category] ||= []).push(d);
  }
  return { descriptors: list, byId, byCategory };
}

export const useWidgetRegistryStore = create<WidgetRegistryState>((set) => ({
  ...snapshot(),
  refresh: () => set(snapshot()),
}));

// Registry-Änderungen automatisch in den Store spiegeln.
widgetRegistry.on("changed", () => useWidgetRegistryStore.getState().refresh());
