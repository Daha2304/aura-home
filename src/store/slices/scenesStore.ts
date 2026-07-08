import { create } from "zustand";
import type { Scene, SceneCategory } from "@/models/scene";

interface ScenesState {
  scenes: Scene[];
  byId: Record<string, Scene>;
  byCategory: Record<string, string[]>;
  recentIds: string[];
  revision: number;

  setScenes: (scenes: Scene[]) => void;
  upsertScene: (scene: Scene) => void;
  removeScene: (id: string) => void;
  reorder: (ids: string[]) => void;
  markRecent: (id: string) => void;
}

const MAX_RECENT = 12;

function index(scenes: Scene[]): {
  byId: Record<string, Scene>;
  byCategory: Record<string, string[]>;
} {
  const byId: Record<string, Scene> = {};
  const byCategory: Record<string, string[]> = {};
  for (const s of scenes) {
    byId[s.id] = s;
    (byCategory[s.category] ??= []).push(s.id);
  }
  return { byId, byCategory };
}

export const useScenesStore = create<ScenesState>((set, get) => ({
  scenes: [],
  byId: {},
  byCategory: {},
  recentIds: [],
  revision: 0,

  setScenes: (scenes) => {
    const { byId, byCategory } = index(scenes);
    set({ scenes, byId, byCategory, revision: get().revision + 1 });
  },
  upsertScene: (s) => {
    const list = get().scenes;
    const idx = list.findIndex((x) => x.id === s.id);
    const next = idx === -1 ? [...list, s] : list.map((x) => (x.id === s.id ? s : x));
    const { byId, byCategory } = index(next);
    set({ scenes: next, byId, byCategory, revision: get().revision + 1 });
  },
  removeScene: (id) => {
    const next = get().scenes.filter((s) => s.id !== id);
    const { byId, byCategory } = index(next);
    set({
      scenes: next,
      byId,
      byCategory,
      recentIds: get().recentIds.filter((r) => r !== id),
      revision: get().revision + 1,
    });
  },
  reorder: (ids) => {
    const map = get().byId;
    const next: Scene[] = [];
    ids.forEach((id, i) => {
      const s = map[id];
      if (s) next.push({ ...s, order: i });
    });
    for (const s of get().scenes) if (!ids.includes(s.id)) next.push(s);
    const { byId, byCategory } = index(next);
    set({ scenes: next, byId, byCategory, revision: get().revision + 1 });
  },
  markRecent: (id) => {
    const list = [id, ...get().recentIds.filter((r) => r !== id)].slice(0, MAX_RECENT);
    set({ recentIds: list });
  },
}));

// -------- Selectors --------
export const selectScenes = (s: ScenesState) => s.scenes;
export const selectSceneById = (id: string) => (s: ScenesState) => s.byId[id];
export const selectFavoriteScenes = (s: ScenesState) => s.scenes.filter((x) => x.favorite);
export const selectScenesByCategory = (c: SceneCategory) => (s: ScenesState) =>
  (s.byCategory[c] ?? []).map((id) => s.byId[id]).filter(Boolean) as Scene[];
