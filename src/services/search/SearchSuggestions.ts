import type { SearchContext } from "@/models/search";
import { useSearchHistoryStore } from "@/store/slices/searchHistoryStore";
import { searchProviderRegistry } from "./SearchProviderRegistry";

/**
 * Generic autocomplete: aggregates provider `suggest()` hooks with the
 * user's own recent query history. Deduplicated, capped.
 */
export async function getSuggestions(
  ctx: SearchContext,
  limit = 8,
): Promise<string[]> {
  const q = ctx.query.trim().toLowerCase();
  const out = new Set<string>();

  const history = useSearchHistoryStore.getState().entries;
  for (const h of history) {
    if (!q || h.query.toLowerCase().startsWith(q)) out.add(h.query);
    if (out.size >= limit) break;
  }

  const providers = searchProviderRegistry.list().filter((p) => p.suggest);
  const settled = await Promise.allSettled(
    providers.map((p) => Promise.resolve(p.suggest!(ctx))),
  );
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const sugg of s.value) {
      out.add(sugg);
      if (out.size >= limit) break;
    }
    if (out.size >= limit) break;
  }
  return [...out].slice(0, limit);
}
