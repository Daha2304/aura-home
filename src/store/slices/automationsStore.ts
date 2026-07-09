import { create } from "zustand";
import type { Automation, AutomationCategory } from "@/models/automation";

interface AutomationsState {
  automations: Automation[];
  byId: Record<string, Automation>;
  byCategory: Record<string, string[]>;
  recentIds: string[];
  revision: number;

  setAutomations: (a: Automation[]) => void;
  upsert: (a: Automation) => void;
  remove: (id: string) => void;
  reorder: (ids: string[]) => void;
  markRecent: (id: string) => void;

  // Back-compat mit älterem UI-Code:
  upsertAutomation: (a: Automation) => void;
  removeAutomation: (id: string) => void;
  toggle: (id: string) => void;
}

const MAX_RECENT = 20;

function index(list: Automation[]): {
  byId: Record<string, Automation>;
  byCategory: Record<string, string[]>;
} {
  const byId: Record<string, Automation> = {};
  const byCategory: Record<string, string[]> = {};
  for (const a of list) {
    byId[a.id] = a;
    const c = a.category ?? "custom";
    (byCategory[c] ??= []).push(a.id);
  }
  return { byId, byCategory };
}

export const useAutomationsStore = create<AutomationsState>((set, get) => ({
  automations: [],
  byId: {},
  byCategory: {},
  recentIds: [],
  revision: 0,

  setAutomations: (list) => {
    const { byId, byCategory } = index(list);
    set({ automations: list, byId, byCategory, revision: get().revision + 1 });
  },
  upsert: (a) => {
    const list = get().automations;
    const idx = list.findIndex((x) => x.id === a.id);
    const next = idx === -1 ? [...list, a] : list.map((x) => (x.id === a.id ? a : x));
    const { byId, byCategory } = index(next);
    set({ automations: next, byId, byCategory, revision: get().revision + 1 });
  },
  remove: (id) => {
    const next = get().automations.filter((x) => x.id !== id);
    const { byId, byCategory } = index(next);
    set({
      automations: next,
      byId,
      byCategory,
      recentIds: get().recentIds.filter((r) => r !== id),
      revision: get().revision + 1,
    });
  },
  reorder: (ids) => {
    const map = get().byId;
    const next: Automation[] = [];
    ids.forEach((id, i) => {
      const a = map[id];
      if (a) next.push({ ...a, order: i });
    });
    for (const a of get().automations) if (!ids.includes(a.id)) next.push(a);
    const { byId, byCategory } = index(next);
    set({ automations: next, byId, byCategory, revision: get().revision + 1 });
  },
  markRecent: (id) => {
    const rec = [id, ...get().recentIds.filter((r) => r !== id)].slice(0, MAX_RECENT);
    set({ recentIds: rec });
  },

  upsertAutomation: (a) => get().upsert(a),
  removeAutomation: (id) => get().remove(id),
  toggle: (id) => {
    const a = get().byId[id];
    if (!a) return;
    get().upsert({ ...a, enabled: !a.enabled, updatedAt: Date.now() });
  },
}));

export const selectAutomations = (s: AutomationsState) => s.automations;
export const selectAutomationById = (id: string) => (s: AutomationsState) => s.byId[id];
export const selectAutomationsByCategory =
  (c: AutomationCategory) => (s: AutomationsState) =>
    (s.byCategory[c] ?? []).map((id) => s.byId[id]).filter(Boolean) as Automation[];
export const selectFavoriteAutomations = (s: AutomationsState) =>
  s.automations.filter((a) => a.favorite);
