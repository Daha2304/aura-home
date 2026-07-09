import { create } from "zustand";
import type { AutomationVariable } from "@/models/automationVariable";
import { readJson, writeJson } from "@/services/storage/localStorage";

const STORAGE_KEY = "automation.variables.v1";

interface AutomationVariablesState {
  variables: AutomationVariable[];
  byKey: Record<string, AutomationVariable>;
  set: (v: AutomationVariable) => void;
  remove: (id: string) => void;
  setAll: (list: AutomationVariable[]) => void;
  hydrate: () => void;
}

function reindex(list: AutomationVariable[]): Record<string, AutomationVariable> {
  const m: Record<string, AutomationVariable> = {};
  for (const v of list) m[v.key] = v;
  return m;
}

export const useAutomationVariablesStore = create<AutomationVariablesState>((set, get) => ({
  variables: [],
  byKey: {},
  set: (v) => {
    const list = get().variables;
    const idx = list.findIndex((x) => x.id === v.id);
    const next = idx === -1 ? [...list, v] : list.map((x) => (x.id === v.id ? v : x));
    set({ variables: next, byKey: reindex(next) });
    writeJson(STORAGE_KEY, next);
  },
  remove: (id) => {
    const next = get().variables.filter((v) => v.id !== id);
    set({ variables: next, byKey: reindex(next) });
    writeJson(STORAGE_KEY, next);
  },
  setAll: (list) => {
    set({ variables: list, byKey: reindex(list) });
    writeJson(STORAGE_KEY, list);
  },
  hydrate: () => {
    const stored = readJson<AutomationVariable[]>(STORAGE_KEY);
    if (Array.isArray(stored)) {
      set({ variables: stored, byKey: reindex(stored) });
    }
  },
}));
