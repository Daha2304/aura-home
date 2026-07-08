import { create } from "zustand";
import type { Command } from "@/models/command";

interface CommandsState {
  active: Command[];
  history: Command[];
  upsert: (c: Command) => void;
  remove: (id: string) => void;
  clearHistory: () => void;
  byDevice: (deviceId: string) => Command[];
}

const MAX_HISTORY = 300;

const TERMINAL: Command["state"][] = ["completed", "failed", "cancelled"];

export const useCommandsStore = create<CommandsState>((set, get) => ({
  active: [],
  history: [],

  upsert: (c) => {
    const active = get().active.slice();
    const history = get().history.slice();
    const isTerminal = TERMINAL.includes(c.state);

    const idxActive = active.findIndex((x) => x.id === c.id);
    if (isTerminal) {
      if (idxActive !== -1) active.splice(idxActive, 1);
      const idxHist = history.findIndex((x) => x.id === c.id);
      if (idxHist !== -1) history[idxHist] = c;
      else history.unshift(c);
      if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    } else {
      if (idxActive === -1) active.push(c);
      else active[idxActive] = c;
    }
    set({ active, history });
  },

  remove: (id) =>
    set((s) => ({
      active: s.active.filter((c) => c.id !== id),
      history: s.history.filter((c) => c.id !== id),
    })),
  clearHistory: () => set({ history: [] }),
  byDevice: (deviceId) =>
    [...get().active, ...get().history].filter((c) => c.deviceId === deviceId),
}));
