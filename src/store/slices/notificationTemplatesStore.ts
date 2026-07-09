import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NotificationTemplate } from "@/models/notificationTemplate";

interface State {
  templates: NotificationTemplate[];
  add: (t: NotificationTemplate) => void;
  update: (id: string, patch: Partial<NotificationTemplate>) => void;
  remove: (id: string) => void;
  replaceAll: (templates: NotificationTemplate[]) => void;
  get: (id: string) => NotificationTemplate | undefined;
}

export const useNotificationTemplatesStore = create<State>()(
  persist(
    (set, get) => ({
      templates: [],
      add: (t) => set((s) => ({ templates: [...s.templates, t] })),
      update: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),
      remove: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
      replaceAll: (templates) => set({ templates }),
      get: (id) => get().templates.find((t) => t.id === id),
    }),
    {
      name: "notification-templates",
      storage: createJSONStorage(() =>
        
          ? (({
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            } as unknown) as Storage)
          : window.localStorage,
      ),
    },
  ),
);
