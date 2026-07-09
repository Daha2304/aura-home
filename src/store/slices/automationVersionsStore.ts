import { create } from "zustand";
import type { AutomationVersion } from "@/models/automationVersion";

interface AutomationVersionsState {
  byAutomation: Record<string, AutomationVersion[]>;
  add: (v: AutomationVersion, max: number) => void;
  list: (automationId: string) => AutomationVersion[];
  clear: (automationId: string) => void;
  setAll: (map: Record<string, AutomationVersion[]>) => void;
}

export const useAutomationVersionsStore = create<AutomationVersionsState>((set, get) => ({
  byAutomation: {},
  add: (v, max) => {
    const list = get().byAutomation[v.automationId] ?? [];
    const next = [v, ...list.filter((x) => x.versionNumber !== v.versionNumber)].slice(0, max);
    set({ byAutomation: { ...get().byAutomation, [v.automationId]: next } });
  },
  list: (id) => get().byAutomation[id] ?? [],
  clear: (id) => {
    const cp = { ...get().byAutomation };
    delete cp[id];
    set({ byAutomation: cp });
  },
  setAll: (map) => set({ byAutomation: map }),
}));
