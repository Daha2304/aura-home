import { create } from "zustand";
import type { SceneExecution } from "@/models/sceneExecution";

interface SceneExecutionsState {
  active: SceneExecution[];
  history: SceneExecution[];
  byId: Record<string, SceneExecution>;
  upsert: (e: SceneExecution) => void;
  clearHistory: () => void;
}

const MAX_HISTORY = 100;

const TERMINAL: SceneExecution["status"][] = ["succeeded", "failed", "partial", "cancelled"];

export const useSceneExecutionsStore = create<SceneExecutionsState>((set, get) => ({
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

export const selectExecutionsForScene =
  (sceneId: string) => (s: SceneExecutionsState) =>
    [...s.active, ...s.history].filter((e) => e.sceneId === sceneId);

export const selectLatestExecution =
  (sceneId: string) => (s: SceneExecutionsState) => {
    const running = s.active.find((e) => e.sceneId === sceneId);
    if (running) return running;
    return s.history.find((e) => e.sceneId === sceneId);
  };
