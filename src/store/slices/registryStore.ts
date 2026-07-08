import { create } from "zustand";
import type { DeviceTypeId } from "@/models/deviceType";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import type { DeviceTypeDescriptor } from "@/services/registry/DeviceTypeDescriptor";

interface RegistryState {
  descriptors: DeviceTypeDescriptor[];
  index: Map<DeviceTypeId, DeviceTypeDescriptor>;
  refresh: () => void;
  get: (id: DeviceTypeId) => DeviceTypeDescriptor | undefined;
}

function snapshot(): Pick<RegistryState, "descriptors" | "index"> {
  const all = deviceRegistry.all();
  const idx = new Map<DeviceTypeId, DeviceTypeDescriptor>();
  for (const d of all) idx.set(d.id, d);
  return { descriptors: all, index: idx };
}

/**
 * Reaktiver, read-only Store für die Device-Registry. Sobald ein Plugin
 * neue Typen registriert, ruft die Bootstrap-Verdrahtung `refresh()` auf.
 */
export const useRegistryStore = create<RegistryState>((set, get) => ({
  ...snapshot(),
  refresh: () => set(snapshot()),
  get: (id) => get().index.get(id),
}));

// Registry-Änderungen automatisch in den Store spiegeln.
deviceRegistry.on("changed", () => {
  useRegistryStore.getState().refresh();
});
