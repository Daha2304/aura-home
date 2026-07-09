import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NotificationRule } from "@/models/notificationRule";

interface State {
  rules: NotificationRule[];
  add: (r: NotificationRule) => void;
  update: (id: string, patch: Partial<NotificationRule>) => void;
  remove: (id: string) => void;
  replaceAll: (rules: NotificationRule[]) => void;
}

export const useNotificationRulesStore = create<State>()(
  persist(
    (set) => ({
      rules: [],
      add: (r) => set((s) => ({ rules: [...s.rules, r] })),
      update: (id, patch) =>
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r,
          ),
        })),
      remove: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      replaceAll: (rules) => set({ rules }),
    }),
    {
      name: "notification-rules",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? ({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as Storage)
          : window.localStorage,
      ),
    },
  ),
);
