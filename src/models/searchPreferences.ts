import type { ID } from "./common";
import type { SearchCategory } from "./search";

export interface SearchPreferences {
  userId?: ID;
  disabledProviders: string[];
  disabledCategories: SearchCategory[];
  pinnedProviders: string[];
  /** Optional per-category weight overrides (0..2). */
  categoryWeights?: Partial<Record<SearchCategory, number>>;
  showRecent: boolean;
  showFavorites: boolean;
  showSuggestions: boolean;
  maxResultsPerProvider: number;
}

export const DEFAULT_SEARCH_PREFERENCES: SearchPreferences = {
  disabledProviders: [],
  disabledCategories: [],
  pinnedProviders: [],
  showRecent: true,
  showFavorites: true,
  showSuggestions: true,
  maxResultsPerProvider: 8,
};
