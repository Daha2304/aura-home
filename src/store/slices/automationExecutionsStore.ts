import { create } from "zustand";
import type { AutomationExecution } from "@/models/automationExecution";

interface AutomationExecutionsState {
  active: AutomationExecution[];
  history: AutomationExecution[];
  byId: Record<string, AutomationExecution>;
  upsert: (e: AutomationExecution) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 200;
const TERMINAL: AutomationExecution["status"][] = [
  "succeeded",
  "failed",
  "partial",
  "cancelled",
  "skipped-conditions",
];

export const useAutomationExecutionsStore = create<AutomationExecutionsState>((set, get) => ({
  active: [],
  history: [],
  byId: {},

  upsert: (e) => {
    const active = get().active.slice();
    const history = get().history.slice();
    const byId = { ...get().byId, [e.id]: e };
    const idxA = active.findIndex((x) => x.id === e.id);
    if (TERMINAL.includes(e.status)) {
      if (idxA !== -1) active.splice(idxA, 1);
      const idxH = history.findIndex((x) => x.id === e.id);
      if (idxH !== -1) history[idxH] = e;
      else history.unshift(e);
      if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    } else {
      if (idxA === -1) active.push(e);
      else active[idxA] = e;
    }
    set({ active, history, byId });
  },
  clearHistory: () => set({ history: [] }),
}));

export const selectExecutionsForAutomation =
  (id: string) => (s: AutomationExecutionsState) =>
    [...s.active, ...s.history].filter((e) => e.automationId === id);

export const selectLatestAutomationExecution =
  (id: string) => (s: AutomationExecutionsState) => {
    const running = s.active.find((e) => e.automationId === id);
    if (running) return running;
    return s.history.find((e) => e.automationId === id);
  };
