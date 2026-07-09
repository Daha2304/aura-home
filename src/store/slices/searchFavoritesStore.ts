import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { SearchFavorite } from "@/models/searchHistory";
import type { ID } from "@/models/common";

interface SearchFavoritesState {
  favorites: SearchFavorite[];
  add: (fav: SearchFavorite) => void;
  remove: (id: string) => void;
  toggle: (fav: SearchFavorite) => void;
  isFavorite: (resultId: string, userId?: ID) => boolean;
  clear: (userId?: ID) => void;
}

export const useSearchFavoritesStore = create<SearchFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      add: (fav) => {
        if (get().favorites.some((f) => f.id === fav.id)) return;
        set({ favorites: [fav, ...get().favorites] });
      },
      remove: (id) =>
        set({ favorites: get().favorites.filter((f) => f.id !== id) }),
      toggle: (fav) => {
        const exists = get().favorites.find((f) => f.id === fav.id);
        if (exists) get().remove(fav.id);
        else get().add(fav);
      },
      isFavorite: (resultId, userId) =>
        get().favorites.some(
          (f) =>
            f.resultId === resultId && (!userId || !f.userId || f.userId === userId),
        ),
      clear: (userId) =>
        set({
          favorites: userId
            ? get().favorites.filter((f) => f.userId !== userId)
            : [],
        }),
    }),
    {
      name: "smarthome.search.favorites",
      storage: persistentStorage(),
      version: 1,
    },
  ),
);

export const selectFavoritesOfUser =
  (userId?: ID) => (s: SearchFavoritesState) =>
    userId
      ? s.favorites.filter((f) => !f.userId || f.userId === userId)
      : s.favorites;
