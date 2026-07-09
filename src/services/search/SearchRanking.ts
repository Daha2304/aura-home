import type { SearchResult, SearchScore } from "@/models/search";
import type { SearchPreferences } from "@/models/searchPreferences";

interface RankInputs {
  favorites: Set<string>;
  frequency: Map<string, number>;
  recency: Map<string, number>;
  now: number;
  preferences: SearchPreferences;
  providerWeight: (providerId: string) => number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pure ranking function. Higher `total` = higher position. */
export function scoreResult(
  result: SearchResult,
  inputs: RankInputs,
): SearchScore {
  const relevance = result.relevance ?? 0.5;
  const favorite = inputs.favorites.has(result.id) ? 1 : 0;
  const recentAt = inputs.recency.get(result.id) ?? 0;
  const ageDays = recentAt > 0 ? (inputs.now - recentAt) / DAY_MS : Infinity;
  const recency = recentAt > 0 ? Math.max(0, 1 - ageDays / 30) : 0;
  const freq = inputs.frequency.get(result.id) ?? 0;
  const frequency = freq > 0 ? Math.min(1, Math.log10(1 + freq) / 2) : 0;
  const priority = (result.priority ?? 0) / 10;

  const categoryWeight =
    inputs.preferences.categoryWeights?.[result.category] ?? 1;
  const providerWeight = inputs.providerWeight(result.providerId);

  const total =
    (relevance * 3 +
      favorite * 2 +
      recency * 1.5 +
      frequency * 1 +
      priority * 0.5) *
    categoryWeight *
    providerWeight;

  return { relevance, favorite, recency, frequency, priority, total };
}
