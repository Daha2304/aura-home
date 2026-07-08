import { create } from "zustand";
import type { Scene } from "@/models/scene";

interface ScenesState {
  scenes: Scene[];
  setScenes: (s: Scene[]) => void;
  upsertScene: (s: Scene) => void;
  removeScene: (id: string) => void;
}

export const useScenesStore = create<ScenesState>((set, get) => ({
  scenes: [],
  setScenes: (scenes) => set({ scenes }),
  upsertScene: (s) => {
    const exists = get().scenes.some((x) => x.id === s.id);
    set({
      scenes: exists
        ? get().scenes.map((x) => (x.id === s.id ? s : x))
        : [...get().scenes, s],
    });
  },
  removeScene: (id) => set({ scenes: get().scenes.filter((s) => s.id !== id) }),
}));
