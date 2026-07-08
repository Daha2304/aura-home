import { create } from "zustand";
import type { SceneTemplate } from "@/models/sceneTemplate";

interface SceneTemplatesState {
  templates: SceneTemplate[];
  byId: Record<string, SceneTemplate>;
  setTemplates: (t: SceneTemplate[]) => void;
  upsert: (t: SceneTemplate) => void;
  remove: (id: string) => void;
}

function indexBy(list: SceneTemplate[]): Record<string, SceneTemplate> {
  const out: Record<string, SceneTemplate> = {};
  for (const t of list) out[t.id] = t;
  return out;
}

export const useSceneTemplatesStore = create<SceneTemplatesState>((set, get) => ({
  templates: [],
  byId: {},
  setTemplates: (templates) => set({ templates, byId: indexBy(templates) }),
  upsert: (t) => {
    const list = get().templates;
    const idx = list.findIndex((x) => x.id === t.id);
    const next = idx === -1 ? [...list, t] : list.map((x) => (x.id === t.id ? t : x));
    set({ templates: next, byId: indexBy(next) });
  },
  remove: (id) => {
    const next = get().templates.filter((t) => t.id !== id);
    set({ templates: next, byId: indexBy(next) });
  },
}));
