import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import {
  DEFAULT_SEARCH_PREFERENCES,
  type SearchPreferences,
} from "@/models/searchPreferences";
import type { ID } from "@/models/common";

interface SearchPreferencesState {
  byUser: Record<string, SearchPreferences>;
  fallback: SearchPreferences;

  get: (userId?: ID) => SearchPreferences;
  set: (userId: ID | undefined, patch: Partial<SearchPreferences>) => void;
  reset: (userId?: ID) => void;
}

export const useSearchPreferencesStore = create<SearchPreferencesState>()(
  persist(
    (set, get) => ({
      byUser: {},
      fallback: DEFAULT_SEARCH_PREFERENCES,

      get: (userId) => {
        if (!userId) return get().fallback;
        return get().byUser[userId] ?? get().fallback;
      },
      set: (userId, patch) => {
        if (!userId) {
          set({ fallback: { ...get().fallback, ...patch } });
          return;
        }
        const current = get().byUser[userId] ?? get().fallback;
        set({ byUser: { ...get().byUser, [userId]: { ...current, ...patch } } });
      },
      reset: (userId) => {
        if (!userId) {
          set({ fallback: DEFAULT_SEARCH_PREFERENCES });
          return;
        }
        const next = { ...get().byUser };
        delete next[userId];
        set({ byUser: next });
      },
    }),
    {
      name: "smarthome.search.preferences",
      storage: persistentStorage(),
      version: 1,
    },
  ),
);
