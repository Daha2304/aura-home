import { create } from "zustand";
import type { SearchCategory, SearchResult } from "@/models/search";

interface SearchState {
  paletteOpen: boolean;
  query: string;
  activeCategory: SearchCategory | "all";
  results: SearchResult[];
  loading: boolean;

  openPalette: (initialQuery?: string) => void;
  closePalette: () => void;
  togglePalette: () => void;
  setQuery: (q: string) => void;
  setActiveCategory: (c: SearchCategory | "all") => void;
  setResults: (r: SearchResult[]) => void;
  setLoading: (l: boolean) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  paletteOpen: false,
  query: "",
  activeCategory: "all",
  results: [],
  loading: false,

  openPalette: (initialQuery) =>
    set({ paletteOpen: true, query: initialQuery ?? get().query }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () => set({ paletteOpen: !get().paletteOpen }),
  setQuery: (query) => set({ query }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ loading }),
}));
