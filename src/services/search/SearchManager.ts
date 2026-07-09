import type {
  SearchCategory,
  SearchContext,
  SearchResult,
} from "@/models/search";
import { searchProviderRegistry } from "./SearchProviderRegistry";
import { searchIndex } from "./SearchIndex";
import { searchCache } from "./SearchCache";
import { scoreResult } from "./SearchRanking";
import { useSearchHistoryStore } from "@/store/slices/searchHistoryStore";
import { useSearchFavoritesStore } from "@/store/slices/searchFavoritesStore";
import { useSearchPreferencesStore } from "@/store/slices/searchPreferencesStore";
import { useUsersStore } from "@/store/slices/usersStore";
import { can } from "@/services/users/PermissionRegistry";
import { resolveRolesForUser } from "@/services/users/resolveRoles";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("search");

/**
 * Central search orchestrator. Fan-out to all enabled providers, filter
 * via PermissionEvaluator, rank via SearchRanking, cache normalized queries.
 * The manager contains no provider-specific Switch/If.
 */
class SearchManagerImpl {
  private currentToken = 0;

  async search(
    query: string,
    opts: {
      category?: SearchCategory | "all";
      limit?: number;
      flags?: Record<string, unknown>;
      navigate?: (to: string) => void;
    } = {},
  ): Promise<SearchResult[]> {
    const trimmed = query.trim();
    const token = ++this.currentToken;

    const users = useUsersStore.getState();
    const user = users.currentUserId ? users.byId[users.currentUserId] : undefined;
    const preferences = useSearchPreferencesStore.getState().get(user?.id);

    const cacheKey = `${trimmed}\x1e${opts.category ?? "all"}\x1e${user?.id ?? ""}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    const ctx: SearchContext = {
      query: trimmed,
      userId: user?.id,
      timestamp: Date.now(),
      flags: opts.flags,
      navigate: opts.navigate,
    };

    const providers = searchProviderRegistry.list().filter((p) => {
      if (p.enabled === false) return false;
      if (preferences.disabledProviders.includes(p.id)) return false;
      if (preferences.disabledCategories.includes(p.category)) return false;
      if (opts.category && opts.category !== "all" && p.category !== opts.category)
        return false;
      return true;
    });

    // Fan-out in parallel. A single failing provider must not break the query.
    const perProviderCap = preferences.maxResultsPerProvider;
    const settled = await Promise.allSettled(
      providers.map(async (p) => {
        try {
          let results: SearchResult[];
          if (p.search) {
            results = await Promise.resolve(p.search(ctx));
          } else if (p.index) {
            searchIndex.bulkReplace(p.id, p.index());
            results = trimmed
              ? searchIndex
                  .search(trimmed, 200)
                  .filter((r) => r.providerId === p.id)
              : p.index();
          } else {
            results = [];
          }
          return results.slice(0, perProviderCap);
        } catch (err) {
          log.warn("provider failed", p.id, err);
          return [];
        }
      }),
    );

    if (token !== this.currentToken) {
      // Stale query — a newer call is in-flight.
      return [];
    }

    // Flatten and dedupe on id (later providers do not overwrite).
    const merged = new Map<string, SearchResult>();
    for (const s of settled) {
      if (s.status !== "fulfilled") continue;
      for (const r of s.value) {
        if (!merged.has(r.id)) merged.set(r.id, r);
      }
    }

    // Permission-Filter (UI-informative).
    const roles = resolveRolesForUser(user);
    const permitted: SearchResult[] = [];
    for (const r of merged.values()) {
      if (!r.permission) {
        permitted.push(r);
        continue;
      }
      const ok = can(
        user,
        roles,
        r.permission.action ?? "read",
        r.permission.resource,
        r.permission.refId,
      );
      if (ok) permitted.push(r);
    }

    // Ranking.
    const favEntries = useSearchFavoritesStore.getState().favorites;
    const favorites = new Set(favEntries.map((f) => f.resultId));
    const history = useSearchHistoryStore.getState();
    const frequency = new Map(Object.entries(history.frequency));
    const recency = new Map(history.opens.map((o) => [o.resultId, o.at]));

    const providerWeights = new Map(
      searchProviderRegistry.list().map((p) => [p.id, p.weight ?? 1]),
    );
    const now = Date.now();

    const ranked = permitted
      .map((r) => {
        const score = scoreResult(r, {
          favorites,
          frequency,
          recency,
          now,
          preferences,
          providerWeight: (id) => providerWeights.get(id) ?? 1,
        });
        return {
          ...r,
          favorite: favorites.has(r.id),
          recentlyUsed: recency.get(r.id),
          _score: score.total,
        } as SearchResult & { _score: number };
      })
      .sort((a, b) => b._score - a._score);

    const limit = opts.limit ?? 200;
    const out = ranked.slice(0, limit).map(({ _score, ...r }) => {
      void _score;
      return r;
    });

    searchCache.set(cacheKey, out);
    return out;
  }

  /** Records the user's query for history + suggestions. */
  recordQuery(query: string, resultCount: number): void {
    const users = useUsersStore.getState();
    const userId = users.currentUserId;
    useSearchHistoryStore.getState().pushQuery({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      query,
      at: Date.now(),
      resultCount,
    });
  }

  /** Records that the user opened a specific result. */
  recordOpen(result: SearchResult): void {
    const users = useUsersStore.getState();
    const userId = users.currentUserId;
    useSearchHistoryStore.getState().pushOpen({
      id: `${Date.now()}-${result.id}`,
      userId,
      resultId: result.id,
      providerId: result.providerId,
      category: result.category,
      title: result.title,
      at: Date.now(),
      refType: result.ref?.refType,
      refId: result.ref?.refId,
    });
  }

  invalidateCache(): void {
    searchCache.clear();
  }
}

export const searchManager = new SearchManagerImpl();
