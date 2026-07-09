import { create } from "zustand";
import type { AutomationTemplate } from "@/models/automationTemplate";
import type { AutomationCategory } from "@/models/automation";

interface AutomationTemplatesState {
  templates: AutomationTemplate[];
  byId: Record<string, AutomationTemplate>;
  byCategory: Record<string, string[]>;
  register: (t: AutomationTemplate) => void;
  remove: (id: string) => void;
  setAll: (list: AutomationTemplate[]) => void;
}

function index(list: AutomationTemplate[]): {
  byId: Record<string, AutomationTemplate>;
  byCategory: Record<string, string[]>;
} {
  const byId: Record<string, AutomationTemplate> = {};
  const byCategory: Record<string, string[]> = {};
  for (const t of list) {
    byId[t.id] = t;
    const c = t.category ?? "custom";
    (byCategory[c] ??= []).push(t.id);
  }
  return { byId, byCategory };
}

export const useAutomationTemplatesStore = create<AutomationTemplatesState>((set, get) => ({
  templates: [],
  byId: {},
  byCategory: {},
  register: (t) => {
    const list = get().templates;
    const idx = list.findIndex((x) => x.id === t.id);
    const next = idx === -1 ? [...list, t] : list.map((x) => (x.id === t.id ? t : x));
    const { byId, byCategory } = index(next);
    set({ templates: next, byId, byCategory });
  },
  remove: (id) => {
    const next = get().templates.filter((x) => x.id !== id);
    const { byId, byCategory } = index(next);
    set({ templates: next, byId, byCategory });
  },
  setAll: (list) => {
    const { byId, byCategory } = index(list);
    set({ templates: list, byId, byCategory });
  },
}));

export const selectTemplatesByCategory =
  (c: AutomationCategory) => (s: AutomationTemplatesState) =>
    (s.byCategory[c] ?? []).map((id) => s.byId[id]).filter(Boolean) as AutomationTemplate[];
