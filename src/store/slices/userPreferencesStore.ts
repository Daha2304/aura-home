import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { UserPreferences, RecentPageEntry } from "@/models/userPreferences";
import type { FavoriteRef } from "@/models/user";
import type { ID } from "@/models/common";

interface PreferencesState {
  byUserId: Record<ID, UserPreferences>;
  get: (userId: ID) => UserPreferences | undefined;
  ensure: (userId: ID) => UserPreferences;
  update: (userId: ID, patch: Partial<UserPreferences>) => void;
  addFavorite: (userId: ID, ref: FavoriteRef) => void;
  removeFavorite: (
    userId: ID,
    refType: FavoriteRef["refType"],
    refId: ID,
  ) => void;
  pushRecentPage: (userId: ID, entry: RecentPageEntry, max?: number) => void;
  setAll: (map: Record<ID, UserPreferences>) => void;
}

const empty = (userId: ID): UserPreferences => ({
  userId,
  favorites: [],
  recentPages: [],
  units: "metric",
  animations: "full",
  updatedAt: Date.now(),
});

export const useUserPreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      byUserId: {},
      get: (userId) => get().byUserId[userId],
      ensure: (userId) => {
        const existing = get().byUserId[userId];
        if (existing) return existing;
        const p = empty(userId);
        set({ byUserId: { ...get().byUserId, [userId]: p } });
        return p;
      },
      update: (userId, patch) => {
        const cur = get().byUserId[userId] ?? empty(userId);
        const next = { ...cur, ...patch, updatedAt: Date.now() };
        set({ byUserId: { ...get().byUserId, [userId]: next } });
      },
      addFavorite: (userId, ref) => {
        const cur = get().byUserId[userId] ?? empty(userId);
        const favorites = [
          ...cur.favorites.filter(
            (f) => !(f.refType === ref.refType && f.refId === ref.refId),
          ),
          { ...ref, addedAt: ref.addedAt ?? Date.now() },
        ];
        get().update(userId, { favorites });
      },
      removeFavorite: (userId, refType, refId) => {
        const cur = get().byUserId[userId] ?? empty(userId);
        const favorites = cur.favorites.filter(
          (f) => !(f.refType === refType && f.refId === refId),
        );
        get().update(userId, { favorites });
      },
      pushRecentPage: (userId, entry, max = 20) => {
        const cur = get().byUserId[userId] ?? empty(userId);
        const filtered = cur.recentPages.filter((r) => r.ref !== entry.ref);
        const recentPages = [entry, ...filtered].slice(0, max);
        get().update(userId, { recentPages });
      },
      setAll: (map) => set({ byUserId: map }),
    }),
    {
      name: "smarthome.user-preferences",
      storage: persistentStorage(),
      version: 1,
    },
  ),
);

export const selectPreferences = (userId: ID) => (s: PreferencesState) =>
  s.byUserId[userId];
export const selectFavorites = (userId: ID) => (s: PreferencesState) =>
  s.byUserId[userId]?.favorites ?? [];
export const selectRecentPages = (userId: ID) => (s: PreferencesState) =>
  s.byUserId[userId]?.recentPages ?? [];
