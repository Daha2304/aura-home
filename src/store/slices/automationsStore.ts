import { create } from "zustand";
import type { Automation } from "@/models/automation";

interface AutomationsState {
  automations: Automation[];
  setAutomations: (a: Automation[]) => void;
  upsertAutomation: (a: Automation) => void;
  removeAutomation: (id: string) => void;
  toggle: (id: string) => void;
}

export const useAutomationsStore = create<AutomationsState>((set, get) => ({
  automations: [],
  setAutomations: (automations) => set({ automations }),
  upsertAutomation: (a) => {
    const exists = get().automations.some((x) => x.id === a.id);
    set({
      automations: exists
        ? get().automations.map((x) => (x.id === a.id ? a : x))
        : [...get().automations, a],
    });
  },
  removeAutomation: (id) =>
    set({ automations: get().automations.filter((a) => a.id !== id) }),
  toggle: (id) =>
    set({
      automations: get().automations.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a,
      ),
    }),
}));
