import type {
  SearchFavorite,
  SearchHistoryEntry,
  RecentOpen,
} from "@/models/searchHistory";
import type { SearchPreferences } from "@/models/searchPreferences";
import { useSearchFavoritesStore } from "@/store/slices/searchFavoritesStore";
import { useSearchHistoryStore } from "@/store/slices/searchHistoryStore";
import { useSearchPreferencesStore } from "@/store/slices/searchPreferencesStore";

export const SEARCH_SCHEMA_VERSION = 1;

export interface SearchExport {
  schemaVersion: number;
  favorites: SearchFavorite[];
  history: SearchHistoryEntry[];
  opens: RecentOpen[];
  frequency: Record<string, number>;
  preferences: {
    fallback: SearchPreferences;
    byUser: Record<string, SearchPreferences>;
  };
}

export function exportSearch(): SearchExport {
  const fav = useSearchFavoritesStore.getState();
  const hist = useSearchHistoryStore.getState();
  const prefs = useSearchPreferencesStore.getState();
  return {
    schemaVersion: SEARCH_SCHEMA_VERSION,
    favorites: fav.favorites,
    history: hist.entries,
    opens: hist.opens,
    frequency: hist.frequency,
    preferences: { fallback: prefs.fallback, byUser: prefs.byUser },
  };
}

export type SearchImportStrategy = "merge" | "replace";

export function importSearch(
  data: SearchExport,
  strategy: SearchImportStrategy = "merge",
): void {
  if (!data || data.schemaVersion !== SEARCH_SCHEMA_VERSION) {
    throw new Error("Unsupported search export schema");
  }
  if (strategy === "replace") {
    useSearchFavoritesStore.setState({ favorites: data.favorites ?? [] });
    useSearchHistoryStore.setState({
      entries: data.history ?? [],
      opens: data.opens ?? [],
      frequency: data.frequency ?? {},
    });
    useSearchPreferencesStore.setState({
      fallback: data.preferences?.fallback ?? useSearchPreferencesStore.getState().fallback,
      byUser: data.preferences?.byUser ?? {},
    });
    return;
  }
  // Merge
  const favState = useSearchFavoritesStore.getState();
  const existingFav = new Set(favState.favorites.map((f) => f.id));
  useSearchFavoritesStore.setState({
    favorites: [
      ...favState.favorites,
      ...(data.favorites ?? []).filter((f) => !existingFav.has(f.id)),
    ],
  });

  const hist = useSearchHistoryStore.getState();
  const seen = new Set(hist.entries.map((e) => e.id));
  const seenOpen = new Set(hist.opens.map((e) => e.id));
  useSearchHistoryStore.setState({
    entries: [
      ...hist.entries,
      ...(data.history ?? []).filter((e) => !seen.has(e.id)),
    ],
    opens: [
      ...hist.opens,
      ...(data.opens ?? []).filter((e) => !seenOpen.has(e.id)),
    ],
    frequency: { ...hist.frequency, ...(data.frequency ?? {}) },
  });

  const prefs = useSearchPreferencesStore.getState();
  useSearchPreferencesStore.setState({
    fallback: { ...prefs.fallback, ...(data.preferences?.fallback ?? {}) },
    byUser: { ...prefs.byUser, ...(data.preferences?.byUser ?? {}) },
  });
}
