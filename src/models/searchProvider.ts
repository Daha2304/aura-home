import type { PermissionResource } from "./permission";
import type {
  SearchCategory,
  SearchContext,
  SearchResult,
} from "./search";

/**
 * Registry descriptor for a search source. Providers may implement either
 * `search()` (direct query) or `index()` (feeds the shared SearchIndex).
 * Both may co-exist — the SearchManager merges results and deduplicates
 * on id.
 */
export interface SearchProviderDescriptor {
  id: string;
  label: string;
  category: SearchCategory;
  icon?: string;
  color?: string;
  priority?: number;
  enabled?: boolean;
  /** Optional permission gate applied to every emitted result. */
  permissionResource?: PermissionResource;
  /** Optional weight multiplier for the ranking function. */
  weight?: number;

  /** Direct query. Return synchronously or async; SearchManager awaits. */
  search?: (
    ctx: SearchContext,
  ) => SearchResult[] | Promise<SearchResult[]>;

  /**
   * Optional snapshot for the incremental SearchIndex. Called on demand
   * and after `invalidate` signals. Provider guarantees stable ids.
   */
  index?: () => SearchResult[];

  /**
   * Optional autocomplete suggestions (short strings, no rendering).
   */
  suggest?: (ctx: SearchContext) => string[] | Promise<string[]>;

  /** Notifies the provider that cached results should be dropped. */
  invalidate?: () => void;
}
