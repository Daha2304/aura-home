/**
 * Feature Flags — rein lokal, keine Cloud, keine Remote Config.
 * Boolean + string + number Werte. Erweiterbar über register().
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "@/store/slices/_persistStorage";

export type FlagValue = boolean | string | number;

export interface FeatureFlagDescriptor {
  key: string;
  label: string;
  description?: string;
  defaultValue: FlagValue;
  category?: "ui" | "dev" | "perf" | "experimental";
}

const descriptors = new Map<string, FeatureFlagDescriptor>();

export function registerFlag(d: FeatureFlagDescriptor): void {
  descriptors.set(d.key, d);
}

export function listFlags(): FeatureFlagDescriptor[] {
  return Array.from(descriptors.values());
}

interface FlagsState {
  values: Record<string, FlagValue>;
  set: (key: string, value: FlagValue) => void;
  reset: (key: string) => void;
  resetAll: () => void;
}

export const useFlagsStore = create<FlagsState>()(
  persist(
    (set) => ({
      values: {},
      set: (key, value) => set((s) => ({ values: { ...s.values, [key]: value } })),
      reset: (key) =>
        set((s) => {
          const next = { ...s.values };
          delete next[key];
          return { values: next };
        }),
      resetAll: () => set({ values: {} }),
    }),
    { name: "smarthome.flags", storage: persistentStorage() },
  ),
);

export const flags = {
  get<T extends FlagValue = FlagValue>(key: string, fallback?: T): T {
    const stored = useFlagsStore.getState().values[key];
    if (stored !== undefined) return stored as T;
    const desc = descriptors.get(key);
    if (desc) return desc.defaultValue as T;
    return fallback as T;
  },
  set(key: string, value: FlagValue): void {
    useFlagsStore.getState().set(key, value);
  },
  list(): FeatureFlagDescriptor[] {
    return listFlags();
  },
};

// Built-in flags.
registerFlag({
  key: "ui.virtualization",
  label: "Listen-Virtualisierung",
  description: "Aktiviert virtuelles Scrollen für lange Listen.",
  defaultValue: true,
  category: "perf",
});
registerFlag({
  key: "dev.showDiagnosticsWidget",
  label: "Diagnose-Widget",
  description: "Zeigt das Diagnose-Widget im Dashboard.",
  defaultValue: false,
  category: "dev",
});
registerFlag({
  key: "dev.showPerformanceWidget",
  label: "Performance-Widget",
  description: "Zeigt FPS/Render-Marker als Widget.",
  defaultValue: false,
  category: "dev",
});
