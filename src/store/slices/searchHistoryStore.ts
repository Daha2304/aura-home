import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { RecentOpen, SearchHistoryEntry } from "@/models/searchHistory";
import type { ID } from "@/models/common";

interface SearchHistoryState {
  entries: SearchHistoryEntry[];
  opens: RecentOpen[];
  /** Aggregate open frequency per resultId. */
  frequency: Record<string, number>;

  pushQuery: (e: SearchHistoryEntry) => void;
  pushOpen: (e: RecentOpen) => void;
  clearQueries: (userId?: ID) => void;
  clearOpens: (userId?: ID) => void;
  clearAll: () => void;
}

const MAX_HISTORY = 100;
const MAX_OPENS = 200;

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      opens: [],
      frequency: {},

      pushQuery: (e) => {
        const q = e.query.trim();
        if (!q) return;
        const filtered = get().entries.filter(
          (x) => !(x.query === q && x.userId === e.userId),
        );
        const entries = [e, ...filtered].slice(0, MAX_HISTORY);
        set({ entries });
      },
      pushOpen: (e) => {
        const opens = [e, ...get().opens.filter((x) => x.id !== e.id)].slice(
          0,
          MAX_OPENS,
        );
        const frequency = {
          ...get().frequency,
          [e.resultId]: (get().frequency[e.resultId] ?? 0) + 1,
        };
        set({ opens, frequency });
      },
      clearQueries: (userId) =>
        set({
          entries: userId
            ? get().entries.filter((e) => e.userId !== userId)
            : [],
        }),
      clearOpens: (userId) =>
        set({
          opens: userId ? get().opens.filter((e) => e.userId !== userId) : [],
          frequency: userId ? get().frequency : {},
        }),
      clearAll: () => set({ entries: [], opens: [], frequency: {} }),
    }),
    {
      name: "smarthome.search.history",
      storage: persistentStorage(),
      version: 1,
    },
  ),
);

export const selectRecentQueries = (userId?: ID) => (s: SearchHistoryState) =>
  userId ? s.entries.filter((e) => !e.userId || e.userId === userId) : s.entries;

export const selectRecentOpens = (userId?: ID) => (s: SearchHistoryState) =>
  userId ? s.opens.filter((e) => !e.userId || e.userId === userId) : s.opens;
