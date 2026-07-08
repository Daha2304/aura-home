import { create } from "zustand";
import type { SceneVersion } from "@/models/sceneVersion";

interface SceneVersionsState {
  byScene: Record<string, SceneVersion[]>;
  add: (v: SceneVersion, max?: number) => void;
  list: (sceneId: string) => SceneVersion[];
  clear: (sceneId: string) => void;
}

const DEFAULT_MAX = 20;

export const useSceneVersionsStore = create<SceneVersionsState>((set, get) => ({
  byScene: {},
  add: (v, max = DEFAULT_MAX) => {
    const list = get().byScene[v.sceneId] ?? [];
    const next = [v, ...list].slice(0, max);
    set({ byScene: { ...get().byScene, [v.sceneId]: next } });
  },
  list: (sceneId) => get().byScene[sceneId] ?? [],
  clear: (sceneId) => {
    const { [sceneId]: _drop, ...rest } = get().byScene;
    void _drop;
    set({ byScene: rest });
  },
}));
