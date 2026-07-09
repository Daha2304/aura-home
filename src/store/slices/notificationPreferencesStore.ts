import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/models/notificationPreferences";

interface State {
  preferences: NotificationPreferences;
  set: (patch: Partial<NotificationPreferences>) => void;
  reset: () => void;
}

export const useNotificationPreferencesStore = create<State>()(
  persist(
    (set) => ({
      preferences: DEFAULT_NOTIFICATION_PREFERENCES,
      set: (patch) =>
        set((s) => ({ preferences: { ...s.preferences, ...patch } })),
      reset: () => set({ preferences: DEFAULT_NOTIFICATION_PREFERENCES }),
    }),
    {
      name: "notification-preferences",
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
